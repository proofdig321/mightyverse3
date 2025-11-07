import { CampaignOrchestrator } from '../orchestrator';

describe('CampaignOrchestrator', () => {
  it('should create campaign', async () => {
    const orchestrator = new CampaignOrchestrator();
    const result = await orchestrator.createCampaign({
      id: 'test',
      name: 'Test Campaign',
      streamId: 'stream1',
      placements: []
    });
    expect(result).toBe('test');
  });
});
