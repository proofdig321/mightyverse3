'use client';

import React, { useState, useEffect } from 'react';

interface MediaRendererProps {
  fileCid?: string;
  thumbnailCid?: string;
  mimeType?: string;
  fileName?: string;
  className?: string;
}

export default function MediaRenderer({ 
  fileCid, 
  thumbnailCid, 
  mimeType, 
  fileName,
  className = "w-full h-48 object-cover rounded-lg"
}: MediaRendererProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [livepeerPlaybackId, setLivepeerPlaybackId] = useState<string | null>(null);
  const [useIpfs, setUseIpfs] = useState(false);
  
  // Use gateway manager for intelligent fallback
  const [gateway, setGateway] = useState<string>('https://ipfs.io/ipfs/');
  
  useEffect(() => {
    if (fileCid && fileCid.trim() !== '') {
      import('../../utils/storage/enhanced-data-store').then(({ gatewayManager }) => {
        gatewayManager.getIPFSUrl(fileCid)
          .then(setGateway)
          .catch((err) => {
            console.error('Gateway manager failed:', err);
            setError(true);
          });
      });
    }
  }, [fileCid]);
  
  const [livepeerPlaybackUrl, setLivepeerPlaybackUrl] = useState<string | null>(null);

  // Check for Livepeer stream availability
  useEffect(() => {
    if (fileCid && (mimeType?.startsWith('video/') || fileName?.match(/\.(mp4|mov|webm)$/i))) {
      fetch(`/api/livepeer/stream?cid=${fileCid}`)
        .then(res => res.json())
        .then(data => {
          if (data.playbackId) {
            setLivepeerPlaybackId(data.playbackId);
            setLivepeerPlaybackUrl(data.playbackUrl || null);
          } else {
            setUseIpfs(true);
          }
        })
        .catch(() => setUseIpfs(true));
    }
  }, [fileCid, mimeType, fileName]);
  
  if (!fileCid) {
    return (
      <div className={`${className} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-sm mv-text-muted">No preview available</div>
        </div>
      </div>
    );
  }

  const fileUrl = (gateway.includes('/ipfs/') && gateway.length > 20) ? gateway : `${gateway}${fileCid}`;
  const thumbnailUrl = thumbnailCid ? 
    `https://ipfs.io/ipfs/${thumbnailCid}` : null;

  if (error) {
    return (
      <div className={`${className} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm mv-text-muted">Failed to load media</div>
          <div className="text-xs mv-text-muted mt-1">{fileName}</div>
        </div>
      </div>
    );
  }

  // Image rendering
  if (mimeType?.startsWith('image/')) {
    return (
      <div className="relative">
        <img
          src={thumbnailUrl || fileUrl}
          alt={fileName || 'Media asset'}
          className={className}
          crossOrigin="anonymous"
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
        {loading && (
          <div className={`${className} absolute inset-0 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
            <div className="animate-spin text-2xl">◈</div>
          </div>
        )}
      </div>
    );
  }

  // Audio rendering
  if (mimeType?.startsWith('audio/')) {
    return (
      <div className={`${className} bg-white/5 border border-white/10 rounded-lg p-4`}>
        <div className="flex items-center space-x-4 h-full">
          <div className="text-4xl">🎵</div>
          <div className="flex-1">
            <div className="text-white font-medium mb-2">{fileName}</div>
            <audio 
              controls 
              className="w-full"
              crossOrigin="anonymous"
              onLoadStart={() => setLoading(false)}
              onError={() => setError(true)}
            >
              <source src={fileUrl} type={mimeType} />
              Your browser does not support audio playback.
            </audio>
          </div>
        </div>
      </div>
    );
  }

  // Video and Animation rendering
  if (mimeType?.startsWith('video/') || fileName?.match(/\.(mp4|mov|webm|gif)$/i)) {
    const videoUrl = livepeerPlaybackId && !useIpfs 
      ? (livepeerPlaybackUrl || `https://lp-playback.com/hls/${livepeerPlaybackId}/index.m3u8`)
      : fileUrl;
    
    const isLivepeer = livepeerPlaybackId && !useIpfs;
    
    return (
      <div className="relative group">
        {isLivepeer ? (
          <video
            controls
            controlsList="nodownload"
            preload="metadata"
            playsInline
            crossOrigin="anonymous"
            className={`${className} bg-black`}
            poster={thumbnailUrl || undefined}
            onLoadStart={() => setLoading(false)}
            onLoadedData={() => setLoading(false)}
            onCanPlay={() => setLoading(false)}
            onError={() => {
              console.log('Livepeer failed, falling back to IPFS');
              setUseIpfs(true);
            }}
            style={{ objectFit: 'contain' }}
          >
            <source src={videoUrl} type="application/x-mpegURL" />
            <track kind="captions" />
            Your browser does not support video playback.
          </video>
        ) : (
          <video
            controls
            controlsList="nodownload"
            preload="none"
            playsInline
            crossOrigin="anonymous"
            autoPlay={fileName?.includes('.gif')}
            loop={fileName?.includes('.gif')}
            muted={fileName?.includes('.gif')}
            className={`${className} bg-black`}
            poster={thumbnailUrl || undefined}
            onLoadStart={() => setLoading(false)}
            onLoadedData={() => setLoading(false)}
            onCanPlay={() => setLoading(false)}
            onError={(e) => {
              console.error('Video failed:', e);
              setError(true);
            }}
            style={{ objectFit: 'contain' }}
          >
            <source src={fileUrl} type={mimeType || 'video/mp4'} />
            Your browser does not support video playback.
          </video>
        )}
        
        {/* Enhanced Loading State */}
        {loading && (
          <div className={`${className} absolute inset-0 bg-black/80 border border-white/10 rounded-lg flex flex-col items-center justify-center`}>
            <div className="animate-spin text-4xl mb-4 text-yellow-400">◈</div>
            <div className="text-white text-sm">
              {isLivepeer ? 'Loading optimized stream...' : 'Loading content...'}
            </div>
            <div className="text-xs mv-text-muted mt-2 break-all max-w-xs">
              {isLivepeer ? 'Livepeer CDN' : fileUrl}
            </div>
          </div>
        )}
        
        {/* Performance Indicator */}
        {isLivepeer && (
          <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
            ⚡ Fast
          </div>
        )}
        
        {/* Holographic Overlay Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-blue-400/10 animate-pulse" />
        </div>
      </div>
    );
  }

  // 3D Model placeholder
  if (mimeType?.includes('model') || fileName?.match(/\.(fbx|obj|glb|gltf)$/i)) {
    return (
      <div className={`${className} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🎲</div>
          <div className="text-sm text-white mb-1">3D Model</div>
          <div className="text-xs mv-text-muted">{fileName}</div>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-yellow-400 hover:text-yellow-300 mt-2 inline-block"
          >
            Download to view
          </a>
        </div>
      </div>
    );
  }

  // Generic file
  return (
    <div className={`${className} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
      <div className="text-center">
        <div className="text-4xl mb-2">📄</div>
        <div className="text-sm text-white mb-1">{fileName}</div>
        <div className="text-xs mv-text-muted mb-2">{mimeType}</div>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-yellow-400 hover:text-yellow-300"
        >
          Download
        </a>
      </div>
    </div>
  );
}