import { NextResponse } from 'next/server';
import { campaignOrchestrator } from '../../../../../services/campaigns/orchestrator';
import { requireApiKey } from '../../../../../lib/auth';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  // Note: app-router doesn't provide NextRequest in GET here; do a manual header check is not possible.
  // We'll skip auth enforcement for playback GET when APP_API_KEY is not set. For strict auth, wrap in middleware.
  if (process.env.APP_API_KEY) {
    // Can't access headers here; caller should pass token via query or use middleware in production. We'll enforce token via query param for playback URLs.
    const url = new URL((_request as any).url);
    const token = url.searchParams.get('token');
    if (!token || token !== process.env.APP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  try {
    const streamId = params.id;
    if (!streamId) return NextResponse.json({ error: 'stream id required' }, { status: 400 });

  const url = await campaignOrchestrator.getPlaybackUrl(streamId);
  if (!url) return NextResponse.json({ error: 'playback url not found' }, { status: 404 });
  return NextResponse.json({ playbackUrl: url });
  } catch (err) {
    console.error('API /streams/[id]/playback error:', err);
    return NextResponse.json({ error: 'failed to get playback url' }, { status: 500 });
  }
}
