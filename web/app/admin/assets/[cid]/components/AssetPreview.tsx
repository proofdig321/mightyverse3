'use client';

/**
 * Asset Preview Component
 * 2.5D visualization of layered assets with depth effects
 */

import React, { useState, useRef, useEffect } from 'react';

// Simple HLS Video Player Component
function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    } else {
      // Try to load HLS.js for other browsers
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      }).catch(() => {
        // Fallback to direct source
        video.src = src;
      });
    }
  }, [src]);
  
  return (
    <video
      ref={videoRef}
      controls
      className="w-full h-auto"
      poster={poster}
    >
      Your browser does not support video playback.
    </video>
  );
}

interface AssetDetail {
  id: string;
  title: string;
  animator: string;
  submittedAt: string;
  status: string;
  metadata: {
    confidence: number;
    issues: string[];
    tags: string[];
    duration: number;
    dimensions: { width: number; height: number };
    livepeer_playback_url?: string;
    livepeer_thumbnail_url?: string;
    upload_method?: string;
  };
  files: {
    bgLayer: string;
    mgLayer?: string;
    fgLayer?: string;
    audioFile?: string;
    depthMap?: string;
  };
}

interface AssetPreviewProps {
  asset: AssetDetail;
}

export default function AssetPreview({ asset }: AssetPreviewProps) {
  const [activeLayer, setActiveLayer] = useState<'all' | 'bg' | 'mg' | 'fg' | 'depth'>('all');
  const [depthEffect, setDepthEffect] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  const layers = [
    { key: 'bg', name: 'Background', url: asset.files.bgLayer, depth: 0 },
    { key: 'mg', name: 'Middle Ground', url: asset.files.mgLayer, depth: 0.3 },
    { key: 'fg', name: 'Foreground', url: asset.files.fgLayer, depth: 0.6 },
  ].filter(layer => layer.url);

  const drawLayers = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate parallax offset based on current frame for animation effect
    const parallaxOffset = Math.sin(currentFrame * 0.02) * 10;

    layers.forEach((layer, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (activeLayer === 'all' || activeLayer === layer.key) {
          const offsetX = depthEffect ? layer.depth * parallaxOffset : 0;
          const offsetY = depthEffect ? layer.depth * parallaxOffset * 0.5 : 0;
          
          // Apply depth-based scaling
          const scale = depthEffect ? 1 + (layer.depth * 0.1) : 1;
          const scaledWidth = canvas.width * scale;
          const scaledHeight = canvas.height * scale;
          const x = (canvas.width - scaledWidth) / 2 + offsetX;
          const y = (canvas.height - scaledHeight) / 2 + offsetY;
          
          ctx.save();
          
          // Apply depth-based opacity
          if (depthEffect) {
            ctx.globalAlpha = 1 - (layer.depth * 0.2);
          }
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          ctx.restore();
        }
      };
      
      if (layer.url && !layer.url.includes('placeholder')) {
        img.src = layer.url;
      }
    });
  }, [activeLayer, depthEffect, currentFrame, layers]);

  const drawDepthMap = React.useCallback(() => {
    if (!asset.files.depthMap || activeLayer !== 'depth') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Add depth visualization overlay
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, 'rgba(0, 0, 255, 0.3)'); // Near (blue)
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)'); // Far (red)
      
      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    };
    
    img.src = asset.files.depthMap;
  }, [asset.files.depthMap, activeLayer]);

  const animate = React.useCallback(() => {
    if (isPlaying) {
      setCurrentFrame(prev => prev + 1);
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (activeLayer === 'depth') {
      drawDepthMap();
    } else {
      drawLayers();
    }
  }, [activeLayer, drawLayers, drawDepthMap]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  const handlePlayPause = () => {
    if (asset.files.audioFile) {
      const audio = audioRef.current;
      if (audio) {
        if (isPlaying) {
          audio.pause();
        } else {
          audio.play();
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const layerButtons = [
    { key: 'all', name: 'All Layers', icon: '🎬' },
    { key: 'bg', name: 'Background', icon: '🖼️' },
    { key: 'mg', name: 'Middle Ground', icon: '🎨' },
    { key: 'fg', name: 'Foreground', icon: '👤' },
    ...(asset.files.depthMap ? [{ key: 'depth', name: 'Depth Map', icon: '📏' }] : [])
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Asset Preview</h2>
        <p className="text-sm text-gray-600">
          Interactive preview with layer visualization and 2.5D depth effects
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Preview Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-black rounded-lg overflow-hidden">
            {asset.metadata.livepeer_playback_url ? (
              <VideoPlayer 
                src={asset.metadata.livepeer_playback_url}
                poster={asset.metadata.livepeer_thumbnail_url}
              />
            ) : (
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="w-full h-auto"
              />
            )}
            
            {/* Audio Element */}
            {asset.files.audioFile && !asset.metadata.livepeer_playback_url && (
              <audio
                ref={audioRef}
                src={asset.files.audioFile}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>
          
          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {asset.files.audioFile && (
                <button
                  onClick={handlePlayPause}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <span className="mr-2">{isPlaying ? '⏸️' : '▶️'}</span>
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="depthEffect"
                  checked={depthEffect}
                  onChange={(e) => setDepthEffect(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="depthEffect" className="text-sm text-gray-700">
                  2.5D Depth Effect
                </label>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {asset.metadata.dimensions.width} × {asset.metadata.dimensions.height} • {asset.metadata.duration}s
            </div>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Layer Controls</h3>
            <div className="space-y-2">
              {layerButtons.map((button) => (
                <button
                  key={button.key}
                  onClick={() => setActiveLayer(button.key as any)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeLayer === button.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span className="mr-2">{button.icon}</span>
                  {button.name}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Information */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Asset Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Animator:</span>
                <div className="font-mono text-xs">{asset.animator}</div>
              </div>
              
              <div>
                <span className="text-gray-500">Submitted:</span>
                <div>{new Date(asset.submittedAt).toLocaleDateString()}</div>
              </div>
              
              <div>
                <span className="text-gray-500">AI Confidence:</span>
                <div className={`font-medium ${
                  asset.metadata.confidence >= 0.8 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {Math.round(asset.metadata.confidence * 100)}%
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {asset.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {asset.metadata.upload_method && (
                <div>
                  <span className="text-gray-500">Upload Method:</span>
                  <div className="text-sm">{asset.metadata.upload_method}</div>
                </div>
              )}
            </div>
          </div>

          {/* Video Information */}
          {asset.metadata.livepeer_playback_url && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Video Stream</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">HLS Stream</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Thumbnail</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Transcoded</span>
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Layer Information */}
          {!asset.metadata.livepeer_playback_url && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Available Layers</h4>
              <div className="space-y-1 text-xs">
                {layers.map((layer) => (
                  <div key={layer.key} className="flex items-center justify-between">
                    <span className="text-gray-600">{layer.name}</span>
                    <span className="text-green-600">✓</span>
                  </div>
                ))}
                {asset.files.depthMap && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Depth Map</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
                {asset.files.audioFile && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Audio Track</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issues */}
          {asset.metadata.issues.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Issues Detected</h4>
              <div className="space-y-1">
                {asset.metadata.issues.map((issue, index) => (
                  <div key={index} className="flex items-center text-xs text-red-600">
                    <span className="mr-1">⚠️</span>
                    {issue.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}