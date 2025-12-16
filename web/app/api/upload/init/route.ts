import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { filename, size, contentType, userWallet } = await request.json();
    
    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400 });
    }

    // Create asset record in Supabase
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        name: filename,
        creator_wallet: userWallet || 'anonymous',
        asset_type: contentType?.startsWith('video/') ? 'video' : 'file',
        file_name: filename,
        file_size: size,
        mime_type: contentType,
        status: 'uploading'
      })
      .select()
      .single();

    if (assetError) {
      return NextResponse.json({ error: 'Failed to create asset record' }, { status: 500 });
    }

    // Generate S3 presigned URL
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;

    if (bucket && region && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
      });

      const key = `uploads/${asset.id}/${filename}`;
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream'
      });

      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

      return NextResponse.json({
        asset,
        presignedUrl,
        key,
        bucket,
        uploadUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`
      });
    }

    return NextResponse.json({ error: 'S3 not configured' }, { status: 500 });
  } catch (error) {
    console.error('Upload init error:', error);
    return NextResponse.json({ error: 'Upload initialization failed' }, { status: 500 });
  }
}