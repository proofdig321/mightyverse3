const DEFAULT_UPLOAD_SERVICE = process.env.UPLOAD_SERVICE_URL || 'http://localhost:4001';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { assetId, key, bucket } = req.body || {};
  if (!assetId) return res.status(400).json({ error: 'assetId required' });

  // If an internal upload service exists, call its complete endpoint
  try {
    const svcRes = await fetch(`${DEFAULT_UPLOAD_SERVICE}/api/upload/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId, key, bucket }) });
    const data = await svcRes.json();

    // Notify MCP (if configured)
    if (process.env.MCP_ENDPOINT && process.env.MCP_AUTH_TOKEN) {
      try {
        await fetch(process.env.MCP_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}` }, body: JSON.stringify({ type: 'upload_complete', assetId, payload: data }) });
      } catch (err) {
        console.warn('MCP notify failed', err.message || err);
      }
    }

    return res.status(svcRes.status).json(data);
  } catch (err) {
    console.error('Upload complete proxy error', err);
    return res.status(500).json({ error: 'Upload complete failed' });
  }
};
