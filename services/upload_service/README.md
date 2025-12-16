Mighty Verse — Upload Service (Phase 2 scaffold)

Purpose
- Lightweight local upload service to simulate production upload flow: presigned URL issuance, upload completion webhook, queueing for background processing.

How it works
1. POST `/api/upload/init` with { filename, size, type } to create an asset record and receive a `presignedUrl` to `http://localhost:4001/uploads/<id>/<filename>`.
2. Client uploads file to that URL (for local testing you can create the file under `services/upload_service/uploads/<id>/<filename>`).
3. POST `/api/upload/complete` with `{ assetId }` to mark the asset as uploaded and queue it for processing.
4. Background worker (`scripts/processing_worker.js`) picks queued items and simulates transcoding/poster generation.

Run locally

Install dependencies:

```bash
cd services/upload_service
npm install
npm start
```

Then open `http://localhost:4001/api/assets` to list assets.

Note
- This is a local, non-production mock. In production: replace presigned URL generation with cloud object store signed URLs (S3, Supabase Storage, etc.), secure webhooks, and real transcoding workers.
