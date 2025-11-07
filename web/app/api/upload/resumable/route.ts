import { NextRequest, NextResponse } from 'next/server';
import { jwtAuth } from '@/lib/jwt-auth';

interface UploadSession {
  id: string;
  filename: string;
  size: number;
  uploadedBytes: number;
  chunks: string[];
  userId: string;
  createdAt: Date;
}

const uploadSessions = new Map<string, UploadSession>();

export async function POST(request: NextRequest) {
  const token = jwtAuth.extractTokenFromHeader(request.headers.get('authorization'));
  const payload = await jwtAuth.verifyToken(token || '');
  
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename, size } = await request.json();
  const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  uploadSessions.set(sessionId, {
    id: sessionId,
    filename,
    size,
    uploadedBytes: 0,
    chunks: [],
    userId: payload.sub,
    createdAt: new Date()
  });

  return NextResponse.json({
    sessionId,
    chunkSize: 1024 * 1024, // 1MB chunks
    uploadUrl: `/api/upload/chunk/${sessionId}`
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  
  if (!sessionId || !uploadSessions.has(sessionId)) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const session = uploadSessions.get(sessionId)!;
  return NextResponse.json({
    uploadedBytes: session.uploadedBytes,
    totalBytes: session.size,
    progress: (session.uploadedBytes / session.size) * 100
  });
}