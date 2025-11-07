-- Add outbox_dlq table to capture permanently failed outbox events
CREATE TABLE IF NOT EXISTS outbox_dlq (
  id BIGSERIAL PRIMARY KEY,
  outbox_id BIGINT,
  aggregate_type TEXT,
  aggregate_id UUID,
  event_type TEXT,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT now()
);
