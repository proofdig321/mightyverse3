import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '@/../../services/campaigns/orchestrator';
import { requireApiKey } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireApiKey(_request);
  if (auth) return auth;
  try {
    const campaignId = params.id;
    if (!campaignId) return NextResponse.json({ error: 'campaign id required' }, { status: 400 });
    const sessions = await campaignOrchestrator.listStreamSessions(campaignId, 50, 0);
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('API /campaigns/[id]/streams GET error:', err);
    return NextResponse.json({ error: 'failed to list streams for campaign' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireApiKey(request);
  if (auth) return auth;
  try {
    const campaignId = params.id;
    if (!campaignId) return NextResponse.json({ error: 'campaign id required' }, { status: 400 });

    const { name, record } = await request.json();
    const session = await campaignOrchestrator.createStreamSession(campaignId, { name, record });
    return NextResponse.json({ session });
  } catch (err) {
    console.error('API /campaigns/[id]/streams error:', err);
    return NextResponse.json({ error: 'failed to create stream session' }, { status: 500 });
  }
}
