Production migration notes for `services/upload_service`
-----------------------------------------------------

This service is currently a local scaffold used for Phase 2 testing. The following items describe how to migrate and harden it for production.

1. Replace mock presigned URL logic with S3 or Supabase Storage presigned URL generation. Use the official SDK (`@aws-sdk/client-s3` or `@supabase/supabase-js`).
2. Validate uploads server-side using MIME type detection (`file-type`) and magic-byte checks before accepting `upload/complete` events.
3. Use multipart/resumable uploads for large files (S3 multipart or TUS protocol).
4. Use message queue (Redis Streams, RabbitMQ, or AWS SQS) instead of filesystem queue for reliability and scaling.
5. Run `processing_worker.js` as a containerized worker or managed service (ECS task, Kubernetes Job). Ensure concurrency limits and backpressure on transcoding.
6. Integrate real transcoding via a transcoding service (FFmpeg, Livepeer transcoding, or an external media pipeline). Persist derived assets to S3 and update DB with playback URLs.
7. Ensure `uploads` bucket policy and CORS headers permit playback from your web origin; set `Access-Control-Allow-Origin` appropriately.
8. Add auth checks: only allow `upload/complete` from authenticated clients or with valid signed tokens.

Logging & Monitoring
- Send metrics for upload times, processing durations, and failures to your observability stack.

Security
- Scan uploads for malware if accepting arbitrary binaries.
- Enforce quotas and rate limits per user.

Backup & Recovery
- Back up DB and snapshot bucket lifecycle rules.

Rollout
- Start by routing a mirror of traffic to the new service, validate with canary uploads, then switch traffic gradually.
