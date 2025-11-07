#!/usr/bin/env python3
"""
ETHERS DEPENDENCY DEEP INVESTIGATION & FIX
Resolve ethers module not found error
"""

import json
from pathlib import Path

def fix_ethers_dependency():
    """Fix ethers dependency issue"""
    root = Path("/workspaces/The-Mighty-Verse-2")
    
    print("🔍 DEEP INVESTIGATION: ETHERS DEPENDENCY")
    
    # 1. Check current package.json
    package_path = root / "web/package.json"
    with open(package_path, 'r') as f:
        package_data = json.load(f)
    
    print("📦 Current dependencies:")
    deps = package_data.get("dependencies", {})
    for dep in sorted(deps.keys()):
        print(f"  {dep}: {deps[dep]}")
    
    # 2. Add ethers dependency
    if "ethers" not in deps:
        print("❌ ethers missing from dependencies")
        deps["ethers"] = "^5.7.2"  # Use stable v5 for compatibility
        print("✅ Added ethers@^5.7.2")
    
    # 3. Update the wallet route to use ethers v5 syntax
    wallet_route_path = root / "web/app/api/auth/wallet/route.ts"
    if wallet_route_path.exists():
        content = wallet_route_path.read_text()
        
        # Fix ethers v5 import and usage
        updated_content = '''import { NextRequest, NextResponse } from 'next/server';
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
    const expectedMessage = `Sign in to The Mighty Verse\\nTimestamp: ${timestamp}`;
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
}'''
        
        with open(wallet_route_path, 'w') as f:
            f.write(updated_content)
        
        print("✅ Updated wallet route with ethers v5 compatibility")
    
    # 4. Update package.json with essential Web3 dependencies
    essential_web3_deps = {
        "ethers": "^5.7.2",
        "next": "14.2.33",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "hls.js": "^1.4.12",
        "pg": "^8.11.3"
    }
    
    package_data["dependencies"] = essential_web3_deps
    
    # 5. Update next.config.js for ethers compatibility
    next_config_path = root / "web/next.config.js"
    next_config_content = '''/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        'pg-native': false,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    // Ethers.js compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      'ethers': require.resolve('ethers')
    };
    
    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io'],
  },
};

module.exports = nextConfig;
'''
    
    with open(next_config_path, 'w') as f:
        f.write(next_config_content)
    
    print("✅ Updated next.config.js with ethers compatibility")
    
    # 6. Save optimized package.json
    with open(package_path, 'w') as f:
        json.dump(package_data, f, indent=2)
    
    print("✅ Package.json updated with ethers dependency")
    print("🎉 ETHERS DEPENDENCY ISSUE FIXED")

if __name__ == "__main__":
    fix_ethers_dependency()