/**
 * Livepeer Import Service
 * Handles IPFS → Livepeer asset import and transcoding
 */

export interface LivepeerAsset {
  assetId: string;
  playbackId: string;
  playbackUrl: string;
  status: string;
}

export async function importFromIPFS(cid: string, name?: string): Promise<LivepeerAsset> {
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
  
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Livepeer import failed: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  return {
    assetId: data.asset.id,
    playbackId: data.asset.playbackId,
    playbackUrl: `https://lp-playback.com/hls/${data.asset.playbackId}/index.m3u8`,
    status: data.asset.status?.phase || 'processing'
  };
}

export async function checkLivepeerStatus(assetId: string): Promise<{ phase: string }> {
  const response = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
    }
  });

  if (!response.ok) throw new Error(`Status check failed: ${response.statusText}`);
  
  const data = await response.json();
  return { phase: data.status?.phase || 'unknown' };
}