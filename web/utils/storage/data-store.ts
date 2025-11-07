/**
 * Data Store - Real-time data management
 * Replaces mock data with IPFS-backed storage
 */

import { ipfsClient } from './ipfs-client';

interface MediaMetadata {
  fileCid?: string;
  thumbnailCid?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  frameRate?: number;
  isrc?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface DataStore {
  assets: string;
  campaigns: string;
  submissions: string;
  sponsors: string;
  users: string;
  mintRequests: string;
  roles: string;
}

const STORE_KEY = 'mv-data-store';

class DataManager {
  private store: DataStore | null = null;

  async getStore(): Promise<DataStore> {
    if (!this.store) {
      const stored = localStorage.getItem(STORE_KEY);
      
      if (stored) {
        try {
          this.store = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse localStorage:', error);
          localStorage.removeItem(STORE_KEY);
          this.store = null;
          return this.getStore();
        }
      } else {
        this.store = {
          assets: await ipfsClient.pin([], 'assets-registry'),
          campaigns: await ipfsClient.pin([], 'campaigns-registry'),
          submissions: await ipfsClient.pin([], 'submissions-registry'),
          sponsors: await ipfsClient.pin([], 'sponsors-registry'),
          users: await ipfsClient.pin([], 'users-registry'),
          mintRequests: await ipfsClient.pin([], 'mint-requests-registry'),
          roles: await ipfsClient.pin([], 'roles-registry')
        };
        localStorage.setItem(STORE_KEY, JSON.stringify(this.store));
      }
    }
    return this.store!;
  }

  async getData(type: keyof DataStore): Promise<any[]> {
    const store = await this.getStore();
    const cid = store[type];
    
    try {
      const data = await ipfsClient.fetch(cid);
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      throw error;
    }
  }

  async saveData(type: keyof DataStore, data: any[]): Promise<void> {
    const store = await this.getStore();
    const newCid = await ipfsClient.pin(data, `${type}-registry`);
    store[type] = newCid;
    this.store = store;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  async addItem(type: keyof DataStore, item: any): Promise<void> {
    const data = await this.getData(type);
    
    if (type === 'assets' && item.fileCid) {
      const existing = data.find(asset => asset.fileCid === item.fileCid);
      if (existing) {
        throw new Error(`File already uploaded as "${existing.name}".`);
      }
    }
    
    data.push({ ...item, id: Date.now().toString(), createdAt: new Date().toISOString() });
    await this.saveData(type, data);
  }

  async updateItem(type: keyof DataStore, id: string, updates: any): Promise<void> {
    const data = await this.getData(type);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
      await this.saveData(type, data);
    }
  }

  async deleteItem(type: keyof DataStore, id: string): Promise<void> {
    const data = await this.getData(type);
    const filtered = data.filter(item => item.id !== id);
    await this.saveData(type, filtered);
  }

  async getItemsByField(type: keyof DataStore, field: string, value: any): Promise<any[]> {
    const data = await this.getData(type);
    return data.filter(item => item[field] === value);
  }
}

export const dataManager = new DataManager();