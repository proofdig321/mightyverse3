/**
 * Enhanced Data Store - Phase 2 Implementation
 * Comprehensive data management with Supabase integration and fallback
 */

import { supabase as supabaseClient } from '../supabase/client';
import { schemaSyncManager } from './schema-sync';
import { gatewayManager } from './gateway-manager';

interface DataItem {
  id: string;
  [key: string]: any;
}

interface Asset {
  id: string;
  name: string;
  creator_wallet: string;
  asset_type: string;
  file_cid?: string;
  status: 'draft' | 'processing' | 'submitted' | 'approved' | 'rejected' | 'published' | 'archived';
  quality_score?: number;
  tags?: string[];
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface Mural {
  id: string;
  title: string;
  artist_wallet: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'published' | 'archived';
  metadata?: any;
  created_at?: string;
}

interface ProcessingJob {
  id: string;
  job_type: string;
  content_id?: string;
  content_type?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  input_data?: any;
  output_data?: any;
  error_message?: string;
}

class EnhancedDataManager {
  private cache = new Map<string, any[]>();
  private useSupabase = false;
  private subscribers = new Map<string, Set<Function>>();

  constructor() {
    // Check if Supabase is properly configured
    this.useSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co');
    
    if (!this.useSupabase) {
      console.warn('EnhancedDataManager: Using localStorage fallback - Supabase not configured');
      this.initializeMockData();
    } else {
      // Initialize schema sync in background
      this.initializeSchemaSync();
    }
  }

  // Initialize minimal fallback data only when Supabase is unavailable
  private initializeMockData() {
    if (typeof window === 'undefined') return;
    
    // Only create minimal fallback if no data exists
    const existingAssets = localStorage.getItem('mighty_assets');
    if (!existingAssets) {
      const fallbackData = {
        assets: [],
        murals: [],
        campaigns: [],
        users: [],
        processing_jobs: []
      };
      
      Object.entries(fallbackData).forEach(([table, data]) => {
        localStorage.setItem(`mighty_${table}`, JSON.stringify(data));
      });
    }
  }

  // Enhanced mock data getter
  private getMockData(table: string): DataItem[] {
    // Return empty array in server environment
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(`mighty_${table}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Failed to load ${table} from localStorage:`, error);
    }
    return [];
  }

  // Real-time subscription management
  subscribe(table: string, callback: Function) {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, new Set());
    }
    this.subscribers.get(table)!.add(callback);

    // Set up real-time subscription if using Supabase
    if (this.useSupabase) {
      supabaseClient
        .channel(`${table}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table }, 
          () => {
            this.invalidateCache(table);
            this.notifySubscribers(table);
          }
        )
        .subscribe();
    }

    return () => {
      this.subscribers.get(table)?.delete(callback);
    };
  }

  private notifySubscribers(table: string) {
    const callbacks = this.subscribers.get(table);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

  private invalidateCache(table: string) {
    this.cache.delete(table);
  }

  async getData(table: string): Promise<DataItem[]> {
    // Check cache first
    if (this.cache.has(table)) {
      return this.cache.get(table)!;
    }

    try {
      if (this.useSupabase) {
        const { data, error } = await supabaseClient
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn(`Supabase error for ${table}:`, error.message);
          // If table doesn't exist (404), use mock data
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            const mockData = this.getMockData(table);
            this.cache.set(table, mockData);
            return mockData;
          }
          throw error;
        }
        
        const normalizedData = this.normalizeData(data || []);
        this.cache.set(table, normalizedData);
        return normalizedData;
      } else {
        // Enhanced fallback with localStorage persistence
        const mockData = this.getMockData(table);
        this.cache.set(table, mockData);
        return mockData;
      }
    } catch (error) {
      console.error(`Failed to fetch ${table}:`, error);
      // Return mock data as fallback
      const mockData = this.getMockData(table);
      this.cache.set(table, mockData);
      return mockData;
    }
  }

  async createItem(table: string, item: Omit<DataItem, 'id'>): Promise<DataItem> {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabaseClient
          .from(table)
          .insert([{
            ...item,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Update cache and notify subscribers
        this.invalidateCache(table);
        this.notifySubscribers(table);
        return data;
      } else {
        // Enhanced mock creation with localStorage persistence
        const newItem = {
          ...item,
          id: `${table}_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const currentData = this.getMockData(table);
        currentData.unshift(newItem);
        
        // Persist to localStorage
        localStorage.setItem(`mighty_${table}`, JSON.stringify(currentData));
        this.cache.set(table, currentData);
        
        // Notify subscribers
        this.notifySubscribers(table);
        
        return newItem;
      }
    } catch (error) {
      console.error(`Failed to create item in ${table}:`, error);
      throw error;
    }
  }

  async updateItem(table: string, id: string, updates: Partial<DataItem>): Promise<DataItem> {
    try {
      if (this.useSupabase) {
        // Handle schema-safe updates
        const safeUpdates = await this.sanitizeUpdates(table, updates);
        
        const { data, error } = await supabaseClient
          .from(table)
          .update({
            ...safeUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.warn(`Supabase update error for ${table}:`, error.message);
          // Check if it's a schema issue
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log('Schema issue detected, triggering sync...');
            await this.handleSchemaIssue(table, error.message);
          }
          // Fall back to localStorage update
          return this.updateItemInLocalStorage(table, id, updates);
        }
        
        // Update cache and notify subscribers
        this.invalidateCache(table);
        this.notifySubscribers(table);
        return data;
      } else {
        return this.updateItemInLocalStorage(table, id, updates);
      }
    } catch (error) {
      console.error(`Failed to update item in ${table}:`, error);
      // Try localStorage fallback
      try {
        return this.updateItemInLocalStorage(table, id, updates);
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  private updateItemInLocalStorage(table: string, id: string, updates: Partial<DataItem>): DataItem {
    // Enhanced mock update with localStorage persistence
    const currentData = this.getMockData(table);
    const itemIndex = currentData.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      // Create missing item if it doesn't exist (for Supabase items not in localStorage)
      const newItem = {
        id,
        name: 'Synced Asset',
        creator_wallet: '0x0000000000000000000000000000000000000000',
        asset_type: 'unknown',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...updates
      };
      currentData.unshift(newItem);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mighty_${table}`, JSON.stringify(currentData));
      }
      this.cache.set(table, currentData);
      this.notifySubscribers(table);
      
      return newItem;
    }
    
    const updatedItem = {
      ...currentData[itemIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    currentData[itemIndex] = updatedItem;
    
    // Persist to localStorage (browser only)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mighty_${table}`, JSON.stringify(currentData));
    }
    this.cache.set(table, currentData);
    
    // Notify subscribers
    this.notifySubscribers(table);
    
    return updatedItem;
  }

  async deleteItem(table: string, id: string): Promise<boolean> {
    try {
      if (this.useSupabase) {
        const { error } = await supabaseClient
          .from(table)
          .delete()
          .eq('id', id);

        if (error) {
          console.warn(`Supabase delete error for ${table}:`, error.message);
          // Fall back to localStorage deletion
          return this.deleteItemFromLocalStorage(table, id);
        }
        
        // Update cache and notify subscribers
        this.invalidateCache(table);
        this.notifySubscribers(table);
        return true;
      } else {
        return this.deleteItemFromLocalStorage(table, id);
      }
    } catch (error) {
      console.error(`Failed to delete item from ${table}:`, error);
      // Try localStorage fallback
      try {
        return this.deleteItemFromLocalStorage(table, id);
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  private deleteItemFromLocalStorage(table: string, id: string): boolean {
    // Enhanced mock deletion with localStorage persistence
    const currentData = this.getMockData(table);
    const filteredData = currentData.filter(item => item.id !== id);
    
    if (filteredData.length === currentData.length) {
      throw new Error(`Item with id ${id} not found in ${table}`);
    }
    
    // Persist to localStorage (browser only)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mighty_${table}`, JSON.stringify(filteredData));
    }
    this.cache.set(table, filteredData);
    
    // Notify subscribers
    this.notifySubscribers(table);
    return true;
  }

  // Enhanced query methods
  async getItemById(table: string, id: string): Promise<DataItem | null> {
    const data = await this.getData(table);
    return data.find(item => item.id === id) || null;
  }

  async getItemsByStatus(table: string, status: string): Promise<DataItem[]> {
    const data = await this.getData(table);
    return data.filter(item => item.status === status);
  }

  async getItemsByCreator(table: string, creatorWallet: string): Promise<DataItem[]> {
    const data = await this.getData(table);
    return data.filter(item => 
      item.creator_wallet === creatorWallet || 
      item.artist_wallet === creatorWallet ||
      item.creator === creatorWallet
    );
  }

  // Processing job management
  async createProcessingJob(jobData: Omit<ProcessingJob, 'id' | 'created_at'>): Promise<ProcessingJob> {
    return this.createItem('processing_jobs', {
      ...jobData,
      progress: 0,
      status: 'queued'
    }) as Promise<ProcessingJob>;
  }

  async updateJobProgress(jobId: string, progress: number, status?: string): Promise<ProcessingJob> {
    const updates: any = { progress };
    if (status) updates.status = status;
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (status === 'processing' && progress === 0) updates.started_at = new Date().toISOString();
    
    return this.updateItem('processing_jobs', jobId, updates) as Promise<ProcessingJob>;
  }

  // Clear cache for a specific table
  clearCache(table?: string) {
    if (table) {
      this.cache.delete(table);
      this.notifySubscribers(table);
    } else {
      this.cache.clear();
      // Notify all subscribers
      this.subscribers.forEach((_, table) => {
        this.notifySubscribers(table);
      });
    }
  }

  // Get comprehensive system status
  getCacheInfo() {
    return {
      useSupabase: this.useSupabase,
      cachedTables: Array.from(this.cache.keys()),
      cacheSize: this.cache.size,
      subscribers: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([table, subs]) => [table, subs.size])
      ),
      storageMode: this.useSupabase ? 'supabase' : 'localStorage'
    };
  }

  // Batch operations for efficiency
  async batchCreate(table: string, items: Omit<DataItem, 'id'>[]): Promise<DataItem[]> {
    if (this.useSupabase) {
      const { data, error } = await supabaseClient
        .from(table)
        .insert(items.map(item => ({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))
        .select();

      if (error) throw error;
      
      this.invalidateCache(table);
      this.notifySubscribers(table);
      return data || [];
    } else {
      // Mock batch creation
      const newItems = items.map(item => ({
        ...item,
        id: `${table}_${Date.now()}_${Math.random()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const currentData = this.getMockData(table);
      const updatedData = [...newItems, ...currentData];
      
      localStorage.setItem(`mighty_${table}`, JSON.stringify(updatedData));
      this.cache.set(table, updatedData);
      this.notifySubscribers(table);
      
      return newItems;
    }
  }

  // Search functionality
  async searchItems(table: string, query: string, fields: string[] = ['name', 'title', 'description']): Promise<DataItem[]> {
    const data = await this.getData(table);
    const lowerQuery = query.toLowerCase();
    
    return data.filter(item => 
      fields.some(field => 
        item[field]?.toString().toLowerCase().includes(lowerQuery)
      )
    );
  }

  // Schema synchronization methods
  private async initializeSchemaSync() {
    try {
      const result = await schemaSyncManager.validateAndSync();
      if (result.changes.length > 0) {
        console.log('Schema sync completed:', result.changes);
      }
      if (result.errors.length > 0) {
        console.warn('Schema sync issues:', result.errors);
      }
    } catch (error) {
      console.warn('Schema sync initialization failed:', error);
    }
  }

  private async sanitizeUpdates(table: string, updates: Partial<DataItem>): Promise<Partial<DataItem>> {
    // Remove undefined values and handle known schema issues
    const sanitized: Partial<DataItem> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        // Handle boolean conversion for is_curated
        if (key === 'is_curated' || key === 'curated') {
          sanitized[key] = Boolean(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  private async handleSchemaIssue(table: string, errorMessage: string) {
    console.log(`Handling schema issue for ${table}: ${errorMessage}`);
    // Trigger background schema sync
    schemaSyncManager.validateAndSync().catch(error => {
      console.warn('Background schema sync failed:', error);
    });
  }

  // Gateway management integration
  async getOptimizedIPFSUrl(cid: string): Promise<string> {
    return gatewayManager.getIPFSUrl(cid);
  }

  async getOptimizedLivepeerUrl(playbackId: string): Promise<string> {
    return gatewayManager.getLivepeerUrl(playbackId);
  }

  // Data normalization for property mapping
  private normalizeData(data: any[]): any[] {
    return data.map(item => ({
      ...item,
      // Add camelCase aliases for snake_case database fields
      fileCid: item.fileCid || item.file_cid,
      thumbnailCid: item.thumbnailCid || item.thumbnail_cid,
      fileName: item.fileName || item.file_name,
      mimeType: item.mimeType || item.mime_type,
      assetType: item.assetType || item.asset_type,
      creatorWallet: item.creatorWallet || item.creator_wallet,
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at
    }));
  }

  // System health check
  async getSystemHealth() {
    const schemaHealth = await schemaSyncManager.checkSchemaHealth();
    const gatewayStatus = gatewayManager.getGatewayStatus();
    const cacheInfo = this.getCacheInfo();
    
    return {
      schema: schemaHealth,
      gateways: gatewayStatus,
      cache: cacheInfo,
      timestamp: new Date().toISOString()
    };
  }
}

export const enhancedDataManager = new EnhancedDataManager();
export type { Asset, Mural, ProcessingJob };
export { gatewayManager } from './gateway-manager';
export { schemaSyncManager } from './schema-sync';