const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
if (!fs.existsSync(ASSETS_FILE)) fs.writeFileSync(ASSETS_FILE, JSON.stringify({ assets: [] }, null, 2));

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize an upload: returns a mock presigned URL and asset metadata
app.post('/api/upload/init', (req, res) => {
  const { filename, size, type, metadata } = req.body || {};
  if (!filename) return res.status(400).json({ error: 'filename required' });

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const asset = {
    id,
    filename,
    size: size || 0,
    type: type || 'application/octet-stream',
    metadata: metadata || {},
    status: 'initialized',
    createdAt,
    updatedAt: createdAt,
    url: `/uploads/${id}/${filename}`
  };

  const db = JSON.parse(fs.readFileSync(ASSETS_FILE));
  db.assets.push(asset);
  fs.writeFileSync(ASSETS_FILE, JSON.stringify(db, null, 2));

  // NOTE: This is a mock signed URL for local testing.
  const presigned = `http://localhost:4001${asset.url}`;
  return res.json({ asset, presignedUrl: presigned });
});

// Simulate upload complete webhook: marks asset as uploaded and queues processing
app.post('/api/upload/complete', (req, res) => {
  const { assetId } = req.body || {};
  if (!assetId) return res.status(400).json({ error: 'assetId required' });

  const db = JSON.parse(fs.readFileSync(ASSETS_FILE));
  const asset = db.assets.find(a => a.id === assetId);
  if (!asset) return res.status(404).json({ error: 'asset not found' });

  asset.status = 'uploaded';
  asset.updatedAt = new Date().toISOString();
  // create a queue file for worker
  const queueDir = path.join(DATA_DIR, 'queue');
  if (!fs.existsSync(queueDir)) fs.mkdirSync(queueDir);
  const qfile = path.join(queueDir, `${assetId}.json`);
  fs.writeFileSync(qfile, JSON.stringify({ assetId, filename: asset.filename, createdAt: new Date().toISOString() }, null, 2));

  fs.writeFileSync(ASSETS_FILE, JSON.stringify(db, null, 2));

  return res.json({ status: 'queued', asset });
});

// Simple list endpoint for assets
app.get('/api/assets', (req, res) => {
  const db = JSON.parse(fs.readFileSync(ASSETS_FILE));
  return res.json(db.assets);
});

// Serve uploaded files (mock) and generated poster images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Upload service running on http://localhost:${PORT}`);
});
