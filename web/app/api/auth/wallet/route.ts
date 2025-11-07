import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { jwtAuth } from '@/lib/jwt-auth';

interface WalletAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: WalletAuthRequest = await request.json();
    const { walletAddress, signature, message, timestamp } = body;

    // Validate timestamp (5 minute window)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Request expired' },
        { status: 400 }
      );
    }

    // Verify signature - ethers v5 compatible
    const expectedMessage = `Sign in to The Mighty Verse\nTimestamp: ${timestamp}`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Use ethers v5 verifyMessage
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Get user roles
    const roles = await getUserRoles(walletAddress);

    // Create JWT token
    const token = await jwtAuth.createToken(walletAddress, roles);

    const response = NextResponse.json({
      success: true,
      token,
      walletAddress,
      roles,
      expiresIn: 24 * 60 * 60
    });

    // Set secure cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Wallet auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

async function getUserRoles(walletAddress: string): Promise<string[]> {
  const defaultRoles = ['user'];
  
  const adminAddresses = process.env.ADMIN_ADDRESSES?.split(',') || [];
  if (adminAddresses.includes(walletAddress.toLowerCase())) {
    return ['admin', 'user'];
  }

  return defaultRoles;
}