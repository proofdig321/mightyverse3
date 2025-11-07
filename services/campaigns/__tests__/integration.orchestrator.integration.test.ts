import { campaignOrchestrator } from '../orchestrator';

// Integration test: runs only when DATABASE_URL is set
const HAS_DB = !!process.env.DATABASE_URL;

describe('CampaignOrchestrator integration (db)', () => {
  beforeAll(async () => {
    if (!HAS_DB) return;
    // ensure migrations already applied by scripts/integration/up_and_migrate.sh
  });

  test('create campaign, stream, schedule placement writes outbox', async () => {
    if (!HAS_DB) return console.warn('Skipping DB integration test: DATABASE_URL not set');

    const campaign = await campaignOrchestrator.createCampaign({ name: 'int-test-campaign', sponsorId: '00000000-0000-0000-0000-000000000001', metadata: { test: true } });
    expect(campaign).toBeDefined();

    const session = await campaignOrchestrator.createStreamSession(campaign.id, { name: 'int-test-stream', record: false });
    expect(session).toBeDefined();

    const p = [{ id: undefined, campaignId: campaign.id, assetCid: 'QmTest', startTime: 1, duration: 5 }];
    const res = await campaignOrchestrator.schedulePlacements(session.id, p as any);
    expect(res).toBeDefined();

  // check outbox has at least one event for the placement
  // require dbClient lazily to avoid loading 'pg' in non-db test runs
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dbClient = require('../../../db/client').default;
  const out = await dbClient.query('SELECT id, aggregate_type, event_type FROM outbox WHERE aggregate_type = $1 ORDER BY created_at DESC LIMIT 1', ['placement']);
    expect(out.rows && out.rows.length > 0).toBeTruthy();
  }, 20000);
});
