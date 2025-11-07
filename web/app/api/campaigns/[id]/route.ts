import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '../../../../services/campaigns/orchestrator';
import { requireApiKey } from '../../../../lib/auth';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireApiKey(_request);
  if (auth) return auth;
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: 'campaign id required' }, { status: 400 });
    const campaign = await campaignOrchestrator.getCampaign(id);
    if (!campaign) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('API /campaigns/[id] GET error:', err);
    return NextResponse.json({ error: 'failed to get campaign' }, { status: 500 });
  }
}
