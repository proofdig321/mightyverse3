-- Comprehensive Database Migration - Phase 1
-- Graceful upgrade with backward compatibility

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Merge existing asset_streams with new assets table structure
-- First, create new comprehensive assets table if not exists
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    asset_type VARCHAR(50) NOT NULL DEFAULT 'media',
    file_cid VARCHAR(100),
    thumbnail_cid VARCHAR(100),
    metadata_cid VARCHAR(100),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    duration INTEGER,
    dimensions JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'submitted', 'approved', 'rejected', 'published', 'archived')),
    quality_score FLOAT DEFAULT 0.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    category VARCHAR(50),
    license_type VARCHAR(50) DEFAULT 'standard',
    metadata JSONB DEFAULT '{}',
    -- Livepeer integration fields (backward compatibility)
    livepeer_asset_id TEXT,
    livepeer_playback_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Migrate existing asset_streams data if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asset_streams') THEN
        INSERT INTO assets (
            name, creator_wallet, asset_type, file_cid, 
            livepeer_asset_id, livepeer_playback_id, status,
            created_at, updated_at
        )
        SELECT 
            COALESCE(name, 'Migrated Asset'),
            COALESCE(uploader_wallet, '0x0000000000000000000000000000000000000000'),
            'video',
            ipfs_cid,
            livepeer_asset_id,
            livepeer_playback_id,
            CASE 
                WHEN status = 'ready' THEN 'published'
                WHEN status = 'failed' THEN 'rejected'
                ELSE 'processing'
            END,
            created_at,
            updated_at
        FROM asset_streams
        WHERE ipfs_cid NOT IN (SELECT file_cid FROM assets WHERE file_cid IS NOT NULL);
    END IF;
END $$;

-- Create other core tables
CREATE TABLE IF NOT EXISTS murals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist_wallet VARCHAR(42) NOT NULL,
    description TEXT,
    total_duration INTEGER NOT NULL DEFAULT 0,
    total_frames INTEGER NOT NULL DEFAULT 0,
    frame_rate INTEGER DEFAULT 16,
    default_version VARCHAR(50) DEFAULT 'futuristic',
    animator_versions TEXT[] DEFAULT ARRAY['futuristic', 'gritty', 'cultural'],
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'published', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    ipfs_hash VARCHAR(100),
    thumbnail_cid VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mural_id UUID REFERENCES murals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_frame INTEGER NOT NULL DEFAULT 0,
    end_frame INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    animator_version VARCHAR(50) NOT NULL DEFAULT 'futuristic',
    manifest_cid VARCHAR(100),
    layers JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    description TEXT,
    scene_config JSONB DEFAULT '{}',
    asset_count INTEGER DEFAULT 0,
    view_mode VARCHAR(20) DEFAULT 'orbit' CHECK (view_mode IN ('orbit', 'walk', 'fly')),
    is_public BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS deck_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('3d', 'hologram', 'audio', 'effect')),
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
    rotation JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
    scale FLOAT DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('mural', 'card', 'deck', 'asset')),
    quality_score FLOAT NOT NULL DEFAULT 0.0,
    confidence FLOAT NOT NULL DEFAULT 0.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    category VARCHAR(50),
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    issues TEXT[] DEFAULT ARRAY[]::TEXT[],
    recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
    ai_metadata JSONB DEFAULT '{}',
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzer_version VARCHAR(20) DEFAULT '1.0'
);

CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    content_id UUID,
    content_type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    current_stage INTEGER DEFAULT 0,
    total_stages INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')),
    stages JSONB NOT NULL DEFAULT '[]',
    history JSONB DEFAULT '[]',
    assigned_to VARCHAR(42),
    created_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_creator ON assets(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_cid ON assets(file_cid);
CREATE INDEX IF NOT EXISTS idx_murals_artist ON murals(artist_wallet);
CREATE INDEX IF NOT EXISTS idx_murals_status ON murals(status);
CREATE INDEX IF NOT EXISTS idx_cards_mural ON cards(mural_id);
CREATE INDEX IF NOT EXISTS idx_decks_creator ON decks(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_content_analysis_content ON content_analysis(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_states_content ON workflow_states(content_id, content_type);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('assets', 'murals', 'cards', 'decks', 'deck_assets', 'workflow_states')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW 
                       EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;