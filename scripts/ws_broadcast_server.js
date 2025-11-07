#!/usr/bin/env node
/**
 * Simple WebSocket broadcast server for local testing.
 * Listens for incoming messages from outbox worker and broadcasts to connected clients.
 */
const WebSocket = require('ws');

const port = process.env.WS_BROADCAST_PORT || 8081;
const wss = new WebSocket.Server({ port });

wss.on('connection', (socket, request) => {
  // Simple token check using query param ?token=... when server has APP_API_KEY or WS_BROADCAST_TOKEN configured
  const serverToken = process.env.WS_BROADCAST_TOKEN || process.env.APP_API_KEY || null;
  if (serverToken) {
    try {
      const url = new URL(request.url, `http://localhost:${port}`);
      const token = url.searchParams.get('token');
      if (!token || token !== serverToken) {
        console.log('WS connection rejected: invalid token');
        socket.close(1008, 'Unauthorized');
        return;
      }
    } catch (err) {
      console.log('WS connection token parse error', err);
      socket.close(1008, 'Unauthorized');
      return;
    }
  }

  console.log('Client connected');

  socket.on('message', (data) => {
    console.log('Server received:', data.toString());
    // Echo to all clients
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(data.toString());
    }
  });

  socket.on('close', () => console.log('Client disconnected'));
});

console.log(`WS broadcast server listening on ws://0.0.0.0:${port}`);
