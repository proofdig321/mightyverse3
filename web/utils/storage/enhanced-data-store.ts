/**
 * Enhanced Data Store - Phase 2 Implementation
 * Comprehensive data management with Supabase integration and fallback
 */

import { supabase as supabaseClient } from '../supabase/client';

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
    }
  }

  // Initialize comprehensive mock data
  private initializeMockData() {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;
    
    const mockData = {
      assets: [
        {
          id: '2',
          name: 'Test 2',
          creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          asset_type: 'video',
          file_cid: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
          status: 'approved',
          quality_score: 0.88,
          tags: ['test', 'ipfs'],
          metadata: { 
            upload_method: 'ipfs_direct',
            description: 'IPFS direct upload test'
          },
          created_at: new Date().toISOString()
        }
      ],
      murals: [
        {
          id: '1',
          title: 'Genesis Holographic Experience',
          artist_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          description: 'First holographic mural in The Mighty Verse',
          status: 'published',
          total_duration: 120,
          total_frames: 1920,
          metadata: { theme: 'futuristic', complexity: 'high' },
          created_at: new Date().toISOString()
        }
      ],
      campaigns: [
        {
          id: '1',
          name: 'Launch Campaign',
          status: 'active',
          budget: 5000,
          created_at: new Date().toISOString()
        }
      ],
      users: [
        {
          id: '1',
          wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ],
      processing_jobs: [
        {
          id: '1',
          job_type: 'ipfs_upload',
          content_id: '1',
          content_type: 'asset',
          status: 'completed',
          progress: 100,
          created_at: new Date().toISOString()
        }
      ]
    };

    // Store in localStorage for persistence (browser only)
    Object.entries(mockData).forEach(([table, data]) => {
      localStorage.setItem(`mighty_${table}`, JSON.stringify(data));
    });
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
        
        this.cache.set(table, data || []);
        return data || [];
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
        const { data, error } = await supabaseClient
          .from(table)
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        // Update cache and notify subscribers
        this.invalidateCache(table);
        this.notifySubscribers(table);
        return data;
      } else {
        // Enhanced mock update with localStorage persistence
        const currentData = this.getMockData(table);
        const itemIndex = currentData.findIndex(item => item.id === id);
        
        if (itemIndex === -1) {
          throw new Error(`Item with id ${id} not found`);
        }
        
        const updatedItem = {
          ...currentData[itemIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        currentData[itemIndex] = updatedItem;
        
        // Persist to localStorage
        localStorage.setItem(`mighty_${table}`, JSON.stringify(currentData));
        this.cache.set(table, currentData);
        
        // Notify subscribers
        this.notifySubscribers(table);
        
        return updatedItem;
      }
    } catch (error) {
      console.error(`Failed to update item in ${table}:`, error);
      throw error;
    }
  }

  async deleteItem(table: string, id: string): Promise<boolean> {
    try {
      if (this.useSupabase) {
        const { error } = await supabaseClient
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Update cache and notify subscribers
        this.invalidateCache(table);
        this.notifySubscribers(table);
        return true;
      } else {
        // Enhanced mock deletion with localStorage persistence
        const currentData = this.getMockData(table);
        const filteredData = currentData.filter(item => item.id !== id);
        
        if (filteredData.length === currentData.length) {
          throw new Error(`Item with id ${id} not found`);
        }
        
        // Persist to localStorage
        localStorage.setItem(`mighty_${table}`, JSON.stringify(filteredData));
        this.cache.set(table, filteredData);
        
        // Notify subscribers
        this.notifySubscribers(table);
        return true;
      }
    } catch (error) {
      console.error(`Failed to delete item from ${table}:`, error);
      throw error;
    }
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
}

export const enhancedDataManager = new EnhancedDataManager();
export type { Asset, Mural, ProcessingJob };