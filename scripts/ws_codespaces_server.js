#!/usr/bin/env node
/**
 * Codespaces WebSocket Server with HTTPS Support
 */

const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const { jwtVerify } = require('jose');

class CodespacesWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map();
    this.secret = new TextEncoder().encode(process.env.JWT_SECRET || 'mighty_verse_jwt_secret_change_in_production_2024');
    
    // Create HTTP server for Codespaces (GitHub handles HTTPS termination)
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ 
      server: this.server,
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.setupEventHandlers();
  }

  async verifyClient(info) {
    try {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token') || this.extractTokenFromHeader(info.req.headers.authorization);
      
      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }
      
      const { payload } = await jwtVerify(token, this.secret);
      info.req.user = payload;
      console.log(`WebSocket auth successful for user: ${payload.sub}`);
      return true;
    } catch (error) {
      console.error('WebSocket auth failed:', error.message);
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
      const clientId = `${user.sub}_${user.sessionId || Date.now()}`;
      
      this.clients.set(clientId, {
        ws,
        user,
        connectedAt: new Date(),
        lastPing: new Date(),
        channels: new Set(['general'])
      });

      console.log(`✅ Client connected: ${clientId} (${user.roles?.join(', ') || 'no roles'})`);

      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`❌ Client disconnected: ${clientId}`);
      });

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) client.lastPing = new Date();
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        user: user.sub,
        roles: user.roles || [],
        channels: ['general'],
        timestamp: new Date().toISOString(),
        server: 'Codespaces WebSocket Server'
      }));
    });

    // Health check and ping clients every 30 seconds
    setInterval(() => {
      this.pingClients();
    }, 30000);
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);
      
      if (!client) return;

      console.log(`📨 Message from ${clientId}:`, message.type);

      switch (message.type) {
        case 'ping':
          client.ws.send(JSON.stringify({ 
            type: 'pong', 
            timestamp: new Date().toISOString() 
          }));
          break;
        
        case 'subscribe':
          this.handleSubscription(clientId, message.channel);
          break;
        
        case 'broadcast':
          this.handleBroadcast(clientId, message);
          break;
        
        case 'test':
          client.ws.send(JSON.stringify({
            type: 'test_response',
            message: 'WebSocket server is working!',
            timestamp: new Date().toISOString()
          }));
          break;
        
        default:
          console.log(`❓ Unknown message type: ${message.type}`);
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
      'admin': ['admin', 'system', 'analytics', 'general'],
      'animator': ['animator', 'assets', 'uploads', 'general'],
      'sponsor': ['sponsor', 'campaigns', 'general'],
      'user': ['general', 'notifications']
    };

    const userRoles = client.user.roles || ['user'];
    const hasAccess = userRoles.some(role => 
      allowedChannels[role]?.includes(channel)
    );

    if (hasAccess) {
      client.channels.add(channel);
      
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        channel,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`📺 ${clientId} subscribed to ${channel}`);
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

    let broadcastCount = 0;
    
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
        
        broadcastCount++;
      }
    });
    
    console.log(`📡 Broadcast to ${broadcastCount} clients in ${message.channel}`);
  }

  pingClients() {
    const now = new Date();
    let disconnected = 0;
    
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        // Disconnect clients that haven't responded to ping in 2 minutes
        if (now - client.lastPing > 120000) {
          console.log(`⏰ Disconnecting inactive client: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
          disconnected++;
        } else {
          client.ws.ping();
        }
      }
    });
    
    if (disconnected > 0) {
      console.log(`🧹 Cleaned up ${disconnected} inactive connections`);
    }
  }

  broadcast(channel, data, excludeRoles = []) {
    let broadcastCount = 0;
    
    this.clients.forEach((client) => {
      if (client.channels?.has(channel) &&
          !client.user.roles?.some(role => excludeRoles.includes(role)) &&
          client.ws.readyState === WebSocket.OPEN) {
        
        client.ws.send(JSON.stringify({
          type: 'broadcast',
          channel,
          data,
          timestamp: new Date().toISOString()
        }));
        
        broadcastCount++;
      }
    });
    
    console.log(`📡 System broadcast to ${broadcastCount} clients in ${channel}`);
    return broadcastCount;
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      clientsByRole: this.getClientsByRole(),
      uptime: process.uptime(),
      server: 'Codespaces WebSocket Server',
      port: this.port
    };
  }

  getClientsByRole() {
    const roleStats = {};
    this.clients.forEach((client) => {
      const roles = client.user.roles || ['user'];
      roles.forEach(role => {
        roleStats[role] = (roleStats[role] || 0) + 1;
      });
    });
    return roleStats;
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 Codespaces WebSocket Server running on port ${this.port}`);
      console.log(`🌐 External URL: wss://fuzzy-parakeet-6vgwwrxqw7r3674-${this.port}.app.github.dev`);
      console.log(`📊 Stats endpoint: http://localhost:${this.port}/stats`);
    });

    // Add HTTP endpoint for stats and health check
    this.server.on('request', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      
      if (req.url === '/stats') {
        res.writeHead(200);
        res.end(JSON.stringify(this.getStats(), null, 2));
      } else if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ 
          status: 'healthy', 
          clients: this.clients.size,
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down WebSocket server...');
      this.wss.close(() => {
        this.server.close(() => {
          console.log('✅ WebSocket server shut down gracefully');
          process.exit(0);
        });
      });
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new CodespacesWebSocketServer(process.env.WS_PORT || 8080);
  server.start();
}

module.exports = CodespacesWebSocketServer;