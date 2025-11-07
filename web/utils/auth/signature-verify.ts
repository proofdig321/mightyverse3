/**
 * EIP-712 Signature Utilities
 * Handles signature creation and verification for role manifests
 */

import { Role, RoleManifest } from '../../app/auth/roles';

// EIP-712 Domain for The Mighty Verse
export const EIP712_DOMAIN = {
  name: 'The Mighty Verse',
  version: '1',
  chainId: 1, // Mainnet - adjust for your target network
  verifyingContract: '0x0000000000000000000000000000000000000000' // Replace with actual contract
};

// EIP-712 Types for Role Assignment
export const ROLE_ASSIGNMENT_TYPES = {
  RoleAssignment: [
    { name: 'wallet', type: 'address' },
    { name: 'roles', type: 'string[]' },
    { name: 'issuedBy', type: 'address' },
    { name: 'issuedAt', type: 'string' },
    { name: 'expiresAt', type: 'string' },
    { name: 'nonce', type: 'uint256' }
  ]
};

/**
 * Create EIP-712 signature payload for role assignment
 */
export function createRoleAssignmentPayload(
  wallet: string,
  roles: Role[],
  adminWallet: string,
  expiresAt: string | null = null,
  nonce: number = Date.now()
) {
  return {
    domain: EIP712_DOMAIN,
    types: ROLE_ASSIGNMENT_TYPES,
    primaryType: 'RoleAssignment',
    message: {
      wallet: wallet.toLowerCase(),
      roles: roles,
      issuedBy: adminWallet.toLowerCase(),
      issuedAt: new Date().toISOString(),
      expiresAt: expiresAt || '0',
      nonce: nonce
    }
  };
}

/**
 * Sign role assignment using wallet (browser-based)
 */
export async function signRoleAssignment(
  wallet: string,
  roles: Role[],
  adminWallet: string,
  signer: any // ethers.Signer or similar
): Promise<string> {
  const payload = createRoleAssignmentPayload(wallet, roles, adminWallet);
  
  try {
    // Use eth_signTypedData_v4 for EIP-712 signing
    const signature = await (signer as any)._signTypedData(
      payload.domain,
      payload.types,
      payload.message
    );
    
    return signature;
  } catch (error) {
    console.error('Error signing role assignment:', error);
    throw new Error('Failed to sign role assignment');
  }
}

/**
 * Verify EIP-712 signature for role manifest
 */
export async function verifyRoleManifestSignature(
  manifest: RoleManifest,
  expectedSigner: string
): Promise<boolean> {
  try {
    // Reconstruct the original payload
    const payload = createRoleAssignmentPayload(
      manifest.wallet,
      manifest.roles,
      manifest.issued_by,
      manifest.expires_at
    );
    
    // Verify signature (requires ethers.js or similar)
    const recoveredAddress = await recoverSignerAddress(payload, manifest.admin_sig);
    
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Recover signer address from EIP-712 signature
 */
async function recoverSignerAddress(payload: any, signature: string): Promise<string> {
  // This is a placeholder - in production, use ethers.js utils.verifyTypedData
  // or similar library for proper signature recovery
  
  try {
    // Import ethers dynamically to avoid SSR issues
    const { ethers } = await import('ethers');
    
    const recoveredAddress = (ethers.utils as any).verifyTypedData(
      payload.domain,
      payload.types,
      payload.message,
      signature
    );
    
    return recoveredAddress;
  } catch (error) {
    console.error('Error recovering signer address:', error);
    throw error;
  }
}

/**
 * Generate nonce for signature uniqueness
 */
export function generateNonce(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Validate signature format
 */
export function isValidSignature(signature: string): boolean {
  // Basic validation - should be 132 characters (0x + 130 hex chars)
  const signatureRegex = /^0x[a-fA-F0-9]{130}$/;
  return signatureRegex.test(signature);
}

/**
 * Create signature request for frontend
 */
export function createSignatureRequest(
  wallet: string,
  roles: Role[],
  adminWallet: string
) {
  const payload = createRoleAssignmentPayload(wallet, roles, adminWallet);
  
  return {
    method: 'eth_signTypedData_v4',
    params: [adminWallet, JSON.stringify(payload)],
    payload: payload
  };
}