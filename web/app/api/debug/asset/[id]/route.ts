import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../../utils/storage/enhanced-data-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = params.id;
    
    // Get asset data
    const assets = await enhancedDataManager.getData('assets');
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const debug = {
      asset,
      urls: {},
      tests: {},
      timestamp: new Date().toISOString()
    };

    // Generate URLs
    if (asset.file_cid) {
      debug.urls.ipfs = `https://gateway.pinata.cloud/ipfs/${asset.file_cid}`;
      debug.urls.ipfs_alt = `https://ipfs.io/ipfs/${asset.file_cid}`;
    }
    
    if (asset.livepeer_playback_id) {
      debug.urls.livepeer = `https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/${asset.livepeer_playback_id}/video/download.mp4`;
      debug.urls.livepeer_hls = `https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls/${asset.livepeer_playback_id}/index.m3u8`;
    }

    // Test URL accessibility
    for (const [key, url] of Object.entries(debug.urls)) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        debug.tests[key] = {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          cors: response.headers.get('access-control-allow-origin')
        };
      } catch (error) {
        debug.tests[key] = {
          error: error.message,
          timeout: error.name === 'AbortError'
        };
      }
    }

    return NextResponse.json(debug);
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed' 
    }, { status: 500 });
  }
}