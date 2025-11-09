/**
 * Proper Livepeer Upload Service using SDK and TUS
 */

import { Livepeer } from 'livepeer';
import * as tus from 'tus-js-client';

export interface LivepeerUploadOptions {
  name: string;
  file: File;
  onProgress?: (progress: number) => void;
  enableIPFS?: boolean;
}

export interface LivepeerUploadResult {
  assetId: string;
  playbackId?: string;
  playbackUrl?: string;
  status: string;
}

export class LivepeerUploadService {
  private livepeer: Livepeer;

  constructor(apiKey: string) {
    this.livepeer = new Livepeer({ apiKey });
  }

  async uploadAsset(options: LivepeerUploadOptions): Promise<LivepeerUploadResult> {
    const { name, file, onProgress, enableIPFS = true } = options;

    try {
      // Step 1: Create asset upload request
      console.log('Creating Livepeer asset upload request...', { name, enableIPFS });
      
      const assetData = {
        name,
        storage: enableIPFS ? { ipfs: true } : undefined
      };

      const response = await this.livepeer.asset.create(assetData);
      
      if (!response) {
        throw new Error('Failed to create asset upload request');
      }

      // Type assertion for the response structure
      const uploadResponse = response as any;
      const asset = uploadResponse.asset;
      const tusEndpoint = uploadResponse.tusEndpoint;
      
      console.log('Asset upload request created:', { assetId: asset?.id, tusEndpoint });

      // Step 2: Upload file using TUS
      if (!tusEndpoint) {
        throw new Error('No TUS endpoint provided');
      }

      await this.uploadWithTUS(tusEndpoint, file, onProgress);

      // Step 3: Return asset information
      return {
        assetId: asset?.id || '',
        playbackId: asset?.playbackId,
        playbackUrl: asset?.playbackId ? `https://lp-playback.com/hls/${asset.playbackId}/index.m3u8` : undefined,
        status: asset?.status?.phase || 'processing'
      };

    } catch (error) {
      console.error('Livepeer upload failed:', error);
      throw error;
    }
  }

  private uploadWithTUS(tusEndpoint: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onError: (error) => {
          console.error('TUS upload failed:', error);
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          console.log(`Upload progress: ${percentage}%`);
          if (onProgress) {
            onProgress(percentage);
          }
        },
        onSuccess: () => {
          console.log('TUS upload completed successfully');
          resolve();
        },
      });

      // Start the upload
      upload.start();
    });
  }

  async getAssetStatus(assetId: string): Promise<{ phase: string; playbackId?: string; ipfsCid?: string }> {
    try {
      const response = await this.livepeer.asset.get(assetId);
      
      if (!response) {
        throw new Error('Asset not found');
      }

      // Type assertion for the response structure
      const assetResponse = response as any;
      const asset = assetResponse.asset;

      return {
        phase: asset?.status?.phase || 'unknown',
        playbackId: asset?.playbackId,
        ipfsCid: asset?.storage?.ipfs?.cid
      };
    } catch (error) {
      console.error('Failed to get asset status:', error);
      throw error;
    }
  }
}

// Singleton instance
let uploadService: LivepeerUploadService | null = null;

export function getLivepeerUploadService(): LivepeerUploadService {
  if (!uploadService) {
    const apiKey = process.env.NEXT_PUBLIC_LIVEPEER_API_KEY || process.env.LIVEPEER_API_KEY;
    if (!apiKey) {
      throw new Error('Livepeer API key not configured');
    }
    uploadService = new LivepeerUploadService(apiKey);
  }
  return uploadService;
}