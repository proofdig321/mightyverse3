/**
 * Enhanced Livepeer Service
 * Handles direct upload, transcoding, and IPFS export
 */

export interface LivepeerAsset {
  assetId: string;
  playbackId: string;
  playbackUrl: string;
  status: string;
  uploadUrl?: string;
  ipfsCid?: string;
}

export interface LivepeerUploadRequest {
  name: string;
  enableExport?: boolean;
}

export async function importFromIPFS(cid: string, name?: string): Promise<LivepeerAsset> {
  // Try multiple gateway URLs for better success rate (CORS-friendly only)
  const gatewayUrls = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://w3s.link/ipfs/${cid}`
  ];
  
  if (!process.env.LIVEPEER_API_KEY) {
    throw new Error('LIVEPEER_API_KEY not configured');
  }
  
  // Test API key validity first
  console.log('Testing Livepeer API key...');
  const testResponse = await fetch('https://livepeer.studio/api/asset', {
    headers: { 'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}` }
  });
  
  if (!testResponse.ok) {
    console.error('Livepeer API key test failed:', testResponse.status, testResponse.statusText);
    throw new Error(`Livepeer API authentication failed: ${testResponse.status}`);
  }
  
  // Try each gateway URL
  for (const gatewayUrl of gatewayUrls) {
    try {
      console.log('Importing to Livepeer:', { cid, name, gatewayUrl });
      
      const response = await fetch('https://livepeer.studio/api/asset/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name || `asset-${cid.slice(0, 8)}`,
          url: gatewayUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Livepeer import successful:', data);
        
        if (!data.asset) {
          throw new Error('Invalid Livepeer response: missing asset data');
        }
        
        return {
          assetId: data.asset.id,
          playbackId: data.asset.playbackId,
          playbackUrl: `https://lp-playback.com/hls/${data.asset.playbackId}/index.m3u8`,
          status: data.asset.status?.phase || 'processing'
        };
      } else {
        const errorText = await response.text();
        console.warn(`Gateway ${gatewayUrl} failed:`, response.status, errorText);
        
        // Don't throw on first failures, try next gateway
        if (gatewayUrl === gatewayUrls[gatewayUrls.length - 1]) {
          throw new Error(`All gateways failed. Last error: ${response.status} ${errorText}`);
        }
      }
    } catch (error) {
      console.error(`Gateway ${gatewayUrl} error:`, error);
      if (gatewayUrl === gatewayUrls[gatewayUrls.length - 1]) {
        throw error;
      }
    }
  }
  
  throw new Error('All import attempts failed');
}

export async function requestLivepeerUpload(request: LivepeerUploadRequest): Promise<{ uploadUrl: string; assetId: string }> {
  if (!process.env.LIVEPEER_API_KEY) {
    throw new Error('LIVEPEER_API_KEY not configured');
  }

  const response = await fetch('https://livepeer.studio/api/asset/request-upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: request.name,
      storage: request.enableExport ? { ipfs: true } : undefined
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    uploadUrl: data.url,
    assetId: data.asset.id
  };
}

export async function uploadToLivepeer(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file
  });

  if (!response.ok) {
    throw new Error(`File upload failed: ${response.statusText}`);
  }
}

export async function exportToIPFS(assetId: string, metadata?: any): Promise<{ ipfsCid: string }> {
  if (!process.env.LIVEPEER_API_KEY) {
    throw new Error('LIVEPEER_API_KEY not configured');
  }

  const response = await fetch(`https://livepeer.studio/api/asset/${assetId}/export`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ipfs: {
        pinningService: 'pinata',
        metadata: {
          platform: 'mighty-verse',
          ...metadata
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IPFS export failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return { ipfsCid: data.ipfs.cid };
}

export async function checkLivepeerStatus(assetId: string): Promise<{ phase: string; playbackId?: string }> {
  const response = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
    }
  });

  if (!response.ok) throw new Error(`Status check failed: ${response.statusText}`);
  
  const data = await response.json();
  return { 
    phase: data.status?.phase || 'unknown',
    playbackId: data.playbackId
  };
}