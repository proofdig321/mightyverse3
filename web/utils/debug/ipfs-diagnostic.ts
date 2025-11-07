/**
 * IPFS Diagnostic Tool - Comprehensive Storage Investigation
 */

import { ipfsClient } from '../storage/ipfs-client';
import { dataManager } from '../storage/data-store';

interface DiagnosticResult {
  timestamp: string;
  localStorage: {
    exists: boolean;
    data: any;
    size: number;
  };
  ipfsConnectivity: {
    gateway: string;
    accessible: boolean;
    error?: string;
  };
  dataStore: {
    assets: {
      cid: string;
      accessible: boolean;
      count: number;
      items: any[];
      error?: string;
    };
  };
  todaysUploads: any[];
}

export class IPFSDiagnostic {
  private gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

  async runFullDiagnostic(): Promise<DiagnosticResult> {
    console.log('🔍 Starting IPFS diagnostic...');
    
    const result: DiagnosticResult = {
      timestamp: new Date().toISOString(),
      localStorage: await this.checkLocalStorage(),
      ipfsConnectivity: await this.checkIPFSConnectivity(),
      dataStore: {
        assets: { cid: '', accessible: false, count: 0, items: [] }
      },
      todaysUploads: []
    };

    result.dataStore.assets = await this.checkDataStore('assets');
    result.todaysUploads = await this.findTodaysUploads();

    console.log('📊 Diagnostic complete:', result);
    return result;
  }

  private async checkLocalStorage() {
    try {
      const stored = localStorage.getItem('mv-data-store');
      return {
        exists: !!stored,
        data: stored ? JSON.parse(stored) : null,
        size: stored ? stored.length : 0
      };
    } catch (error) {
      return { exists: false, data: null, size: 0 };
    }
  }

  private async checkIPFSConnectivity() {
    try {
      const testCid = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn';
      const response = await fetch(`${this.gateway}${testCid}`, { method: 'HEAD' });
      
      return {
        gateway: this.gateway,
        accessible: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        gateway: this.gateway,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkDataStore(type: 'assets') {
    try {
      const store = await dataManager.getStore();
      const cid = store[type];
      
      if (!cid) {
        return { cid: '', accessible: false, count: 0, items: [], error: 'No CID found' };
      }

      const data = await ipfsClient.fetch(cid);
      
      return {
        cid,
        accessible: true,
        count: Array.isArray(data) ? data.length : 0,
        items: Array.isArray(data) ? data : [data],
        error: undefined
      };
    } catch (error) {
      const store = await dataManager.getStore();
      return {
        cid: store[type] || '',
        accessible: false,
        count: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async findTodaysUploads() {
    try {
      const assets = await dataManager.getData('assets');
      const today = new Date().toISOString().split('T')[0];
      
      return assets.filter(asset => {
        const uploadDate = asset.uploadedAt || asset.createdAt;
        return uploadDate && uploadDate.startsWith(today);
      });
    } catch (error) {
      return [];
    }
  }

  async testSpecificCID(cid: string) {
    try {
      const response = await fetch(`${this.gateway}${cid}`);
      if (!response.ok) {
        return { accessible: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { accessible: true, data };
    } catch (error) {
      return { 
        accessible: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const ipfsDiagnostic = new IPFSDiagnostic();