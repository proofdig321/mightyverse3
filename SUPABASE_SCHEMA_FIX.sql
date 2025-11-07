-- CRITICAL: Apply this schema to Supabase to fix 404 errors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core tables needed for admin dashboard
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

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet VARCHAR(42) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'animator', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS murals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist_wallet VARCHAR(42) NOT NULL,
    description TEXT,
    total_duration INTEGER DEFAULT 120,
    animator_versions TEXT[] DEFAULT ARRAY['futuristic', 'gritty', 'cultural'],
    default_version VARCHAR(50) DEFAULT 'futuristic',
    status VARCHAR(20) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    asset_type VARCHAR(50) DEFAULT 'media',
    file_cid VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    quality_score FLOAT DEFAULT 0.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    content_id UUID,
    content_type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO users (wallet, role) VALUES 
('0x860Ec697167Ba865DdE1eC9e172004100613e970', 'admin')
ON CONFLICT (wallet) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_campaign ON stream_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_placements_stream ON placements(stream_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet);
CREATE INDEX IF NOT EXISTS idx_murals_artist ON murals(artist_wallet);
CREATE INDEX IF NOT EXISTS idx_assets_creator ON assets(creator_wallet);