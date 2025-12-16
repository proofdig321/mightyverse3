const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'services', 'upload_service', 'data');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const QUEUE_DIR = path.join(DATA_DIR, 'queue');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function processQueue() {
  if (!fs.existsSync(QUEUE_DIR)) {
    console.log('No queue directory, nothing to process');
    return;
  }

  const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('Queue empty');
    return;
  }

  for (const file of files) {
    try {
      const qpath = path.join(QUEUE_DIR, file);
      const q = JSON.parse(fs.readFileSync(qpath));
      const { assetId } = q;
      console.log(`Processing asset ${assetId}`);

      const db = JSON.parse(fs.readFileSync(ASSETS_FILE));
      const asset = db.assets.find(a => a.id === assetId);
      if (!asset) {
        console.log(`Asset record not found for ${assetId}, removing queue item`);
        fs.unlinkSync(qpath);
        continue;
      }

      // Simulate processing time
      await sleep(1500);

      // Simulate generating a poster image path and transcoded file
      const uploadsDir = path.join(path.dirname(ASSETS_FILE), '..', 'uploads', assetId);
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const posterPath = path.join(uploadsDir, 'poster.jpg');
      fs.writeFileSync(posterPath, 'poster-placeholder');

      const transcodedPath = path.join(uploadsDir, 'transcoded.mp4');
      fs.writeFileSync(transcodedPath, 'transcoded-placeholder');

      asset.status = 'ready';
      asset.updatedAt = new Date().toISOString();
      asset.derived = {
        poster: `/uploads/${assetId}/poster.jpg`,
        transcoded: `/uploads/${assetId}/transcoded.mp4`
      };

      fs.writeFileSync(ASSETS_FILE, JSON.stringify(db, null, 2));

      // Remove queue file
      fs.unlinkSync(qpath);

      console.log(`Asset ${assetId} processed and ready`);
    } catch (err) {
      console.error('Worker error processing', file, err);
    }
  }
}

async function main() {
  console.log('Processing worker started');
  while (true) {
    try {
      await processQueue();
    } catch (e) {
      console.error('Worker main loop error', e);
    }
    await sleep(3000);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processQueue };
