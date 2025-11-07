#!/usr/bin/env node
/**
 * Redis-backed broadcaster for local/dev: subscribes to an 'outbox' channel and
 * broadcasts events to connected WebSocket clients. Useful for scaling tests.
 */
const WebSocket = require('ws');

const REDIS_URL = process.env.REDIS_URL || null;
if (!REDIS_URL) {
  console.error('REDIS_URL not configured; redis_broadcaster will exit');
  process.exit(1);
}

async function main() {
  // lazy import to keep startup fast
  const { createClient } = require('redis');
  const sub = createClient({ url: REDIS_URL });
  sub.on('error', (e) => console.error('redis sub error', e));
  await sub.connect();

  const wss = new WebSocket.Server({ port: process.env.WS_PORT ? Number(process.env.WS_PORT) : 8081 });
  console.log('Redis broadcaster listening for WS on port', process.env.WS_PORT || 8081);

  wss.on('connection', (ws, req) => {
    console.log('WS client connected', req.socket.remoteAddress);
  });

  await sub.subscribe('outbox', (message) => {
    try {
      const obj = JSON.parse(message);
      // Broadcast to connected clients
      wss.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(obj));
      });
    } catch (err) {
      console.error('Failed to parse outbox message', err);
    }
  });
}

main().catch((err) => {
  console.error('redis_broadcaster fatal', err);
  process.exit(1);
});
