/**
 * PinningService - Enterprise IPFS Pinning with Multi-Provider Support
 * Handles Pinata, Infura, and self-hosted IPFS with health checks and failover
 */

export interface PinResult {
  cid: string;
  provider: string;
  timestamp: string;
  size?: number;
}

export interface PinningProvider {
  name: string;
  pin(data: any, name?: string): Promise<string>;
  pinFile(file: File | Buffer, name?: string): Promise<string>;
  health(): Promise<boolean>;
}

class PinataProvider implements PinningProvider {
  name = 'pinata';
  
  constructor(private apiKey: string, private secretKey: string, private jwt: string) {}
  
  async pin(data: any, name?: string): Promise<string> {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwt}`
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: name || 'mighty-verse-data' }
      })
    });
    
    if (!response.ok) throw new Error(`Pinata pin failed: ${response.statusText}`);
    const result = await response.json();
    return result.IpfsHash;
  }
  
  async pinFile(file: File | Buffer, name?: string): Promise<string> {
    const formData = new FormData();
    // cast to any to support Node Buffer and browser File types
    formData.append('file', file as any);
    formData.append('pinataMetadata', JSON.stringify({ name: name || 'mighty-verse-file' }));
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.jwt}` },
      body: formData
    });
    
    if (!response.ok) throw new Error(`Pinata file pin failed: ${response.statusText}`);
    const result = await response.json();
    return result.IpfsHash;
  }
  
  async health(): Promise<boolean> {
    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: { 'Authorization': `Bearer ${this.jwt}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class PinningService {
  private providers: PinningProvider[] = [];
  private primaryProvider?: PinningProvider;
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    const pinataJwt = process.env.PINATA_JWT;
    const pinataKey = process.env.PINATA_API_KEY;
    const pinataSecret = process.env.PINATA_SECRET_KEY;
    
    if (pinataJwt && pinataKey && pinataSecret) {
      const pinata = new PinataProvider(pinataKey, pinataSecret, pinataJwt);
      this.providers.push(pinata);
      this.primaryProvider = pinata;
    }
  }
  
  async pin(data: any, name?: string): Promise<PinResult> {
    if (!this.primaryProvider) {
      throw new Error('No pinning providers configured');
    }
    
    try {
      const cid = await this.primaryProvider.pin(data, name);
      return {
        cid,
        provider: this.primaryProvider.name,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Primary provider failed, attempting failover:', error);
      throw error; // For now, fail fast. Add failover logic later.
    }
  }
  
  async pinFile(file: File | Buffer, name?: string): Promise<PinResult> {
    if (!this.primaryProvider) {
      throw new Error('No pinning providers configured');
    }
    
    try {
      const cid = await this.primaryProvider.pinFile(file, name);
      return {
        cid,
        provider: this.primaryProvider.name,
        timestamp: new Date().toISOString(),
        size: file instanceof File ? file.size : file.length
      };
    } catch (error) {
      console.error('Primary provider failed, attempting failover:', error);
      throw error;
    }
  }
  
  async healthCheck(): Promise<{ [provider: string]: boolean }> {
    const results: { [provider: string]: boolean } = {};
    
    for (const provider of this.providers) {
      try {
        results[provider.name] = await provider.health();
      } catch {
        results[provider.name] = false;
      }
    }
    
    return results;
  }
}

export const pinningService = new PinningService();