#!/usr/bin/env node
/**
 * Simple outbox worker: polls the outbox table for unprocessed events
 * and marks them processed after handling. This is intentionally minimal
 * and logs events; replace handler logic with real publication (WS/kafka).
 */
const { query } = require('../db/client');
const WebSocket = require('ws');

const WS_BROADCAST_URL = process.env.WS_BROADCAST_URL || null;
const MAX_RETRIES = Number(process.env.OUTBOX_MAX_RETRIES || '5');
const BACKOFF_BASE_MS = Number(process.env.OUTBOX_BACKOFF_BASE_MS || '1000');
let wsClient = null;

let processedCounter = 0;
let failedCounter = 0;
let movedToDlqCounter = 0;

async function ensureWs() {
  if (!WS_BROADCAST_URL) return null;
  if (wsClient && wsClient.readyState === WebSocket.OPEN) return wsClient;
  // Attach token param if configured
  const token = process.env.WS_BROADCAST_TOKEN || process.env.APP_API_KEY || null;
  let url = WS_BROADCAST_URL;
  if (token) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}token=${encodeURIComponent(token)}`;
  }
  wsClient = new WebSocket(url);
  return new Promise((resolve, reject) => {
    wsClient.on('open', () => resolve(wsClient));
    wsClient.on('error', (err) => {
      console.error('Outbox worker WS error', err);
      reject(err);
    });
  });
}

// Lazy create Redis publisher when REDIS_URL is provided
let redisPub = null;
async function ensureRedis() {
  if (!process.env.REDIS_URL) return null;
  if (redisPub) return redisPub;
  try {
    // lazy require to avoid test-time import errors
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('redis');
    const client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (e) => console.error('redis pub error', e));
    await client.connect();
    redisPub = client;
    return redisPub;
  } catch (err) {
    console.error('Failed to initialize Redis publisher', err);
    return null;
  }
}

// Basic Prometheus-format metrics exposure
const http = require('http');
const METRICS_PORT = Number(process.env.OUTBOX_METRICS_PORT || '9600');
function startMetricsServer() {
  try {
    http.createServer((req, res) => {
      if (req.url === '/metrics') {
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        const lines = [];
        lines.push(`# HELP outbox_processed_total Number of processed outbox events\n`);
        lines.push(`# TYPE outbox_processed_total counter\n`);
        lines.push(`outbox_processed_total ${processedCounter}\n`);
        lines.push(`# HELP outbox_failed_total Number of failed processing attempts\n`);
        lines.push(`# TYPE outbox_failed_total counter\n`);
        lines.push(`outbox_failed_total ${failedCounter}\n`);
        lines.push(`# HELP outbox_moved_dlq_total Number of events moved to DLQ\n`);
        lines.push(`# TYPE outbox_moved_dlq_total counter\n`);
        lines.push(`outbox_moved_dlq_total ${movedToDlqCounter}\n`);
        res.end(lines.join('\n'));
      } else {
        res.statusCode = 404;
        res.end('not found');
      }
    }).listen(METRICS_PORT, () => {
      console.log('Outbox metrics listening on', METRICS_PORT);
    });
  } catch (err) {
    console.error('Failed to start metrics server', err);
  }
}

// start metrics server if enabled
if (process.env.OUTBOX_METRICS !== 'false') {
  startMetricsServer();
}

async function processNext() {
  try {
    const res = await query('SELECT id, aggregate_type, aggregate_id, event_type, payload FROM outbox WHERE processed_at IS NULL ORDER BY id LIMIT 10');
    if (!res || !res.rows || res.rows.length === 0) return 0;

    // If WS configured, ensure connection
    let ws = null;
    try {
      ws = await ensureWs();
    } catch (err) {
      // proceed without WS
      ws = null;
    }

    for (const row of res.rows) {
      console.log('Outbox processing event', row.id, row.event_type);
      try {
        // Dispatch via WS if available
        const eventObj = { id: row.id, type: row.event_type, payload: row.payload };
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(eventObj));
        } else {
          // Fallback: log the event (or integrate other brokers here)
          console.log('Outbox event:', row.event_type, row.payload);
        }

        // Publish to Redis channel for scalable fanout when configured
        try {
          const redis = await ensureRedis();
          if (redis) {
            await redis.publish('outbox', JSON.stringify(eventObj));
          }
        } catch (err) {
          console.error('Redis publish failed for outbox event', row.id, err);
        }

        // mark processed
        await query('UPDATE outbox SET processed_at = now() WHERE id = $1', [row.id]);
        processedCounter++;
      } catch (err) {
        failedCounter++;
        console.error('Failed to process outbox event', row.id, err);
        try {
          // increment retry_count
          const upd = await query('UPDATE outbox SET retry_count = COALESCE(retry_count,0) + 1 WHERE id = $1 RETURNING retry_count', [row.id]);
          const retryCount = upd && upd.rows && upd.rows[0] && upd.rows[0].retry_count ? Number(upd.rows[0].retry_count) : 0;

          if (retryCount >= MAX_RETRIES) {
            console.warn(`Outbox event ${row.id} reached max retries (${retryCount}), moving to DLQ`);
            // Insert into DLQ for operator inspection and mark processed on outbox
            await query('INSERT INTO outbox_dlq (outbox_id, aggregate_type, aggregate_id, event_type, payload, error) VALUES ($1,$2,$3,$4,$5,$6)', [row.id, row.aggregate_type, row.aggregate_id, row.event_type, row.payload, String(err)]);
            await query('UPDATE outbox SET processed_at = now() WHERE id = $1', [row.id]);
            movedToDlqCounter++;
          } else {
            // backoff sleep before next attempt
            const backoff = BACKOFF_BASE_MS * Math.pow(2, retryCount - 1);
            console.log(`Outbox event ${row.id} will be retried after ${backoff}ms (retry ${retryCount})`);
            await new Promise((r) => setTimeout(r, Math.min(backoff, 30000)));
          }
        } catch (innerErr) {
          console.error('Outbox worker retry/DLQ handling failed for', row.id, innerErr);
        }
      }
    }

    return res.rows.length;
  } catch (err) {
    console.error('Outbox worker error', err);
    return 0;
  }
}

async function runLoop() {
  while (true) {
    const n = await processNext();
    if (n === 0) await new Promise((r) => setTimeout(r, 2000));
  }
}

runLoop().catch((err) => {
  console.error('Outbox worker fatal', err);
  process.exit(1);
});
