/**
 * IPFS Role Manifest Management
 * Handles CRUD operations for role manifests stored on IPFS
 */

import { Role, RoleManifest, RoleRegistry, isValidRoleManifest } from '../../app/auth/roles';

const ROLE_REGISTRY_PATH = '/data/roles/role_registry.json';
const NFT_STORAGE_API = 'https://api.nft.storage/upload';

/**
 * Create and pin a new role manifest to IPFS
 */
export async function createRoleManifest(
  wallet: string,
  roles: Role[],
  adminWallet: string,
  adminSignature: string
): Promise<string> {
  const manifest: RoleManifest = {
    wallet: wallet.toLowerCase(),
    roles,
    issued_by: adminWallet.toLowerCase(),
    issued_at: new Date().toISOString(),
    expires_at: null,
    admin_sig: adminSignature,
    version: '1.0'
  };

  // Pin manifest to IPFS
  const manifestCid = await pinJsonToIPFS(manifest);
  
  // Update role registry
  await updateRoleRegistry(wallet, manifestCid);
  
  return manifestCid;
}

/**
 * Retrieve role manifest from IPFS
 */
export async function getRoleManifest(wallet: string): Promise<RoleManifest | null> {
  try {
    // Check if wallet is super admin
    const superAdminWallet = process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || '0x860Ec697167Ba865DdE1eC9e172004100613e970';
    
    if (wallet.toLowerCase() === superAdminWallet.toLowerCase()) {
      // Return super admin manifest
      return {
        wallet: wallet.toLowerCase(),
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CURATOR, Role.ANIMATOR, Role.SPONSOR],
        issued_by: 'system',
        issued_at: new Date().toISOString(),
        expires_at: null,
        admin_sig: 'system_super_admin',
        version: '1.0'
      };
    }
    
    const registry = await getRoleRegistry();
    const manifestCid = registry.registry[wallet.toLowerCase()];
    
    if (!manifestCid) return null;
    
    const manifest = await fetchFromIPFS(manifestCid);
    
    if (!isValidRoleManifest(manifest)) {
      console.error('Invalid role manifest format:', manifest);
      return null;
    }
    
    // Verify signature (placeholder - implement EIP-712 verification)
    if (!await verifyManifestSignature(manifest)) {
      console.error('Invalid manifest signature');
      return null;
    }
    
    return manifest;
  } catch (error) {
    console.error('Error fetching role manifest:', error);
    return null;
  }
}

/**
 * Revoke roles by creating a new manifest with empty roles
 */
export async function revokeRoles(
  wallet: string,
  adminWallet: string,
  adminSignature: string
): Promise<string> {
  return createRoleManifest(wallet, [], adminWallet, adminSignature);
}

/**
 * Update role registry with new manifest CID
 */
async function updateRoleRegistry(wallet: string, manifestCid: string): Promise<void> {
  try {
    const registry = await getRoleRegistry();
    registry.registry[wallet.toLowerCase()] = manifestCid;
    registry._metadata.last_updated = new Date().toISOString();
    
    // In production, this would pin the updated registry to IPFS
    // For now, we'll use local storage simulation
    if (typeof window !== 'undefined') {
      localStorage.setItem('role_registry', JSON.stringify(registry));
    }
  } catch (error) {
    console.error('Error updating role registry:', error);
    throw error;
  }
}

/**
 * Get current role registry
 */
async function getRoleRegistry(): Promise<RoleRegistry> {
  try {
    // In production, fetch from IPFS
    // For now, use local storage with fallback to default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('role_registry');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    
    // Default registry structure
    return {
      _metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      _admin_wallets: [],
      registry: {}
    };
  } catch (error) {
    console.error('Error fetching role registry:', error);
    throw error;
  }
}

/**
 * Pin JSON data to IPFS via nft.storage
 */
async function pinJsonToIPFS(data: any): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY;
  
  if (!apiKey) {
    // Development fallback - generate mock CID
    const mockCid = `bafybeig${Math.random().toString(36).substring(2, 15)}`;
    console.warn('No NFT_STORAGE_KEY found, using mock CID:', mockCid);
    
    // Store in localStorage for development
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ipfs_${mockCid}`, JSON.stringify(data));
    }
    
    return mockCid;
  }
  
  try {
    const response = await fetch(NFT_STORAGE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.value?.cid || result.cid;
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    throw error;
  }
}

/**
 * Fetch data from IPFS
 */
async function fetchFromIPFS(cid: string): Promise<any> {
  try {
    // Development fallback - check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`ipfs_${cid}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    
    // Production IPFS fetch
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
}

/**
 * Verify manifest signature (placeholder for EIP-712 implementation)
 */
async function verifyManifestSignature(manifest: RoleManifest): Promise<boolean> {
  // TODO: Implement EIP-712 signature verification
  // For now, return true for development
  return true;
}