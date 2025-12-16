import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fileType, fileSize, fileName } = await request.json();
    
    const security = {
      timestamp: new Date().toISOString(),
      checks: {
        fileType: validateFileType(fileType),
        fileSize: validateFileSize(fileSize, fileType),
        fileName: validateFileName(fileName),
        mimeType: validateMimeType(fileType)
      },
      risk: 'low',
      allowed: true
    };

    const failedChecks = Object.values(security.checks).filter(check => !check.valid).length;
    if (failedChecks > 2) {
      security.risk = 'high';
      security.allowed = false;
    } else if (failedChecks > 0) {
      security.risk = 'medium';
    }

    return NextResponse.json(security);
  } catch (error) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }
}

function validateFileType(fileType: string) {
  const allowedTypes = ['image/', 'video/', 'audio/', 'application/json'];
  const valid = allowedTypes.some(type => fileType.startsWith(type));
  return { valid, message: valid ? 'Allowed type' : 'Restricted file type' };
}

function validateFileSize(size: number, fileType: string) {
  const limits = {
    'image/': 10 * 1024 * 1024,
    'video/': 100 * 1024 * 1024,
    'audio/': 50 * 1024 * 1024,
    'application/': 5 * 1024 * 1024
  };
  
  const limit = Object.entries(limits).find(([type]) => fileType.startsWith(type))?.[1] || 10 * 1024 * 1024;
  const valid = size <= limit;
  return { valid, message: valid ? 'Size OK' : `Exceeds ${limit / 1024 / 1024}MB limit` };
}

function validateFileName(fileName: string) {
  const dangerous = /[<>:"/\\|?*\x00-\x1f]/;
  const valid = !dangerous.test(fileName) && fileName.length < 255;
  return { valid, message: valid ? 'Safe filename' : 'Potentially dangerous filename' };
}

function validateMimeType(mimeType: string) {
  const suspicious = ['application/x-executable', 'application/x-msdownload'];
  const valid = !suspicious.includes(mimeType);
  return { valid, message: valid ? 'Safe MIME type' : 'Suspicious MIME type' };
}