-- Migration: 2025-12-03 - Media, Search, and Sync Updates (FIXED)

-- ============================================================================
-- 1. ENSURE COLUMNS EXIST
-- ============================================================================

DO $$
BEGIN
    -- Add images column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'images') THEN
        ALTER TABLE public.entries ADD COLUMN images text;
        COMMENT ON COLUMN public.entries.images IS 'JSON string array of image URIs';
    END IF;

    -- Add voice_note column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entries' AND column_name = 'voice_note') THEN
        ALTER TABLE public.entries ADD COLUMN voice_note text;
        COMMENT ON COLUMN public.entries.voice_note IS 'Path to voice note file';
    END IF;
END $$;

-- ============================================================================
-- 2. STORAGE SETUP
-- ============================================================================

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Policies (Drop first to avoid conflicts if re-running)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('images', 'voice-notes') );

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id IN ('images', 'voice-notes') );

CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id IN ('images', 'voice-notes') );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id IN ('images', 'voice-notes') );


-- ============================================================================
-- 3. VECTOR SEARCH SETUP
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to entries
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for faster search
CREATE INDEX IF NOT EXISTS entries_embedding_idx ON public.entries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create search function
CREATE OR REPLACE FUNCTION match_entries (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    entries.id,
    entries.content,
    1 - (entries.embedding <=> query_embedding) AS similarity
  FROM entries
  WHERE 1 - (entries.embedding <=> query_embedding) > match_threshold
  AND entries.user_id = auth.uid() -- Only search user's own entries
  ORDER BY entries.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ============================================================================
-- 4. UPDATE SYNC FUNCTIONS (Include images, voice_note, AND RATINGS)
-- ============================================================================

-- Update pull_changes
CREATE OR REPLACE FUNCTION public.pull_changes(last_pulled_at bigint, schema_version int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _ts timestamp with time zone;
  _entries jsonb;
  _signals jsonb;
BEGIN
  _ts := to_timestamp(last_pulled_at / 1000);

  -- Pull entries
  SELECT jsonb_agg(t) INTO _entries
  FROM (
    SELECT
      id,
      content,
      user_id,
      sleep_rating,  -- Restored
      energy_rating, -- Restored
      mood_rating,   -- Restored
      images,
      voice_note,
      CAST(EXTRACT(epoch FROM created_at) * 1000 AS bigint) AS created_at,
      CAST(EXTRACT(epoch FROM updated_at) * 1000 AS bigint) AS updated_at
    FROM public.entries
    WHERE updated_at > _ts
    AND user_id = auth.uid()
  ) t;

  -- Pull signals
  SELECT jsonb_agg(t) INTO _signals
  FROM (
    SELECT
      id,
      entry_id,
      COALESCE(mood, '') AS mood,
      CASE 
        WHEN activities IS NULL THEN '[]'::jsonb
        WHEN jsonb_typeof(activities) = 'array' THEN activities
        ELSE '[]'::jsonb
      END AS activities,
      CASE 
        WHEN people IS NULL THEN '[]'::jsonb
        WHEN jsonb_typeof(people) = 'array' THEN people
        ELSE '[]'::jsonb
      END AS people,
      sentiment_score,
      CASE 
        WHEN tags IS NULL THEN '[]'::jsonb
        ELSE to_jsonb(tags)
      END AS tags,
      CAST(EXTRACT(epoch FROM created_at) * 1000 AS bigint) AS created_at
    FROM public.entry_signals
    WHERE created_at > _ts
    AND EXISTS (
      SELECT 1 FROM public.entries 
      WHERE id = entry_signals.entry_id 
      AND user_id = auth.uid()
    )
  ) t;

  RETURN jsonb_build_object(
    'changes', jsonb_build_object(
      'entries', jsonb_build_object(
        'created', COALESCE(_entries, '[]'::jsonb),
        'updated', '[]'::jsonb,
        'deleted', '[]'::jsonb
      ),
      'entry_signals', jsonb_build_object(
        'created', COALESCE(_signals, '[]'::jsonb),
        'updated', '[]'::jsonb,
        'deleted', '[]'::jsonb
      )
    ),
    'timestamp', CAST(EXTRACT(epoch FROM now()) * 1000 AS bigint)
  );
END;
$$;

-- Update push_changes
CREATE OR REPLACE FUNCTION public.push_changes(changes jsonb, last_pulled_at bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _entry jsonb;
  _signal jsonb;
BEGIN
  -- Process entries
  IF (changes->'entries'->>'created') IS NOT NULL THEN
    FOR _entry IN SELECT * FROM jsonb_array_elements(changes->'entries'->'created') LOOP
      INSERT INTO public.entries (
        id, 
        content, 
        user_id, 
        sleep_rating,   -- Restored
        energy_rating,  -- Restored
        mood_rating,    -- Restored
        images, 
        voice_note, 
        created_at, 
        updated_at
      )
      VALUES (
        (_entry->>'id')::uuid,
        _entry->>'content',
        auth.uid(),
        (_entry->>'sleep_rating')::integer,  -- Restored
        (_entry->>'energy_rating')::integer, -- Restored
        _entry->>'mood_rating',              -- Restored
        _entry->>'images',
        _entry->>'voice_note',
        to_timestamp((_entry->>'created_at')::bigint / 1000),
        to_timestamp((_entry->>'updated_at')::bigint / 1000)
      )
      ON CONFLICT (id) DO UPDATE SET
        content = excluded.content,
        sleep_rating = excluded.sleep_rating,   -- Restored
        energy_rating = excluded.energy_rating, -- Restored
        mood_rating = excluded.mood_rating,     -- Restored
        images = excluded.images,
        voice_note = excluded.voice_note,
        updated_at = excluded.updated_at;
    END LOOP;
  END IF;

  IF (changes->'entries'->>'updated') IS NOT NULL THEN
    FOR _entry IN SELECT * FROM jsonb_array_elements(changes->'entries'->'updated') LOOP
      UPDATE public.entries
      SET
        content = _entry->>'content',
        sleep_rating = (_entry->>'sleep_rating')::integer,   -- Restored
        energy_rating = (_entry->>'energy_rating')::integer, -- Restored
        mood_rating = _entry->>'mood_rating',                -- Restored
        images = _entry->>'images',
        voice_note = _entry->>'voice_note',
        updated_at = to_timestamp((_entry->>'updated_at')::bigint / 1000)
      WHERE id = (_entry->>'id')::uuid 
      AND user_id = auth.uid();
    END LOOP;
  END IF;

  -- Process signals (Same as before)
  IF (changes->'entry_signals'->>'created') IS NOT NULL THEN
    FOR _signal IN SELECT * FROM jsonb_array_elements(changes->'entry_signals'->'created') LOOP
      INSERT INTO public.entry_signals (
        id, 
        entry_id, 
        mood, 
        activities, 
        people, 
        sentiment_score, 
        tags, 
        created_at
      )
      VALUES (
        (_signal->>'id')::uuid,
        (_signal->>'entry_id')::uuid,
        CASE 
          WHEN (_signal->>'mood') IS NULL OR (_signal->>'mood') = '' 
          THEN NULL 
          ELSE _signal->>'mood' 
        END,
        CASE 
          WHEN _signal->'activities' IS NULL OR jsonb_typeof(_signal->'activities') = 'null'
          THEN '[]'::jsonb
          WHEN jsonb_typeof(_signal->'activities') = 'array'
          THEN _signal->'activities'
          ELSE '[]'::jsonb
        END,
        CASE 
          WHEN _signal->'people' IS NULL OR jsonb_typeof(_signal->'people') = 'null'
          THEN '[]'::jsonb
          WHEN jsonb_typeof(_signal->'people') = 'array'
          THEN _signal->'people'
          ELSE '[]'::jsonb
        END,
        CASE 
          WHEN (_signal->>'sentiment_score') IS NULL OR (_signal->>'sentiment_score') = '' 
          THEN NULL 
          ELSE (_signal->>'sentiment_score')::double precision 
        END,
        CASE 
          WHEN _signal->'tags' IS NULL OR jsonb_typeof(_signal->'tags') = 'null'
          THEN ARRAY[]::text[]
          WHEN jsonb_typeof(_signal->'tags') = 'array'
          THEN (SELECT array_agg(x) FROM jsonb_array_elements_text(_signal->'tags') t(x))
          ELSE ARRAY[]::text[]
        END,
        to_timestamp((_signal->>'created_at')::bigint / 1000)
      )
      ON CONFLICT (id) DO UPDATE SET
        mood = excluded.mood,
        activities = excluded.activities,
        people = excluded.people,
        sentiment_score = excluded.sentiment_score,
        tags = excluded.tags;
    END LOOP;
  END IF;

END;
$$;
