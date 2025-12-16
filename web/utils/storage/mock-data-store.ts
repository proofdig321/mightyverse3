// Mock data store for development when Supabase is not configured

export const mockAssets = [
  {
    id: 'mock-1',
    name: 'Sample Animation',
    creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
    asset_type: 'video',
    file_cid: 'QmSampleCID123',
    status: 'approved',
    livepeer_status: 'ready',
    livepeer_playback_id: 'sample-playback-id',
    mime_type: 'video/mp4',
    created_at: new Date().toISOString(),
    metadata: { description: 'Sample video for testing' }
  },
  {
    id: 'mock-2', 
    name: 'Test Image',
    creator_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
    asset_type: 'image',
    file_cid: 'QmSampleImageCID456',
    status: 'approved',
    mime_type: 'image/png',
    created_at: new Date().toISOString(),
    metadata: { description: 'Sample image for testing' }
  }
];

export const mockCampaigns = [
  {
    id: 'campaign-1',
    name: 'Demo Campaign',
    status: 'active',
    sponsor_id: 'demo-sponsor',
    created_at: new Date().toISOString()
  }
];

export const mockUsers = [
  {
    id: 'user-1',
    wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
    role: 'admin',
    created_at: new Date().toISOString()
  }
];

export class MockDataManager {
  private data = {
    assets: mockAssets,
    campaigns: mockCampaigns,
    users: mockUsers,
    processing_jobs: []
  };

  async getData(table: string) {
    console.log(`📦 Mock data: fetching ${table}`);
    return this.data[table] || [];
  }

  async createItem(table: string, item: any) {
    console.log(`📦 Mock data: creating ${table} item`);
    const newItem = { ...item, id: `mock-${Date.now()}`, created_at: new Date().toISOString() };
    this.data[table] = this.data[table] || [];
    this.data[table].push(newItem);
    return newItem;
  }

  async updateItem(table: string, id: string, updates: any) {
    console.log(`📦 Mock data: updating ${table} item ${id}`);
    const items = this.data[table] || [];
    const index = items.findIndex(item => item.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...updates };
      return items[index];
    }
    throw new Error('Item not found');
  }

  subscribe(table: string, callback: () => void) {
    console.log(`📦 Mock data: subscribing to ${table}`);
    return () => console.log(`📦 Mock data: unsubscribed from ${table}`);
  }
}