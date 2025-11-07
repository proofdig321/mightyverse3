/**
 * Enhanced Metadata Generation Pipeline
 * Integrates AI analysis with manual curation for comprehensive metadata
 */

import { Role } from '../../app/auth/roles';

export interface AssetMetadata {
  card_id: string;
  title: string;
  description: string;
  animator: {
    wallet: string;
    name?: string;
    samro_id?: string;
  };
  technical: {
    dimensions: { width: number; height: number };
    duration: number;
    fps: number;
    file_size: number;
    format: string;
  };
  ai_analysis: {
    confidence: number;
    tags: string[];
    mood: string[];
    style: string[];
    quality_score: number;
    depth_quality?: number;
    segmentation_accuracy?: number;
    audio_quality?: number;
  };
  content: {
    genre: string[];
    themes: string[];
    explicit: boolean;
    language: string;
    transcript?: string;
    bpm?: number;
    key?: string;
  };
  assets: {
    bg_layer: string;
    mg_layer?: string;
    fg_layer?: string;
    audio_file?: string;
    depth_map?: string;
  };
  ipfs: {
    manifest_cid?: string;
    asset_cids: Record<string, string>;
    pinned_at?: string;
  };
  rights: {
    isrc?: string;
    copyright: string;
    license: string;
    contributors: Array<{
      wallet: string;
      role: string;
      percentage: number;
      samro_id?: string;
    }>;
  };
  campaign: {
    ad_anchors?: Array<{
      id: string;
      x: number;
      y: number;
      z: number;
      start_frame: number;
      end_frame: number;
      confidence: number;
    }>;
    monetizable: boolean;
    brand_safe: boolean;
  };
  timestamps: {
    created_at: string;
    updated_at: string;
    submitted_at: string;
    approved_at?: string;
    minted_at?: string;
  };
  status: {
    review_status: 'pending' | 'reviewing' | 'approved' | 'rejected';
    mint_status: 'not_ready' | 'ready' | 'pending' | 'minted' | 'failed';
    campaign_status: 'not_available' | 'available' | 'reserved' | 'active';
  };
}

export interface AIAnalysisResult {
  confidence: number;
  tags: string[];
  mood: string[];
  style: string[];
  quality_metrics: {
    overall: number;
    depth_quality?: number;
    segmentation_accuracy?: number;
    audio_quality?: number;
  };
  technical_analysis: {
    dimensions: { width: number; height: number };
    duration: number;
    file_size: number;
    format: string;
  };
  content_analysis: {
    explicit: boolean;
    language: string;
    transcript?: string;
    bpm?: number;
    key?: string;
  };
  ad_suggestions: Array<{
    x: number;
    y: number;
    z: number;
    confidence: number;
    reason: string;
  }>;
  issues: string[];
}

/**
 * Generate comprehensive metadata from AI analysis and user input
 */
export async function generateAssetMetadata(
  assetId: string,
  userInput: {
    title: string;
    description: string;
    animator_wallet: string;
    contributors?: Array<{ wallet: string; role: string; percentage: number }>;
    genre?: string[];
    themes?: string[];
  },
  aiAnalysis: AIAnalysisResult,
  assetFiles: Record<string, string>
): Promise<AssetMetadata> {
  
  const now = new Date().toISOString();
  
  // Generate ISRC stub (would integrate with actual ISRC service)
  const isrcStub = generateISRCStub();
  
  // Calculate monetization eligibility
  const monetizable = aiAnalysis.quality_metrics.overall >= 0.7 && 
                     !aiAnalysis.content_analysis.explicit &&
                     aiAnalysis.issues.length === 0;
  
  const metadata: AssetMetadata = {
    card_id: assetId,
    title: userInput.title,
    description: userInput.description,
    
    animator: {
      wallet: userInput.animator_wallet,
      // Would fetch from user profile service
      name: undefined,
      samro_id: undefined
    },
    
    technical: {
      dimensions: aiAnalysis.technical_analysis.dimensions,
      duration: aiAnalysis.technical_analysis.duration,
      fps: 30, // Default, would be detected
      file_size: aiAnalysis.technical_analysis.file_size,
      format: aiAnalysis.technical_analysis.format
    },
    
    ai_analysis: {
      confidence: aiAnalysis.confidence,
      tags: aiAnalysis.tags,
      mood: aiAnalysis.mood,
      style: aiAnalysis.style,
      quality_score: aiAnalysis.quality_metrics.overall,
      depth_quality: aiAnalysis.quality_metrics.depth_quality,
      segmentation_accuracy: aiAnalysis.quality_metrics.segmentation_accuracy,
      audio_quality: aiAnalysis.quality_metrics.audio_quality
    },
    
    content: {
      genre: userInput.genre || ['hip-hop'],
      themes: userInput.themes || [],
      explicit: aiAnalysis.content_analysis.explicit,
      language: aiAnalysis.content_analysis.language,
      transcript: aiAnalysis.content_analysis.transcript,
      bpm: aiAnalysis.content_analysis.bpm,
      key: aiAnalysis.content_analysis.key
    },
    
    assets: {
      bg_layer: assetFiles.bgLayer,
      mg_layer: assetFiles.mgLayer,
      fg_layer: assetFiles.fgLayer,
      audio_file: assetFiles.audioFile,
      depth_map: assetFiles.depthMap
    },
    
    ipfs: {
      asset_cids: {}, // Would be populated during IPFS pinning
      pinned_at: undefined
    },
    
    rights: {
      isrc: isrcStub,
      copyright: `© ${new Date().getFullYear()} ${userInput.animator_wallet}`,
      license: 'All Rights Reserved', // Default, would be configurable
      contributors: userInput.contributors || [
        {
          wallet: userInput.animator_wallet,
          role: 'animator',
          percentage: 100
        }
      ]
    },
    
    campaign: {
      ad_anchors: aiAnalysis.ad_suggestions.map((suggestion, index) => ({
        id: `anchor_${index + 1}`,
        x: suggestion.x,
        y: suggestion.y,
        z: suggestion.z,
        start_frame: 0,
        end_frame: Math.floor(aiAnalysis.technical_analysis.duration * 30), // Assume 30fps
        confidence: suggestion.confidence
      })),
      monetizable,
      brand_safe: !aiAnalysis.content_analysis.explicit && aiAnalysis.issues.length === 0
    },
    
    timestamps: {
      created_at: now,
      updated_at: now,
      submitted_at: now
    },
    
    status: {
      review_status: aiAnalysis.confidence >= 0.8 ? 'approved' : 'pending',
      mint_status: 'not_ready',
      campaign_status: monetizable ? 'available' : 'not_available'
    }
  };
  
  return metadata;
}

/**
 * Update metadata with admin review results
 */
export function updateMetadataWithReview(
  metadata: AssetMetadata,
  reviewResult: {
    approved: boolean;
    admin_wallet: string;
    notes?: string;
    ad_anchors?: AssetMetadata['campaign']['ad_anchors'];
  }
): AssetMetadata {
  
  const now = new Date().toISOString();
  
  return {
    ...metadata,
    campaign: {
      ...metadata.campaign,
      ad_anchors: reviewResult.ad_anchors || metadata.campaign.ad_anchors
    },
    timestamps: {
      ...metadata.timestamps,
      updated_at: now,
      approved_at: reviewResult.approved ? now : undefined
    },
    status: {
      ...metadata.status,
      review_status: reviewResult.approved ? 'approved' : 'rejected',
      mint_status: reviewResult.approved ? 'ready' : 'not_ready'
    }
  };
}

/**
 * Update metadata with IPFS pinning results
 */
export function updateMetadataWithIPFS(
  metadata: AssetMetadata,
  ipfsResults: {
    manifest_cid: string;
    asset_cids: Record<string, string>;
  }
): AssetMetadata {
  
  return {
    ...metadata,
    ipfs: {
      manifest_cid: ipfsResults.manifest_cid,
      asset_cids: ipfsResults.asset_cids,
      pinned_at: new Date().toISOString()
    },
    timestamps: {
      ...metadata.timestamps,
      updated_at: new Date().toISOString()
    }
  };
}

/**
 * Update metadata with minting results
 */
export function updateMetadataWithMint(
  metadata: AssetMetadata,
  mintResult: {
    success: boolean;
    tx_hash?: string;
    token_id?: string;
    network: 'testnet' | 'mainnet';
  }
): AssetMetadata {
  
  const now = new Date().toISOString();
  
  return {
    ...metadata,
    timestamps: {
      ...metadata.timestamps,
      updated_at: now,
      minted_at: mintResult.success ? now : undefined
    },
    status: {
      ...metadata.status,
      mint_status: mintResult.success ? 'minted' : 'failed'
    }
  };
}

/**
 * Generate ISRC stub (placeholder implementation)
 */
function generateISRCStub(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const sequence = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `ZA-UNAM-${year}-${sequence}`;
}

/**
 * Validate metadata completeness for minting
 */
export function validateMetadataForMinting(metadata: AssetMetadata): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!metadata.title) missing.push('title');
  if (!metadata.assets.bg_layer) missing.push('background_layer');
  if (!metadata.rights.isrc) missing.push('isrc');
  if (metadata.rights.contributors.length === 0) missing.push('contributors');
  
  // Quality checks
  if (metadata.ai_analysis.confidence < 0.7) {
    warnings.push('Low AI confidence score');
  }
  
  if (!metadata.assets.depth_map) {
    warnings.push('No depth map provided - 3D effects will be limited');
  }
  
  if (!metadata.campaign.ad_anchors || metadata.campaign.ad_anchors.length === 0) {
    warnings.push('No ad anchors defined - monetization limited');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Export metadata for external systems
 */
export function exportMetadata(
  metadata: AssetMetadata,
  format: 'json' | 'csv' | 'isrc_csv'
): string {
  
  switch (format) {
    case 'json':
      return JSON.stringify(metadata, null, 2);
      
    case 'csv':
      // Basic CSV export for spreadsheet analysis
      const csvData = [
        ['Field', 'Value'],
        ['Card ID', metadata.card_id],
        ['Title', metadata.title],
        ['Animator', metadata.animator.wallet],
        ['Duration', `${metadata.technical.duration}s`],
        ['Quality Score', `${Math.round(metadata.ai_analysis.quality_score * 100)}%`],
        ['Status', metadata.status.review_status],
        ['ISRC', metadata.rights.isrc || 'Not assigned'],
        ['Monetizable', metadata.campaign.monetizable ? 'Yes' : 'No']
      ];
      
      return csvData.map(row => row.join(',')).join('\n');
      
    case 'isrc_csv':
      // ISRC export for RISA submission
      return [
        'ISRC,Title,Artist,Duration,Genre',
        `${metadata.rights.isrc},${metadata.title},${metadata.animator.wallet},${metadata.technical.duration},${metadata.content.genre.join(';')}`
      ].join('\n');
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}