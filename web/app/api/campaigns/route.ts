import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';

export async function GET() {
  try {
    const campaigns = await enhancedDataManager.getData('campaigns');
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch campaigns'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const campaignData = await request.json();
    
    const campaign = await enhancedDataManager.createItem('campaigns', {
      ...campaignData,
      status: 'draft'
    });
    
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create campaign'
    }, { status: 500 });
  }
}