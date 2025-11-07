import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';

export async function GET() {
  try {
    const assets = await enhancedDataManager.getData('assets');
    return NextResponse.json({ success: true, assets });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const assetData = await request.json();
    const asset = await enhancedDataManager.createItem('assets', assetData);
    return NextResponse.json({ success: true, asset });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}