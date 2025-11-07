-- Content Management Database Schemas
-- Comprehensive schemas for murals, cards, decks, and assets

-- Murals table - holographic mural compositions
CREATE TABLE IF NOT EXISTS murals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist_wallet VARCHAR(42) NOT NULL,
    description TEXT,
    total_duration INTEGER NOT NULL, -- in seconds
    total_frames INTEGER NOT NULL,
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

-- Cards table - individual mural segments/cards
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mural_id UUID REFERENCES murals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_frame INTEGER NOT NULL,
    end_frame INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    animator_version VARCHAR(50) NOT NULL,
    manifest_cid VARCHAR(100),
    layers JSONB DEFAULT '{}', -- background, midground, foreground, depth_map_cid
    metadata JSONB DEFAULT '{}', -- confidence, qc_score, tags
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decks table - 3D scene collections
CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    description TEXT,
    scene_config JSONB DEFAULT '{}', -- 3D scene configuration
    asset_count INTEGER DEFAULT 0,
    view_mode VARCHAR(20) DEFAULT 'orbit' CHECK (view_mode IN ('orbit', 'walk', 'fly')),
    is_public BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Deck Assets table - assets within decks
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

-- Enhanced Assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    file_cid VARCHAR(100),
    thumbnail_cid VARCHAR(100),
    metadata_cid VARCHAR(100),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    duration INTEGER, -- for video/audio assets
    dimensions JSONB, -- width, height for images/videos
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'submitted', 'approved', 'rejected', 'published', 'archived')),
    quality_score FLOAT DEFAULT 0.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    category VARCHAR(50),
    license_type VARCHAR(50) DEFAULT 'standard',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Content Analysis table - AI-powered content curation
CREATE TABLE IF NOT EXISTS content_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL, -- can reference murals, cards, decks, or assets
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

-- Processing Jobs table - track IPFS and content processing
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'ipfs_upload', 'thumbnail_gen', 'analysis', etc.
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

-- Workflow States table - enhanced workflow management
CREATE TABLE IF NOT EXISTS workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL, -- 'approval', 'minting', 'publishing'
    current_stage INTEGER DEFAULT 0,
    total_stages INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')),
    stages JSONB NOT NULL DEFAULT '[]', -- array of stage definitions
    history JSONB DEFAULT '[]', -- audit trail
    assigned_to VARCHAR(42), -- wallet address
    created_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_murals_artist ON murals(artist_wallet);
CREATE INDEX IF NOT EXISTS idx_murals_status ON murals(status);
CREATE INDEX IF NOT EXISTS idx_cards_mural ON cards(mural_id);
CREATE INDEX IF NOT EXISTS idx_cards_version ON cards(animator_version);
CREATE INDEX IF NOT EXISTS idx_decks_creator ON decks(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_deck_assets_deck ON deck_assets(deck_id);
CREATE INDEX IF NOT EXISTS idx_assets_creator ON assets(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_content_analysis_content ON content_analysis(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_states_content ON workflow_states(content_id, content_type);