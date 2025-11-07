#!/usr/bin/env node
/**
 * Production WebSocket Server with JWT Authentication
 */

const WebSocket = require('ws');
const { createServer } = require('http');
const { parse } = require('url');
const { jwtVerify } = require('jose');

class AuthenticatedWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map();
    this.secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key-change-in-production');
    
    this.server = createServer();
    this.wss = new WebSocket.Server({ 
      server: this.server,
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.setupEventHandlers();
  }

  async verifyClient(info) {
    try {
      const { query } = parse(info.req.url, true);
      const token = query.token || this.extractTokenFromHeader(info.req.headers.authorization);
      
      if (!token) return false;
      
      const { payload } = await jwtVerify(token, this.secret);
      info.req.user = payload;
      return true;
    } catch (error) {
      console.error('WebSocket auth failed:', error);
      return false;
    }
  }

  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      const user = req.user;
      const clientId = `${user.sub}_${user.sessionId}`;
      
      this.clients.set(clientId, {
        ws,
        user,
        connectedAt: new Date(),
        lastPing: new Date()
      });

      console.log(`Client connected: ${clientId} (${user.roles.join(', ')})`);

      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) client.lastPing = new Date();
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        user: user.sub,
        roles: user.roles,
        timestamp: new Date().toISOString()
      }));
    });

    // Ping clients every 30 seconds
    setInterval(() => {
      this.pingClients();
    }, 30000);
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);
      
      if (!client) return;

      switch (message.type) {
        case 'ping':
          client.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
        
        case 'subscribe':
          this.handleSubscription(clientId, message.channel);
          break;
        
        case 'broadcast':
          this.handleBroadcast(clientId, message);
          break;
        
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  handleSubscription(clientId, channel) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Role-based channel access
    const allowedChannels = {
      'admin': ['admin', 'system', 'analytics'],
      'animator': ['animator', 'assets', 'uploads'],
      'sponsor': ['sponsor', 'campaigns'],
      'user': ['general', 'notifications']
    };

    const userRoles = client.user.roles;
    const hasAccess = userRoles.some(role => 
      allowedChannels[role]?.includes(channel)
    );

    if (hasAccess) {
      client.channels = client.channels || new Set();
      client.channels.add(channel);
      
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        channel,
        timestamp: new Date().toISOString()
      }));
    } else {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: `Access denied to channel: ${channel}`,
        timestamp: new Date().toISOString()
      }));
    }
  }

  handleBroadcast(clientId, message) {
    const sender = this.clients.get(clientId);
    if (!sender) return;

    // Broadcast to all clients in the same channel
    this.clients.forEach((client, id) => {
      if (id !== clientId && 
          client.channels?.has(message.channel) &&
          client.ws.readyState === WebSocket.OPEN) {
        
        client.ws.send(JSON.stringify({
          type: 'message',
          channel: message.channel,
          from: sender.user.sub,
          data: message.data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  pingClients() {
    const now = new Date();
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        // Disconnect clients that haven't responded to ping in 2 minutes
        if (now - client.lastPing > 120000) {
          console.log(`Disconnecting inactive client: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
        } else {
          client.ws.ping();
        }
      }
    });
  }

  broadcast(channel, data, excludeRoles = []) {
    this.clients.forEach((client) => {
      if (client.channels?.has(channel) &&
          !client.user.roles.some(role => excludeRoles.includes(role)) &&
          client.ws.readyState === WebSocket.OPEN) {
        
        client.ws.send(JSON.stringify({
          type: 'broadcast',
          channel,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      clientsByRole: this.getClientsByRole(),
      uptime: process.uptime()
    };
  }

  getClientsByRole() {
    const roleStats = {};
    this.clients.forEach((client) => {
      client.user.roles.forEach(role => {
        roleStats[role] = (roleStats[role] || 0) + 1;
      });
    });
    return roleStats;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 Authenticated WebSocket Server running on port ${this.port}`);
      console.log(`📊 Stats endpoint: http://localhost:${this.port}/stats`);
    });

    // Add HTTP endpoint for stats
    this.server.on('request', (req, res) => {
      if (req.url === '/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getStats(), null, 2));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new AuthenticatedWebSocketServer(process.env.WS_PORT || 8080);
  server.start();
}

module.exports = AuthenticatedWebSocketServer;