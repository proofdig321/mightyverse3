import { NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: false,
    ipfs: false,
    livepeer: false,
    assets: { total: 0, recent: 0, processing: 0, failed: 0 }
  };

  try {
    // Database check
    const assets = await enhancedDataManager.getData('assets');
    checks.database = true;
    checks.assets.total = assets.length;
    
    // Recent assets (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    checks.assets.recent = assets.filter(a => 
      new Date(a.created_at) > yesterday
    ).length;
    
    // Processing status
    checks.assets.processing = assets.filter(a => 
      a.livepeer_status === 'processing'
    ).length;
    
    checks.assets.failed = assets.filter(a => 
      a.status === 'failed' || a.livepeer_status === 'failed'
    ).length;

  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // IPFS gateway check
    const response = await fetch('https://gateway.pinata.cloud/ipfs/QmTest', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    checks.ipfs = response.status !== 500;
  } catch (error) {
    console.error('IPFS health check failed:', error);
  }

  try {
    // Livepeer API check
    if (process.env.LIVEPEER_API_KEY) {
      const response = await fetch('https://livepeer.studio/api/stream', {
        headers: { 'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}` },
        signal: AbortSignal.timeout(3000)
      });
      checks.livepeer = response.ok;
    }
  } catch (error) {
    console.error('Livepeer health check failed:', error);
  }

  const healthy = checks.database && checks.ipfs;
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    checks
  }, { 
    status: healthy ? 200 : 503 
  });
}