-- Consolidated Migration: 2025-12-03
-- This migration consolidates all previous schema changes and sync function fixes
-- It ensures the database schema matches what the application expects

-- ============================================================================
-- 1. ENSURE ENTRIES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Add source column if it doesn't exist (defaults to 'mobile')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entries' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE public.entries 
        ADD COLUMN source text NOT NULL DEFAULT 'mobile';
    END IF;
END $$;

-- Add sleep_rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entries' 
        AND column_name = 'sleep_rating'
    ) THEN
        ALTER TABLE public.entries 
        ADD COLUMN sleep_rating integer 
        CHECK (sleep_rating >= 0 AND sleep_rating <= 10);
        COMMENT ON COLUMN public.entries.sleep_rating IS 'Sleep quality rating from 0-10';
    END IF;
END $$;

-- Add energy_rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entries' 
        AND column_name = 'energy_rating'
    ) THEN
        ALTER TABLE public.entries 
        ADD COLUMN energy_rating integer 
        CHECK (energy_rating >= 0 AND energy_rating <= 10);
        COMMENT ON COLUMN public.entries.energy_rating IS 'Energy level rating from 0-10';
    END IF;
END $$;

-- Add mood_rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entries' 
        AND column_name = 'mood_rating'
    ) THEN
        ALTER TABLE public.entries 
        ADD COLUMN mood_rating text 
        CHECK (mood_rating = ANY (ARRAY['😊', '😐', '😢', '😴', '🔥', '💪', '😌', '😰', '🎉', '😔', NULL]));
        COMMENT ON COLUMN public.entries.mood_rating IS 'Quick mood emoji selection';
    END IF;
END $$;

-- ============================================================================
-- 2. ENSURE ENTRY_SIGNALS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Ensure sentiment_score exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entry_signals' 
        AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN sentiment_score double precision;
    END IF;
END $$;

-- Ensure activities exists as jsonb (for compatibility with edge function)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entry_signals' 
        AND column_name = 'activities'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN activities jsonb;
    END IF;
END $$;

-- Ensure people exists as jsonb (for compatibility with edge function)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entry_signals' 
        AND column_name = 'people'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN people jsonb;
    END IF;
END $$;

-- Ensure tags exists as text array
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entry_signals' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN tags text[];
    END IF;
END $$;

-- Ensure mood exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entry_signals' 
        AND column_name = 'mood'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN mood text;
    END IF;
END $$;

-- ============================================================================
-- 3. SYNC FUNCTIONS - FIXED AND CONSOLIDATED
-- ============================================================================

-- Drop and recreate pull_changes function with correct type handling
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

  -- Pull entries (only core fields for WatermelonDB sync)
  SELECT jsonb_agg(t) INTO _entries
  FROM (
    SELECT
      id,
      content,
      user_id,
      CAST(EXTRACT(epoch FROM created_at) * 1000 AS bigint) AS created_at,
      CAST(EXTRACT(epoch FROM updated_at) * 1000 AS bigint) AS updated_at
    FROM public.entries
    WHERE updated_at > _ts
    AND user_id = auth.uid()
  ) t;

  -- Pull signals with proper type conversion
  -- Convert jsonb arrays to jsonb arrays for WatermelonDB (which stores as JSON strings)
  SELECT jsonb_agg(t) INTO _signals
  FROM (
    SELECT
      id,
      entry_id,
      COALESCE(mood, '') AS mood,
      -- Convert jsonb to jsonb (already correct format, but ensure it's an array)
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
      -- Convert text[] to jsonb array
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

-- Drop and recreate push_changes function with correct type handling
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
      INSERT INTO public.entries (id, content, user_id, created_at, updated_at)
      VALUES (
        (_entry->>'id')::uuid,
        _entry->>'content',
        auth.uid(),
        to_timestamp((_entry->>'created_at')::bigint / 1000),
        to_timestamp((_entry->>'updated_at')::bigint / 1000)
      )
      ON CONFLICT (id) DO UPDATE SET
        content = excluded.content,
        updated_at = excluded.updated_at;
    END LOOP;
  END IF;

  IF (changes->'entries'->>'updated') IS NOT NULL THEN
    FOR _entry IN SELECT * FROM jsonb_array_elements(changes->'entries'->'updated') LOOP
      UPDATE public.entries
      SET
        content = _entry->>'content',
        updated_at = to_timestamp((_entry->>'updated_at')::bigint / 1000)
      WHERE id = (_entry->>'id')::uuid 
      AND user_id = auth.uid();
    END LOOP;
  END IF;

  -- Process signals with proper type handling
  -- WatermelonDB sends activities/people as jsonb (stored as JSON strings in local DB)
  -- We need to handle both jsonb arrays and ensure they're stored correctly
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
        -- Handle activities: expect jsonb array from WatermelonDB
        CASE 
          WHEN _signal->'activities' IS NULL OR jsonb_typeof(_signal->'activities') = 'null'
          THEN '[]'::jsonb
          WHEN jsonb_typeof(_signal->'activities') = 'array'
          THEN _signal->'activities'
          ELSE '[]'::jsonb
        END,
        -- Handle people: expect jsonb array from WatermelonDB
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
        -- Handle tags: expect jsonb array, convert to text[]
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

-- ============================================================================
-- 4. ENSURE RLS POLICIES ARE IN PLACE
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_signals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can create their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can view signals for their own entries" ON public.entry_signals;

-- Recreate policies
CREATE POLICY "Users can create their own entries"
ON public.entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own entries"
ON public.entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
ON public.entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
ON public.entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view signals for their own entries"
ON public.entry_signals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.entries
    WHERE entries.id = entry_signals.entry_id
    AND entries.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. ENSURE UPDATED_AT TRIGGER EXISTS
-- ============================================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS handle_entries_updated_at ON public.entries;
CREATE TRIGGER handle_entries_updated_at
BEFORE UPDATE ON public.entries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

