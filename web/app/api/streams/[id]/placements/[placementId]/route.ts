import { NextRequest, NextResponse } from 'next/server';
import { campaignOrchestrator } from '../../../../../../services/campaigns/orchestrator';
import { requireApiKey } from '../../../../../../lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string; placementId: string } }) {
  const auth = requireApiKey(request);
  if (auth) return auth;
  try {
    const streamId = params.id;
    const placementId = params.placementId;
    if (!streamId || !placementId) return NextResponse.json({ error: 'stream id and placement id required' }, { status: 400 });

    const body = await request.json();
    // Server-side validation
    const updates: any = {};
    if ('startTime' in body) {
      if (typeof body.startTime !== 'number' || Number.isNaN(body.startTime) || body.startTime < 0) {
        return NextResponse.json({ error: 'startTime must be a non-negative number' }, { status: 400 });
      }
      updates.startTime = body.startTime;
    }
    if ('duration' in body) {
      if (typeof body.duration !== 'number' || Number.isNaN(body.duration) || body.duration <= 0) {
        return NextResponse.json({ error: 'duration must be a positive number' }, { status: 400 });
      }
      updates.duration = body.duration;
    }
    if ('assetCid' in body) {
      if (typeof body.assetCid !== 'string' || body.assetCid.trim().length === 0) {
        return NextResponse.json({ error: 'assetCid must be a non-empty string' }, { status: 400 });
      }
      updates.assetCid = body.assetCid;
    }
    if ('layer' in body) {
      if (typeof body.layer !== 'number' || !Number.isFinite(body.layer)) {
        return NextResponse.json({ error: 'layer must be a number' }, { status: 400 });
      }
      updates.layer = body.layer;
    }
    if ('z' in body) {
      if (typeof body.z !== 'number' || !Number.isFinite(body.z)) {
        return NextResponse.json({ error: 'z must be a number' }, { status: 400 });
      }
      updates.z = body.z;
    }
    if ('status' in body) {
      if (typeof body.status !== 'string') {
        return NextResponse.json({ error: 'status must be a string' }, { status: 400 });
      }
      updates.status = body.status;
    }

    const updated = await campaignOrchestrator.updatePlacement(streamId, placementId, updates);
    if (!updated) return NextResponse.json({ error: 'placement not found' }, { status: 404 });
    return NextResponse.json({ placement: updated });
  } catch (err) {
    console.error('API PATCH /streams/[id]/placements/[placementId] error:', err);
    return NextResponse.json({ error: 'failed to update placement' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string; placementId: string } }) {
  const auth = requireApiKey(_request);
  if (auth) return auth;
  // For now, soft-delete behavior could be implemented later. Return 204 to indicate accepted.
  try {
    const streamId = params.id;
    const placementId = params.placementId;
    if (!streamId || !placementId) return NextResponse.json({ error: 'stream id and placement id required' }, { status: 400 });
    // Attempt to mark as deleted in DB if available
    try {
      // best-effort: update placements state to 'cancelled'
      const dbClient = require('../../../../../../../db/client');
      if (dbClient && typeof dbClient.query === 'function') {
        await dbClient.query(`UPDATE placements SET state = $1 WHERE id = $2`, ['cancelled', placementId]);
      }
    } catch (e) {
      // ignore
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('API DELETE /streams/[id]/placements/[placementId] error:', err);
    return NextResponse.json({ error: 'failed to delete placement' }, { status: 500 });
  }
}
