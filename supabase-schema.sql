-- Supabase Schema for The Mighty Verse Livepeer Integration
-- Run this in your Supabase SQL editor

CREATE TABLE asset_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ipfs_cid TEXT NOT NULL UNIQUE,
  livepeer_asset_id TEXT,
  livepeer_playback_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploader_wallet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_asset_streams_ipfs_cid ON asset_streams(ipfs_cid);
CREATE INDEX idx_asset_streams_playback_id ON asset_streams(livepeer_playback_id);
CREATE INDEX idx_asset_streams_status ON asset_streams(status);

-- Enable Row Level Security
ALTER TABLE asset_streams ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access
CREATE POLICY "Allow public read access" ON asset_streams
  FOR SELECT USING (true);

-- Policy to allow authenticated insert/update
CREATE POLICY "Allow authenticated insert" ON asset_streams
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON asset_streams
  FOR UPDATE USING (true);