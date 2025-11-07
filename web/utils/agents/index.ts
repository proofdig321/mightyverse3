// Agent Integration Utilities
export interface AssetReviewResult {
  assetId: string;
  confidence: number;
  status: 'approved' | 'rejected' | 'needs_review';
  feedback: string[];
  metadata: {
    quality_score: number;
    technical_issues: string[];
    content_flags: string[];
    recommendations: string[];
  };
}

export interface MetadataResult {
  assetId: string;
  metadata: any;
  ipfsHash: string;
  pinned: boolean;
}

export interface MintApprovalResult {
  assetId: string;
  approved: boolean;
  transactionHash?: string;
  contractAddress: string;
  tokenId?: number;
  gasEstimate: number;
  reason?: string;
}

export class AgentService {
  static async reviewAsset(assetId: string, assetUrl: string, assetType: string): Promise<AssetReviewResult> {
    const response = await fetch('/api/agents/asset-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, assetUrl, assetType })
    });
    return response.json();
  }

  static async generateMetadata(assetId: string, title: string, description: string, assetType: string, tags: string[]): Promise<MetadataResult> {
    const response = await fetch('/api/agents/metadata-gen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, title, description, assetType, tags })
    });
    return response.json();
  }

  static async approveMint(assetId: string, creator: string, metadataHash: string, confidence: number): Promise<MintApprovalResult> {
    const response = await fetch('/api/agents/mint-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, creator, metadataHash, confidence })
    });
    return response.json();
  }
}