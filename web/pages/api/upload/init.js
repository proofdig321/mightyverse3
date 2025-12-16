const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const DEFAULT_UPLOAD_SERVICE = process.env.UPLOAD_SERVICE_URL || 'http://localhost:4001';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { filename, size, contentType } = req.body || {};
  if (!filename) return res.status(400).json({ error: 'filename required' });

  // If S3 is configured, generate a presigned URL
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;

  if (bucket && region && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    try {
      const s3 = new S3Client({ region, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } });
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2,9)}-${filename}`;
      const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType || 'application/octet-stream' });
      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes

      return res.json({ presignedUrl, key, bucket, url: `https://${bucket}.s3.${region}.amazonaws.com/${key}` });
    } catch (err) {
      console.error('S3 presign error', err);
      return res.status(500).json({ error: 'S3 presign failed' });
    }
  }

  // Fallback: proxy to local upload service if present
  try {
    const initRes = await fetch(`${DEFAULT_UPLOAD_SERVICE}/api/upload/init`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, size, type: contentType }) });
    const data = await initRes.json();
    return res.status(initRes.status).json(data);
  } catch (err) {
    console.error('Upload service proxy error', err);
    return res.status(500).json({ error: 'No upload backend available' });
  }
};
