'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SimpleVideoPlayerProps {
  fileCid?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
}

export default function SimpleVideoPlayer({ 
  fileCid, 
  className = "w-full h-full", 
  autoPlay = false,
  controls = true,
  muted = false
}: SimpleVideoPlayerProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (fileCid && videoRef.current) {
      const video = videoRef.current;
      
      // Use a simple, reliable gateway
      const videoUrl = `https://cloudflare-ipfs.com/ipfs/${fileCid}`;
      
      video.src = videoUrl;
      video.load();
    }
  }, [fileCid]);

  if (!fileCid) {
    return (
      <div className={`${className} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🎬</div>
          <div className="text-sm mv-text-muted">No video available</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm mv-text-muted">Failed to load video</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className={`${className} bg-black`}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        onLoadStart={() => setLoading(false)}
        onError={() => setError(true)}
        style={{ objectFit: 'contain' }}
      >
        Your browser does not support video playback.
      </video>
      
      {loading && (
        <div className={`${className} absolute inset-0 bg-black/80 flex items-center justify-center`}>
          <div className="animate-spin text-4xl text-yellow-400">◈</div>
        </div>
      )}
    </div>
  );
}