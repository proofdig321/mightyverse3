-- COMPLETE SUPABASE SCHEMA FIX
-- This combines the comprehensive schema with missing campaign tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== ASSETS SYSTEM =====
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
    livepeer_asset_id TEXT,
    livepeer_playback_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- ===== CAMPAIGN SYSTEM =====
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sponsor_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    budget DECIMAL(10,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    playback_url TEXT,
    playback_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
    placements_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES stream_sessions(id) ON DELETE CASCADE,
    asset_cid VARCHAR(100) NOT NULL,
    start_time INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 10,
    layer INTEGER DEFAULT 0,
    z_index INTEGER DEFAULT 10,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== MURAL SYSTEM =====
CREATE TABLE IF NOT EXISTS murals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist_wallet VARCHAR(42) NOT NULL,
    description TEXT,
    total_duration INTEGER NOT NULL DEFAULT 120,
    total_frames INTEGER NOT NULL DEFAULT 1920,
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

-- Create both cards and mural_cards for compatibility
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mural_id UUID REFERENCES murals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_frame INTEGER NOT NULL DEFAULT 0,
    end_frame INTEGER NOT NULL DEFAULT 480,
    duration INTEGER NOT NULL DEFAULT 30,
    animator_version VARCHAR(50) NOT NULL DEFAULT 'futuristic',
    manifest_cid VARCHAR(100),
    layers JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mural_cards as alias/view for compatibility
CREATE TABLE IF NOT EXISTS mural_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mural_id UUID REFERENCES murals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_frame INTEGER DEFAULT 0,
    end_frame INTEGER DEFAULT 480,
    duration INTEGER DEFAULT 30,
    animator_version VARCHAR(50) DEFAULT 'futuristic',
    asset_cid VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== DECK SYSTEM =====
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

-- ===== USER SYSTEM =====
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet VARCHAR(42) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'animator', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== PROCESSING SYSTEM =====
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

-- ===== LEGACY COMPATIBILITY =====
-- Keep asset_streams for Livepeer compatibility
CREATE TABLE IF NOT EXISTS asset_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ipfs_cid VARCHAR(100) NOT NULL,
    livepeer_asset_id TEXT,
    livepeer_playback_id TEXT,
    status VARCHAR(20) DEFAULT 'processing',
    name VARCHAR(255),
    uploader_wallet VARCHAR(42),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== SAMPLE DATA =====
INSERT INTO users (wallet, role) VALUES 
('0x860Ec697167Ba865DdE1eC9e172004100613e970', 'admin')
ON CONFLICT (wallet) DO NOTHING;

INSERT INTO murals (title, artist_wallet, description, status) VALUES 
('Genesis Holographic Experience', '0x860Ec697167Ba865DdE1eC9e172004100613e970', 'First holographic mural in The Mighty Verse', 'published')
ON CONFLICT DO NOTHING;

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_assets_creator ON assets(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_cid ON assets(file_cid);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_campaign ON stream_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_placements_stream ON placements(stream_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet);
CREATE INDEX IF NOT EXISTS idx_murals_artist ON murals(artist_wallet);
CREATE INDEX IF NOT EXISTS idx_murals_status ON murals(status);
CREATE INDEX IF NOT EXISTS idx_cards_mural ON cards(mural_id);
CREATE INDEX IF NOT EXISTS idx_mural_cards_mural ON mural_cards(mural_id);
CREATE INDEX IF NOT EXISTS idx_decks_creator ON decks(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_asset_streams_cid ON asset_streams(ipfs_cid);

-- ===== UPDATE TRIGGERS =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('assets', 'campaigns', 'stream_sessions', 'placements', 'murals', 'cards', 'mural_cards', 'decks', 'deck_assets', 'users', 'processing_jobs', 'asset_streams')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW 
                       EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;