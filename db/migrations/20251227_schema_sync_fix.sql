-- Schema Sync Fix - Add missing columns for curation functionality
-- Non-breaking migration to resolve DNS and schema issues

-- Add missing curation columns to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS curated BOOLEAN DEFAULT false;

-- Add missing columns for enhanced functionality
ALTER TABLE assets ADD COLUMN IF NOT EXISTS thumbnail_cid VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS dimensions JSONB;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS license_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add Livepeer integration columns if missing
ALTER TABLE assets ADD COLUMN IF NOT EXISTS livepeer_asset_id TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS livepeer_playback_id TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS livepeer_playback_url TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS livepeer_status VARCHAR(20);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS export_status VARCHAR(20);

-- Create function for SQL execution (if not exists)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Update existing records to have proper defaults
UPDATE assets SET is_curated = false WHERE is_curated IS NULL;
UPDATE assets SET curated = false WHERE curated IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_is_curated ON assets(is_curated);
CREATE INDEX IF NOT EXISTS idx_assets_curated ON assets(curated);
CREATE INDEX IF NOT EXISTS idx_assets_livepeer_playback ON assets(livepeer_playback_id);

-- Add comment for tracking
COMMENT ON TABLE assets IS 'Enhanced assets table with curation and Livepeer support - Updated 2025-01-27';