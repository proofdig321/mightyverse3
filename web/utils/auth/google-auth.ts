'use client';

/**
 * Simple wallet connection utilities
 * Works with ThirdWeb's built-in wallet system
 */

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  walletAddress: string;
}

// Generate user info from wallet address
export function createUserFromAddress(address: string): GoogleUser {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  return {
    email: `user-${shortAddress}@themightyverse.app`,
    name: `User ${shortAddress}`,
    picture: '',
    walletAddress: address,
  };
}

export type { GoogleUser };