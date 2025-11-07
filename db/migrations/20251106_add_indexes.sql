-- Add indexes to speed placement and outbox queries
CREATE INDEX IF NOT EXISTS idx_placements_stream_start ON placements (stream_session_id, start_ms);
CREATE INDEX IF NOT EXISTS idx_outbox_processed_created ON outbox (processed_at, created_at);
CREATE INDEX IF NOT EXISTS idx_placements_stream ON placements (stream_session_id);
