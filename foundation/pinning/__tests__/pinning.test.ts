describe('PinningService (smoke)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    // @ts-ignore
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('returns cid when pin succeeds (pin JSON)', async () => {
    // Provide env so the service will initialize with Pinata provider
    process.env.PINATA_JWT = 'test-jwt';
    process.env.PINATA_API_KEY = 'key';
    process.env.PINATA_SECRET_KEY = 'secret';

  // @ts-ignore
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ IpfsHash: 'QmTest', PinSize: 123 }) });

  // Use the exported PinningService class to create instance for test
  const { PinningService } = require('../index');
    const instance = new PinningService();
    const res = await instance.pin({ hello: 'world' }, 'test-name');
    expect(res).toHaveProperty('cid', 'QmTest');
  });

  it('healthCheck returns object with provider keys', async () => {
    process.env.PINATA_JWT = 'test-jwt';
    process.env.PINATA_API_KEY = 'key';
    process.env.PINATA_SECRET_KEY = 'secret';

    // @ts-ignore
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    const { PinningService } = require('../index');
    const instance = new PinningService();
    const h = await instance.healthCheck();
    expect(typeof h).toBe('object');
  });
});
