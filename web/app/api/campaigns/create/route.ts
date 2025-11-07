import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '../../../../services/campaigns/orchestrator';
import { requireApiKey } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request);
  if (auth) return auth;
  try {
    const { name, sponsorId, budget, metadata } = await request.json();

    if (!name || !sponsorId) {
      return NextResponse.json({ error: 'name and sponsorId are required' }, { status: 400 });
    }

    const campaign = await campaignOrchestrator.createCampaign({ name, sponsorId, budget, metadata } as any);
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('API /campaigns/create error:', err);
    return NextResponse.json({ error: 'failed to create campaign' }, { status: 500 });
  }
}
