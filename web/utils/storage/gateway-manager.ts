/**
 * Gateway Manager - DNS Resolution & Fallback System
 * Handles IPFS and Livepeer gateway failures with intelligent fallback
 */

import { circuitBreaker } from './circuit-breaker';
import { validateCID } from './cid-validator';

interface GatewayConfig {
  url: string;
  priority: number;
  timeout: number;
  retries: number;
  status: 'active' | 'degraded' | 'failed';
  lastCheck: number;
}

class GatewayManager {
  private ipfsGateways: GatewayConfig[] = [
    { url: 'https://ipfs.io/ipfs/', priority: 1, timeout: 5000, retries: 2, status: 'active', lastCheck: 0 },
    { url: 'https://gateway.pinata.cloud/ipfs/', priority: 2, timeout: 5000, retries: 2, status: 'active', lastCheck: 0 },
    { url: 'https://w3s.link/ipfs/', priority: 3, timeout: 8000, retries: 1, status: 'active', lastCheck: 0 },
    { url: 'https://dweb.link/ipfs/', priority: 4, timeout: 10000, retries: 1, status: 'active', lastCheck: 0 }
  ];

  private livepeerEndpoints: GatewayConfig[] = [
    { url: 'https://lp-playback.com/hls/', priority: 1, timeout: 5000, retries: 2, status: 'active', lastCheck: 0 },
    { url: 'https://livepeercdn.com/hls/', priority: 2, timeout: 8000, retries: 1, status: 'active', lastCheck: 0 }
  ];

  private cache = new Map<string, { url: string; timestamp: number }>();
  private healthCheckInterval = 300000; // 5 minutes

  constructor() {
    if (typeof window !== 'undefined') {
      this.startHealthChecks();
    }
  }

  async getIPFSUrl(cid: string): Promise<string> {
    // Check for null/undefined/empty CID
    if (!cid || cid.trim() === '') {
      throw new Error('CID is required and cannot be empty');
    }

    // Validate CID format
    const validation = validateCID(cid);
    if (!validation.isValid) {
      console.warn(`Invalid IPFS CID: ${cid} - ${validation.error}`);
      throw new Error(`Invalid IPFS CID: ${cid} - ${validation.error}`);
    }

    // Check circuit breaker
    if (circuitBreaker.isOpen(cid)) {
      console.warn(`Circuit breaker open for CID: ${cid}`);
      throw new Error(`Circuit breaker open for CID: ${cid}`);
    }

    const cacheKey = `ipfs_${cid}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.url;
    }

    const activeGateways = this.ipfsGateways
      .filter(g => g.status !== 'failed')
      .sort((a, b) => a.priority - b.priority);

    for (const gateway of activeGateways) {
      const url = `${gateway.url}${cid}`;
      
      if (await this.testUrl(url, gateway.timeout)) {
        this.cache.set(cacheKey, { url, timestamp: Date.now() });
        circuitBreaker.recordSuccess(cid);
        return url;
      } else {
        this.markGatewayDegraded(gateway);
      }
    }

    // Record failure and throw error instead of fallback
    circuitBreaker.recordFailure(cid);
    throw new Error(`All IPFS gateways failed for CID: ${cid}`);
  }

  async getLivepeerUrl(playbackId: string): Promise<string> {
    const cacheKey = `livepeer_${playbackId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.url;
    }

    const activeEndpoints = this.livepeerEndpoints
      .filter(e => e.status !== 'failed')
      .sort((a, b) => a.priority - b.priority);

    for (const endpoint of activeEndpoints) {
      const url = `${endpoint.url}${playbackId}/index.m3u8`;
      
      if (await this.testUrl(url, endpoint.timeout)) {
        this.cache.set(cacheKey, { url, timestamp: Date.now() });
        return url;
      } else {
        this.markGatewayDegraded(endpoint);
      }
    }

    // Fallback to first endpoint
    const fallbackUrl = `${this.livepeerEndpoints[0].url}${playbackId}/index.m3u8`;
    this.cache.set(cacheKey, { url: fallbackUrl, timestamp: Date.now() });
    return fallbackUrl;
  }

  private async testUrl(url: string, timeout: number): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  private markGatewayDegraded(gateway: GatewayConfig) {
    gateway.status = 'degraded';
    gateway.lastCheck = Date.now();
  }

  private async startHealthChecks() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  private async performHealthChecks() {
    const allGateways = [...this.ipfsGateways, ...this.livepeerEndpoints];
    
    for (const gateway of allGateways) {
      if (gateway.status === 'degraded' && Date.now() - gateway.lastCheck > this.healthCheckInterval) {
        const testUrl = gateway.url.includes('ipfs') 
          ? `${gateway.url}QmTest` 
          : `${gateway.url}test/index.m3u8`;
          
        if (await this.testUrl(testUrl, gateway.timeout)) {
          gateway.status = 'active';
        } else {
          gateway.status = 'failed';
        }
        gateway.lastCheck = Date.now();
      }
    }
  }

  getGatewayStatus() {
    return {
      ipfs: this.ipfsGateways.map(g => ({ url: g.url, status: g.status, priority: g.priority })),
      livepeer: this.livepeerEndpoints.map(e => ({ url: e.url, status: e.status, priority: e.priority })),
      cacheSize: this.cache.size
    };
  }

  clearCache(cid?: string): void {
    if (cid) {
      this.cache.delete(`ipfs_${cid}`);
      this.cache.delete(`livepeer_${cid}`);
      circuitBreaker.reset(cid);
    } else {
      this.cache.clear();
      circuitBreaker.resetAll();
    }
  }
}

export const gatewayManager = new GatewayManager();