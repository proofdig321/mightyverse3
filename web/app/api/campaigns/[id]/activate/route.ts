import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '../../../../../services/campaigns/orchestrator';
import { requireApiKey } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireApiKey(request);
  if (auth) return auth;
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: 'campaign id required' }, { status: 400 });

    const campaign = await campaignOrchestrator.activateCampaign(id);
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('API /campaigns/[id]/activate error:', err);
    return NextResponse.json({ error: 'failed to activate campaign' }, { status: 500 });
  }
}
