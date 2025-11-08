import { NextResponse } from 'next/server';
import { schemaSyncManager } from '../../../../utils/storage/schema-sync';

export async function POST() {
  try {
    const result = await schemaSyncManager.validateAndSync();
    
    return NextResponse.json({
      success: result.success,
      changes: result.changes,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema sync failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const health = await schemaSyncManager.checkSchemaHealth();
    
    return NextResponse.json({
      healthy: health.healthy,
      issues: health.issues,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Schema health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}