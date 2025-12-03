-- Migration: Add images column to entries table
-- Date: 2025-12-03

-- ============================================================================
-- 1. ADD IMAGES COLUMN TO ENTRIES TABLE
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entries' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE public.entries 
        ADD COLUMN images text; -- Storing as JSON string to match WatermelonDB
        COMMENT ON COLUMN public.entries.images IS 'JSON string array of image URIs';
    END IF;
END $$;

-- ============================================================================
-- 2. UPDATE SYNC FUNCTIONS
-- ============================================================================

-- Drop and recreate pull_changes function with images support
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

  -- Pull entries (including images)
  SELECT jsonb_agg(t) INTO _entries
  FROM (
    SELECT
      id,
      content,
      user_id,
      sleep_rating,
      energy_rating,
      mood_rating,
      images,
      CAST(EXTRACT(epoch FROM created_at) * 1000 AS bigint) AS created_at,
      CAST(EXTRACT(epoch FROM updated_at) * 1000 AS bigint) AS updated_at
    FROM public.entries
    WHERE updated_at > _ts
    AND user_id = auth.uid()
  ) t;

  -- Pull signals with proper type conversion
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

-- Drop and recreate push_changes function with images support
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
        sleep_rating,
        energy_rating,
        mood_rating,
        images,
        created_at, 
        updated_at
      )
      VALUES (
        (_entry->>'id')::uuid,
        _entry->>'content',
        auth.uid(),
        (_entry->>'sleep_rating')::integer,
        (_entry->>'energy_rating')::integer,
        _entry->>'mood_rating',
        _entry->>'images',
        to_timestamp((_entry->>'created_at')::bigint / 1000),
        to_timestamp((_entry->>'updated_at')::bigint / 1000)
      )
      ON CONFLICT (id) DO UPDATE SET
        content = excluded.content,
        sleep_rating = excluded.sleep_rating,
        energy_rating = excluded.energy_rating,
        mood_rating = excluded.mood_rating,
        images = excluded.images,
        updated_at = excluded.updated_at;
    END LOOP;
  END IF;

  IF (changes->'entries'->>'updated') IS NOT NULL THEN
    FOR _entry IN SELECT * FROM jsonb_array_elements(changes->'entries'->'updated') LOOP
      UPDATE public.entries
      SET
        content = _entry->>'content',
        sleep_rating = (_entry->>'sleep_rating')::integer,
        energy_rating = (_entry->>'energy_rating')::integer,
        mood_rating = _entry->>'mood_rating',
        images = _entry->>'images',
        updated_at = to_timestamp((_entry->>'updated_at')::bigint / 1000)
      WHERE id = (_entry->>'id')::uuid 
      AND user_id = auth.uid();
    END LOOP;
  END IF;

  -- Process signals (unchanged)
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