import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '../../../../../services/campaigns/orchestrator';
import { requireApiKey } from '../../../../lib/auth';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireApiKey(_request);
  if (auth) return auth;
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: 'stream id required' }, { status: 400 });
    const session = await campaignOrchestrator.getStreamSession(id);
    if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ session });
  } catch (err) {
    console.error('API /streams/[id] GET error:', err);
    return NextResponse.json({ error: 'failed to get stream session' }, { status: 500 });
  }
}
