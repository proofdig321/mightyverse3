import { test, expect } from '@playwright/test';

// This e2e test is guard-railed: it only runs when E2E_BASE_URL is set.
// It is intended for CI or local runs where a test instance is available.

const BASE = process.env.E2E_BASE_URL || '';

test.describe('Placement E2E (guarded)', () => {
  test.beforeEach(() => {
    test.skip(!BASE, 'E2E_BASE_URL not set — skipping guarded e2e');
  });

  test('schedules then updates a placement via API', async ({ request }) => {
    // create campaign
    const createCampaignRes = await request.post(`${BASE}/api/campaigns`, {
      data: { name: 'e2e-campaign', sponsorId: 'e2e-sponsor', metadata: { test: true } }
    });
    expect(createCampaignRes.ok()).toBeTruthy();
    const campaign = await createCampaignRes.json();
    expect(campaign).toHaveProperty('id');

    // create stream
    const createStreamRes = await request.post(`${BASE}/api/campaigns/${campaign.id}/streams`, {
      data: { name: 'e2e-stream', record: false }
    });
    expect(createStreamRes.ok()).toBeTruthy();
    const stream = await createStreamRes.json();
    expect(stream).toHaveProperty('id');

    // schedule placement
    const p = { id: 'e2e-p1', campaignId: campaign.id, assetCid: 'QmE2E', startTime: 5, duration: 3 };
    const scheduleRes = await request.post(`${BASE}/api/streams/${stream.id}/placements`, { data: { placements: [p] } });
    expect(scheduleRes.ok()).toBeTruthy();
    const scheduled = await scheduleRes.json();
    expect(scheduled).toHaveProperty('manifests');

    // update placement via PATCH
    const patchRes = await request.patch(`${BASE}/api/streams/${stream.id}/placements/${p.id}`, { data: { startTime: 10, duration: 6 } });
    expect(patchRes.ok()).toBeTruthy();
    const patched = await patchRes.json();
    expect(patched.placement).toHaveProperty('startTime', 10);

    // list placements and ensure values persisted
    const listRes = await request.get(`${BASE}/api/streams/${stream.id}/placements`);
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    const found = (list.placements || []).find((x: any) => x.id === p.id);
    expect(found).toBeDefined();
    expect(found.startTime).toBe(10);
  });
});
