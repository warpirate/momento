-- Add missing sentiment_score column if it doesn't exist
-- This migration fixes the sync error where sentiment_score column is missing

DO $$
BEGIN
    -- Check if the column exists in entry_signals table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'entry_signals' 
        AND column_name = 'sentiment_score'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing column
        ALTER TABLE public.entry_signals 
        ADD COLUMN sentiment_score float;
        
        RAISE NOTICE 'Added sentiment_score column to entry_signals table';
    ELSE
        RAISE NOTICE 'sentiment_score column already exists in entry_signals table';
    END IF;
END $$;

-- Also ensure other expected columns exist
DO $$
BEGIN
    -- Check and add activities column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'entry_signals' 
        AND column_name = 'activities'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN activities text[];
        RAISE NOTICE 'Added activities column to entry_signals table';
    END IF;
    
    -- Check and add people column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'entry_signals' 
        AND column_name = 'people'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN people text[];
        RAISE NOTICE 'Added people column to entry_signals table';
    END IF;
    
    -- Check and add tags column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'entry_signals' 
        AND column_name = 'tags'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN tags text[];
        RAISE NOTICE 'Added tags column to entry_signals table';
    END IF;
    
    -- Check and add mood column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'entry_signals' 
        AND column_name = 'mood'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.entry_signals 
        ADD COLUMN mood text;
        RAISE NOTICE 'Added mood column to entry_signals table';
    END IF;
END $$;
