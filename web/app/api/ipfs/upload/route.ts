import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Set timeout for large uploads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Vercel has 50MB limit for Hobby plan, 100MB for Pro
    const maxSize = 45 * 1024 * 1024; // 45MB to be safe with Vercel limits
    if (file.size > maxSize) {
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        error: `File too large for Vercel deployment. Maximum size is 45MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB. Please compress your file or upgrade to Vercel Pro.` 
      }, { status: 413 });
    }

    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('pinataMetadata', JSON.stringify({
      name: name || file.name,
      keyvalues: {
        platform: 'mighty-verse',
        fileType: file.type,
        fileSize: file.size.toString(),
        timestamp: new Date().toISOString()
      }
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`
      },
      body: uploadFormData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata error:', response.status, errorText);
      
      if (response.status === 413) {
        throw new Error('File too large for upload service');
      }
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json({ ipfsHash: result.IpfsHash });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}