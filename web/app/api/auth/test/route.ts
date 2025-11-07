import { NextRequest, NextResponse } from 'next/server';
import { jwtAuth } from '@/lib/jwt-auth';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = jwtAuth.extractTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const payload = await jwtAuth.verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: payload.sub,
    roles: payload.roles,
    sessionId: payload.sessionId,
    expiresAt: new Date(payload.exp * 1000).toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, roles } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const token = await jwtAuth.createToken(walletAddress, roles || ['user']);
    
    return NextResponse.json({
      token,
      walletAddress,
      roles: roles || ['user'],
      message: 'Test token created successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Token creation failed' }, { status: 500 });
  }
}