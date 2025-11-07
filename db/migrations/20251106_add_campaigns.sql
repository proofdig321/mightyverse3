-- Add campaigns, placements, stream_sessions and outbox tables (additive migration)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL,
  name TEXT NOT NULL,
  creative_cid TEXT,
  budget NUMERIC DEFAULT 0,
  state VARCHAR(32) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  stream_session_id UUID NULL,
  start_ms BIGINT NOT NULL,
  duration_ms BIGINT NOT NULL,
  card_cid TEXT NOT NULL,
  layer INT DEFAULT 0,
  z INT DEFAULT 10,
  state VARCHAR(32) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  channel_id TEXT,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  manifest_cid TEXT,
  recording_cid TEXT,
  playback_url TEXT
);

CREATE TABLE IF NOT EXISTS outbox (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type TEXT,
  aggregate_id UUID,
  event_type TEXT,
  payload JSONB,
  processed_at TIMESTAMP NULL,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
