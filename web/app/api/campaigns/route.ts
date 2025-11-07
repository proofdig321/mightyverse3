import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '../../../../services/campaigns/orchestrator';
import { requireApiKey } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireApiKey(request);
  if (auth) return auth;
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || '50');
    const offset = Number(url.searchParams.get('offset') || '0');
    const campaigns = await campaignOrchestrator.listCampaigns(limit, offset);
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error('API /campaigns GET error:', err);
    return NextResponse.json({ error: 'failed to list campaigns' }, { status: 500 });
  }
}
