/**
 * Blockchain Contract Integration
 * Integration layer for smart contract interactions
 */

import { ethers } from 'ethers';

// Contract ABIs (simplified for key functions)
const MIGHTY_VERSE_ASSETS_ABI = [
  "function mintWithSignature((address to, uint256 tokenId, uint256 amount, string metadataURI, uint256 nonce, uint256 deadline), bytes signature) external",
  "function batchMint(address[] recipients, uint256[] amounts, string[] metadataURIs) external",
  "function setTokenRoyalty(uint256 tokenId, address recipient, uint96 royaltyFraction) external",
  "function getNonce(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function uri(uint256 tokenId) external view returns (string)",
  "function getAssetMetadata(uint256 tokenId) external view returns (tuple(string contentCID, string metadataCID, address creator, uint256 createdAt, bool isActive))"
];

const CREDIT_TOKEN_ABI = [
  "function mintWithSignature((address to, uint256 amount, uint256 nonce, uint256 deadline), bytes signature) external",
  "function deductCreditsForOperation(address from, string operation) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function getOperationCost(string operation) external view returns (uint256)",
  "function canAffordOperation(address user, string operation) external view returns (bool)"
];

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  MIGHTY_VERSE_ASSETS: process.env.NEXT_PUBLIC_ASSETS_CONTRACT || '',
  CREDIT_TOKEN: process.env.NEXT_PUBLIC_CREDIT_TOKEN_CONTRACT || '',
  APPROVAL_REGISTRY: process.env.NEXT_PUBLIC_APPROVAL_REGISTRY_CONTRACT || ''
};

// Network configuration
export const NETWORKS = {
  POLYGON_MAINNET: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  POLYGON_MUMBAI: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com'
  }
};

export interface MintRequest {
  to: string;
  tokenId: number;
  amount: number;
  metadataURI: string;
  nonce: number;
  deadline: number;
}

export interface AssetMetadata {
  contentCID: string;
  metadataCID: string;
  creator: string;
  createdAt: number;
  isActive: boolean;
}

export class ContractIntegration {
  private provider: ethers.providers.Provider;
  private signer?: ethers.Signer;
  private assetsContract?: ethers.Contract;
  private creditContract?: ethers.Contract;

  constructor(provider: ethers.providers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.initializeContracts();
  }

  private initializeContracts() {
    if (CONTRACT_ADDRESSES.MIGHTY_VERSE_ASSETS) {
      this.assetsContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MIGHTY_VERSE_ASSETS,
        MIGHTY_VERSE_ASSETS_ABI,
        this.signer || this.provider
      );
    }

    if (CONTRACT_ADDRESSES.CREDIT_TOKEN) {
      this.creditContract = new ethers.Contract(
        CONTRACT_ADDRESSES.CREDIT_TOKEN,
        CREDIT_TOKEN_ABI,
        this.signer || this.provider
      );
    }
  }

  /**
   * Mint NFT with admin signature
   */
  async mintWithSignature(
    request: MintRequest,
    signature: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.assetsContract) {
      throw new Error('Assets contract not initialized');
    }

    return await this.assetsContract.mintWithSignature(request, signature);
  }

  /**
   * Get user's nonce for signature verification
   */
  async getNonce(address: string): Promise<number> {
    if (!this.assetsContract) {
      throw new Error('Assets contract not initialized');
    }

    const nonce = await this.assetsContract.getNonce(address);
    return nonce.toNumber();
  }

  /**
   * Generate EIP-712 signature for mint request
   */
  async signMintRequest(
    request: MintRequest,
    contractAddress: string,
    chainId: number
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    const domain = {
      name: 'MightyVerseAssets',
      version: '1',
      chainId: chainId,
      verifyingContract: contractAddress
    };

    const types = {
      MintRequest: [
        { name: 'to', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'metadataURI', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    return await (this.signer as any)._signTypedData(domain, types, request);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.ContractReceipt> {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }
}

/**
 * Create contract integration instance
 */
export function createContractIntegration(
  provider: ethers.providers.Provider,
  signer?: ethers.Signer
): ContractIntegration {
  return new ContractIntegration(provider, signer);
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string, length: number = 10): string {
  return `${hash.slice(0, length)}...${hash.slice(-4)}`;
}