import { NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function GET() {
  try {
    const health = await enhancedDataManager.getSystemHealth();
    
    const status = {
      overall: health.schema.healthy ? 'healthy' : 'degraded',
      database: {
        connected: health.cache.useSupabase,
        mode: health.cache.storageMode,
        issues: health.schema.issues
      },
      gateways: {
        ipfs: health.gateways.ipfs.filter(g => g.status === 'active').length,
        livepeer: health.gateways.livepeer.filter(g => g.status === 'active').length,
        total: health.gateways.ipfs.filter(g => g.status === 'active').length + health.gateways.livepeer.filter(g => g.status === 'active').length
      },
      cache: {
        tables: health.cache.cachedTables.length,
        size: health.cache.cacheSize
      },
      timestamp: health.timestamp
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ 
      overall: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}