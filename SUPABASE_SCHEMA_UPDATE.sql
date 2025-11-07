-- SUPABASE SCHEMA UPDATES
-- Add missing columns to assets table for Livepeer integration

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS livepeer_asset_id TEXT,
ADD COLUMN IF NOT EXISTS livepeer_playback_id TEXT,
ADD COLUMN IF NOT EXISTS livepeer_playback_url TEXT,
ADD COLUMN IF NOT EXISTS livepeer_status VARCHAR(20) DEFAULT 'pending';

-- Fix any null created_at values
UPDATE public.assets 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Fix any null creator_wallet values
UPDATE public.assets 
SET creator_wallet = '0x860Ec697167Ba865DdE1eC9e172004100613e970' 
WHERE creator_wallet IS NULL OR creator_wallet = '';

-- Ensure decks table has proper structure
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    description TEXT,
    scene_config JSONB DEFAULT '{}',
    asset_count INTEGER DEFAULT 0,
    view_mode VARCHAR(20) DEFAULT 'orbit',
    is_public BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policy for decks if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'decks' 
        AND policyname = 'Allow all operations on decks'
    ) THEN
        CREATE POLICY "Allow all operations on decks" ON public.decks FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;