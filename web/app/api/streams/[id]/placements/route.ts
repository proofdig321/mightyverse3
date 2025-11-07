import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '@/../../services/campaigns/orchestrator';
import { requireApiKey } from '@/lib/auth';
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireApiKey(_request);
  if (auth) return auth;
  try {
    const streamId = params.id;
    if (!streamId) return NextResponse.json({ error: 'stream id required' }, { status: 400 });

    const placements = await campaignOrchestrator.listPlacements(streamId);
    return NextResponse.json({ placements });
  } catch (err) {
    console.error('API /streams/[id]/placements GET error:', err);
    return NextResponse.json({ error: 'failed to list placements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireApiKey(request);
  if (auth) return auth;
  try {
    const streamId = params.id;
    if (!streamId) return NextResponse.json({ error: 'stream id required' }, { status: 400 });

    const { placements } = await request.json();
    if (!Array.isArray(placements)) {
      return NextResponse.json({ error: 'placements must be an array' }, { status: 400 });
    }

    const res = await campaignOrchestrator.schedulePlacements(streamId, placements);
    return NextResponse.json(res);
  } catch (err) {
    console.error('API /streams/[id]/placements error:', err);
    return NextResponse.json({ error: 'failed to schedule placements' }, { status: 500 });
  }
}
