-- Asset Streams Table for Livepeer Integration
CREATE TABLE IF NOT EXISTS asset_streams (
  id SERIAL PRIMARY KEY,
  ipfs_cid TEXT NOT NULL UNIQUE,
  livepeer_asset_id TEXT,
  livepeer_playback_id TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  name TEXT,
  uploader_wallet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast CID lookups
CREATE INDEX IF NOT EXISTS idx_asset_streams_cid ON asset_streams(ipfs_cid);
CREATE INDEX IF NOT EXISTS idx_asset_streams_status ON asset_streams(status);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_asset_streams_updated_at 
    BEFORE UPDATE ON asset_streams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();