'use client';

import React, { useState, useRef, useEffect } from 'react';

interface HolographicVideoPlayerProps {
  fileCid?: string;
  thumbnailCid?: string;
  mimeType?: string;
  fileName?: string;
  title?: string;
  className?: string;
  renditions?: Array<{
    cid: string;
    width?: number;
    height?: number;
    bitrate?: number;
    label?: string;
  }>;
}

export default function HolographicVideoPlayer({ 
  fileCid, 
  thumbnailCid, 
  mimeType, 
  fileName,
  title,
  className = "w-full aspect-video max-h-[60vh] min-h-[220px]",
  renditions
}: HolographicVideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [holographicIntensity, setHolographicIntensity] = useState(0.7);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const debug = process.env.NEXT_PUBLIC_DEBUG === 'true';
  const [inView, setInView] = useState(false);
  const [selectedCid, setSelectedCid] = useState<string | undefined>(fileCid);
  const [manualRendition, setManualRendition] = useState<string | undefined>();
  const [showRenditionToggle, setShowRenditionToggle] = useState(false);
  
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
  
  if (!fileCid) {
    return (
      <div className={`${className} bg-black/50 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🎬</div>
          <div className="text-sm mv-text-muted">No video available</div>
        </div>
      </div>
    );
  }

  const fileUrl = `${gateway}${fileCid}`;
  const thumbnailUrl = thumbnailCid ? `${gateway}${thumbnailCid}` : null;
  
  // Debug logging
  useEffect(() => {
    // determine small screen to reduce visual complexity
    const onResize = () => {
      try {
        setIsSmallScreen(window.innerWidth < 640);
      } catch (e) {
        setIsSmallScreen(false);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Select the best CID based on available renditions and screen size
  useEffect(() => {
    if (manualRendition) {
      setSelectedCid(manualRendition);
      return;
    }

    if (renditions && renditions.length > 0) {
      // pick smallest by width when on small screen, otherwise pick highest width
      const numericRenditions = renditions
        .map(r => ({ ...r, width: r.width || (r.height ? Math.round((r.height * 16) / 9) : undefined) }))
        .filter(r => r.cid);

      if (isSmallScreen) {
        const smallest = numericRenditions.reduce((prev, cur) => {
          if (!prev.width) return cur;
          if (!cur.width) return prev;
          return cur.width < prev.width ? cur : prev;
        }, numericRenditions[0]);
        setSelectedCid(smallest?.cid || fileCid);
      } else {
        const largest = numericRenditions.reduce((prev, cur) => {
          if (!prev.width) return cur;
          if (!cur.width) return prev;
          return cur.width > prev.width ? cur : prev;
        }, numericRenditions[0]);
        setSelectedCid(largest?.cid || fileCid);
      }
    } else {
      setSelectedCid(fileCid);
    }
  }, [renditions, isSmallScreen, fileCid, manualRendition]);

  // Lazy-load: only attach source when player is in viewport
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      io.observe(el);
      return () => io.disconnect();
    } else {
      // fallback: assume in view
      setInView(true);
    }
  }, [videoRef]);

  useEffect(() => {
    if (debug) {
      // only log in debug mode to avoid noisy production consoles
      console.log('HolographicVideoPlayer Debug:', {
        fileCid,
        fileUrl,
        mimeType,
        fileName,
        gateway
      });
    }
  }, [fileCid, fileUrl, mimeType, fileName, gateway, debug]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (error) {
    return (
      <div className={`${className} bg-black/50 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm mv-text-muted">Failed to load video</div>
          <div className="text-xs mv-text-muted mt-1">{fileName}</div>
          <div className="text-xs mv-text-muted mt-2 break-all max-w-xs">
            URL: {fileUrl}
          </div>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-yellow-400 hover:text-yellow-300 mt-2 inline-block"
          >
            Test Direct Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Holographic Container */}
      <div 
        className={`${className} relative overflow-hidden rounded-xl bg-black`}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Background Holographic Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated Background */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-green-900/20"
            style={{
              transform: `translateZ(${holographicIntensity * -10}px) rotateY(${isPlaying ? '2deg' : '0deg'})`,
              filter: `blur(${holographicIntensity * 1}px)`,
              transition: 'all 0.3s ease'
            }}
          />
          
          {/* Holographic Rings (reduced on small screens) */}
          {[...Array(isSmallScreen ? 1 : 3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-yellow-400/20"
              style={{
                inset: `${i * 20}px`,
                animation: `ping ${3 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
                opacity: holographicIntensity * 0.5
              }}
            />
          ))}

          {/* Floating Particles (lighter on small screens for perf) */}
          {[...Array(isSmallScreen ? 4 : 12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: holographicIntensity * 0.6
              }}
            />
          ))}
        </div>

        {/* Rendition Toggle */}
        {renditions && renditions.length > 0 && (
          <div 
            className="absolute bottom-14 right-0 z-20 bg-black/80 rounded-l-lg overflow-hidden transition-all"
            onMouseEnter={() => setShowRenditionToggle(true)}
            onMouseLeave={() => setShowRenditionToggle(false)}
          >
            <button 
              onClick={() => setShowRenditionToggle(!showRenditionToggle)}
              className="px-2 py-1 text-xs text-white/80 hover:text-white"
            >
              {showRenditionToggle ? '◀ Quality' : 'Quality ▶'}
            </button>
            {showRenditionToggle && (
              <div className="px-2 py-1">
                <button
                  onClick={() => setManualRendition(undefined)}
                  className={`block w-full text-left px-2 py-1 text-xs rounded ${!manualRendition ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  Auto
                </button>
                {renditions.map((r, i) => (
                  <button
                    key={r.cid}
                    onClick={() => setManualRendition(r.cid)}
                    className={`block w-full text-left px-2 py-1 text-xs rounded ${manualRendition === r.cid ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  >
                    {r.label || `${r.width}x${r.height || '?'}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Video */}
        <video
          ref={videoRef}
          controls
          controlsList="nodownload"
          preload="metadata"
          crossOrigin="anonymous"
          playsInline
          className="w-full h-full object-contain relative z-10"
          poster={thumbnailUrl || undefined}
          onLoadStart={() => setLoading(false)}
          onLoadedData={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={(e) => {
            console.error('Video error:', e);
            console.error('Video URL:', fileUrl);
            setError(true);
            setLoading(false);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            transform: `translateZ(${holographicIntensity * (isSmallScreen ? 2 : 5)}px)`,
            filter: `drop-shadow(0 0 ${holographicIntensity * (isSmallScreen ? 8 : 20)}px rgba(212, 175, 55, 0.25))`
          }}
        >
          {/* Attach source only when in view to avoid unnecessary buffering */}
          {inView && selectedCid && (
            <source src={`${gateway}${selectedCid}`} type={mimeType || 'video/mp4'} />
          )}
          <track kind="captions" />
          Your browser does not support video playback.
        </video>

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
            <div className="animate-spin text-4xl mb-4 text-yellow-400">◈</div>
            <div className="text-white text-sm">Loading holographic content...</div>
          </div>
        )}

        {/* Holographic Status Indicators */}
        <div className="absolute top-4 left-4 flex space-x-2 z-20">
          <div className="bg-black/70 px-2 py-1 rounded text-xs text-green-400 backdrop-blur-sm">
            2.5D HOLOGRAPHIC
          </div>
          {isPlaying && (
            <div className="bg-black/70 px-2 py-1 rounded text-xs text-yellow-400 backdrop-blur-sm animate-pulse">
              PLAYING
            </div>
          )}
        </div>

        {/* Holographic Intensity Control */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
            <span className="text-xs text-white">2.5D</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={holographicIntensity}
              onChange={(e) => setHolographicIntensity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${holographicIntensity * 100}%, rgba(255,255,255,0.2) ${holographicIntensity * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Video Info */}
      {title && (
        <div className="mt-4 text-center">
          <h3 className="mv-heading-md text-white">{title}</h3>
          <div className="flex justify-center items-center space-x-4 mt-2 text-sm mv-text-muted">
            <span>2.5D Holographic Experience</span>
            <span>•</span>
            <span>IPFS Stored</span>
          </div>
        </div>
      )}
    </div>
  );
}