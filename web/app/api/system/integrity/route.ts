import { NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function GET() {
  try {
    const health = await enhancedDataManager.getSystemHealth();
    const integrity = await enhancedDataManager.validateContentIntegrity();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: integrity.valid ? 'healthy' : 'issues_detected',
      health,
      integrity,
      recommendations: integrity.issues.length > 0 ? [
        'Review CID/MIME type mismatches',
        'Clear cache and reload data',
        'Verify IPFS gateway connectivity'
      ] : []
    });
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}