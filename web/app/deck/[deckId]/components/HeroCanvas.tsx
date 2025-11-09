'use client';

/**
 * HeroCanvas - Holographic 2.5D Visualization
 * Advanced holographic rendering with depth effects and interactive elements
 */

import React, { useRef, useEffect, useState } from 'react';

interface CardData {
  id: string;
  title: string;
  layers: {
    background: string;
    midground: string;
    foreground: string;
    depthMapCid?: string;
  };
  adAnchors?: AdAnchor[];
}

interface AdAnchor {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  confidence: number;
  enabled: boolean;
}

interface HeroCanvasProps {
  card?: CardData;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  animatorVersion: string;
  // New Livepeer/HLS support
  playbackId?: string;
  hlsUrl?: string;
  ipfsCid?: string;
  className?: string;
}

interface Layer {
  image: HTMLImageElement;
  depth: number;
  parallaxFactor: number;
  holographicShift: number;
}

export function HeroCanvas({ card, isPlaying, currentTime, onTimeUpdate, animatorVersion, playbackId, hlsUrl, ipfsCid, className }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const animationRef = useRef<number>();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [depthMap, setDepthMap] = useState<ImageData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [holographicIntensity, setHolographicIntensity] = useState(0.8);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoTexture, setVideoTexture] = useState<any>(null);

  // Holographic effect parameters
  const holographicConfig = {
    chromaticAberration: 2.5,
    interferencePattern: 0.3,
    depthSeparation: 8,
    parallaxStrength: 15,
    shimmerSpeed: 0.002,
    refractionIndex: 1.2,
    hologramOpacity: 0.85
  };

  useEffect(() => {
    if (card) {
      loadCardLayers();
    } else if (playbackId || hlsUrl || ipfsCid) {
      loadVideoSource();
    }
  }, [card, playbackId, hlsUrl, ipfsCid]);

  // Handle card with HLS background as video source
  useEffect(() => {
    if (card?.layers?.background?.includes('.m3u8')) {
      // For converted holographic videos, also load as video source
      loadVideoFromHLS(card.layers.background);
    }
  }, [card?.layers?.background]);

  // Auto-start animation when video is loaded
  useEffect(() => {
    if (isLoaded && (playbackId || hlsUrl || ipfsCid)) {
      startAnimation();
    }
  }, [isLoaded, playbackId, hlsUrl, ipfsCid]);

  useEffect(() => {
    if (isPlaying && layers.length > 0) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
      // Cleanup HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isPlaying, layers]);

  const loadVideoSource = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setIsLoaded(false);
      
      // Cleanup previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const getHlsSource = () => {
        if (playbackId) {
          console.log('🎥 Loading Livepeer HLS:', playbackId);
          return `https://lp-playback.com/hls/${playbackId}/index.m3u8`;
        }
        if (hlsUrl) {
          console.log('🎥 Loading HLS URL:', hlsUrl);
          return hlsUrl;
        }
        if (ipfsCid) {
          console.log('🎥 Loading IPFS video:', ipfsCid);
          return `https://ipfs.io/ipfs/${ipfsCid}`;
        }
        return null;
      };

      const src = getHlsSource();
      if (!src) {
        console.warn('No video source available');
        return;
      }

      console.log('🎬 Loading video source:', src);

      // For HLS streams (Livepeer)
      if (src.includes('.m3u8')) {
        // Native HLS support (Safari/iOS)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            console.log('✅ Native HLS loaded');
            setIsLoaded(true);
          });
          return;
        }

        // Use HLS.js for other browsers
        const { default: Hls } = await import('hls.js');
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('✅ HLS.js loaded');
            setIsLoaded(true);
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('❌ HLS error:', event, data);
          });
        } else {
          console.warn('HLS not supported, falling back to direct video');
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setIsLoaded(true);
          });
        }
      } else {
        // Direct video file (IPFS)
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          console.log('✅ Direct video loaded');
          setIsLoaded(true);
        });
        video.addEventListener('error', (e) => {
          console.error('❌ Video load error:', e);
        });
      }
    } catch (error) {
      console.error('Failed to load video source:', error);
    }
  };

  const loadCardLayers = async () => {
    if (!card) return;
    
    try {
      setIsLoaded(false);
      console.log('🎬 Loading holographic layers:', card.layers);
      
      // Check if background is HLS video (converted from Livepeer)
      if (card.layers.background?.includes('.m3u8')) {
        console.log('🎥 Background is HLS video, using video source instead of layers');
        // For HLS video backgrounds, use the video loading path instead
        await loadVideoFromHLS(card.layers.background);
        setIsLoaded(true);
        return;
      }
      
      const layerPromises = [];
      
      if (card.layers.background) {
        layerPromises.push(loadImage(card.layers.background));
      }
      if (card.layers.midground) {
        layerPromises.push(loadImage(card.layers.midground));
      }
      if (card.layers.foreground) {
        layerPromises.push(loadImage(card.layers.foreground));
      }

      if (layerPromises.length === 0) {
        console.warn('No valid image layers found');
        setIsLoaded(true);
        return;
      }

      const loadedImages = await Promise.all(layerPromises);
      const newLayers: Layer[] = [];
      
      let imageIndex = 0;
      if (card.layers.background && !card.layers.background.includes('.m3u8')) {
        newLayers.push({
          image: loadedImages[imageIndex++],
          depth: 0.1,
          parallaxFactor: 0.2,
          holographicShift: 0.5
        });
      }
      if (card.layers.midground) {
        newLayers.push({
          image: loadedImages[imageIndex++],
          depth: 0.5,
          parallaxFactor: 0.6,
          holographicShift: 1.0
        });
      }
      if (card.layers.foreground) {
        newLayers.push({
          image: loadedImages[imageIndex++],
          depth: 0.9,
          parallaxFactor: 1.0,
          holographicShift: 1.5
        });
      }

      setLayers(newLayers);

      // Load depth map if available
      if (card.layers.depthMapCid) {
        const depthImage = await loadImage(card.layers.depthMapCid);
        const depthData = extractDepthData(depthImage);
        setDepthMap(depthData);
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load card layers:', error);
      setIsLoaded(true); // Still mark as loaded to prevent infinite loading
    }
  };

  const loadVideoFromHLS = async (hlsUrl: string) => {
    const video = videoRef.current;
    if (!video) return;

    try {
      console.log('🎬 Loading HLS video for holographic background:', hlsUrl);
      
      // Cleanup previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Native HLS support (Safari/iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          console.log('✅ Native HLS loaded for holographic');
        });
        return;
      }

      // Use HLS.js for other browsers
      const { default: Hls } = await import('hls.js');
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS.js loaded for holographic');
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error for holographic:', event, data);
        });
      }
    } catch (error) {
      console.error('Failed to load HLS video for holographic:', error);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const extractDepthData = (depthImage: HTMLImageElement): ImageData => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = depthImage.width;
    tempCanvas.height = depthImage.height;
    tempCtx.drawImage(depthImage, 0, 0);
    return tempCtx.getImageData(0, 0, depthImage.width, depthImage.height);
  };

  const startAnimation = () => {
    const animate = (timestamp: number) => {
      render(timestamp);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const render = (timestamp: number) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;

    // Clear canvas with holographic background
    ctx.fillStyle = `rgba(0, 5, 15, ${1 - holographicConfig.hologramOpacity})`;
    ctx.fillRect(0, 0, width, height);

    // Calculate holographic effects
    const time = timestamp * holographicConfig.shimmerSpeed;
    const mouseOffsetX = (mousePosition.x - 0.5) * holographicConfig.parallaxStrength;
    const mouseOffsetY = (mousePosition.y - 0.5) * holographicConfig.parallaxStrength;

    // Render video with holographic effects if available (priority over layers)
    if (video && video.readyState >= 2) {
      renderHolographicVideo(ctx, video, {
        time,
        mouseOffsetX,
        mouseOffsetY,
        width,
        height
      });
    }
    // Render card layers if available and no video
    else if (layers.length > 0) {
      layers.forEach((layer, index) => {
        renderHolographicLayer(ctx, layer, {
          time,
          mouseOffsetX,
          mouseOffsetY,
          width,
          height,
          layerIndex: index
        });
      });
    }

    // Render ad anchors with holographic highlights
    if (card?.adAnchors) {
      renderHolographicAnchors(ctx, card.adAnchors, { width, height, time });
    }

    // Add holographic interference patterns
    renderInterferencePattern(ctx, { width, height, time });

    // Add chromatic aberration effect
    renderChromaticAberration(ctx, { width, height });
  };

  const renderHolographicVideo = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    params: {
      time: number;
      mouseOffsetX: number;
      mouseOffsetY: number;
      width: number;
      height: number;
    }
  ) => {
    const { time, mouseOffsetX, mouseOffsetY, width, height } = params;

    ctx.save();

    // Apply holographic transformations
    const holographicX = Math.sin(time) * 2;
    const holographicY = Math.cos(time * 0.7) * 1;
    const parallaxX = mouseOffsetX * 0.5;
    const parallaxY = mouseOffsetY * 0.5;

    ctx.globalAlpha = holographicConfig.hologramOpacity + Math.sin(time * 2) * 0.1;
    ctx.filter = `brightness(${0.8 + Math.sin(time * 3) * 0.2}) hue-rotate(${Math.sin(time) * 10}deg)`;

    ctx.translate(parallaxX + holographicX, parallaxY + holographicY);
    ctx.drawImage(video, 0, 0, width, height);

    ctx.restore();
  };

  const renderHolographicLayer = (
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    params: {
      time: number;
      mouseOffsetX: number;
      mouseOffsetY: number;
      width: number;
      height: number;
      layerIndex: number;
    }
  ) => {
    const { time, mouseOffsetX, mouseOffsetY, width, height, layerIndex } = params;

    // Calculate parallax offset
    const parallaxX = mouseOffsetX * layer.parallaxFactor;
    const parallaxY = mouseOffsetY * layer.parallaxFactor;

    // Calculate holographic depth separation
    const depthOffset = layer.depth * holographicConfig.depthSeparation;
    const holographicX = Math.sin(time + layerIndex) * layer.holographicShift;
    const holographicY = Math.cos(time * 0.7 + layerIndex) * layer.holographicShift * 0.5;

    // Save context for transformations
    ctx.save();

    // Apply holographic transformations
    ctx.globalAlpha = holographicConfig.hologramOpacity + Math.sin(time * 2) * 0.1;
    ctx.globalCompositeOperation = layerIndex === 0 ? 'source-over' : 'screen';

    // Calculate final position
    const finalX = parallaxX + holographicX + depthOffset;
    const finalY = parallaxY + holographicY;

    // Render layer with holographic effects
    const scale = 1 + layer.depth * 0.1;
    const layerWidth = width * scale;
    const layerHeight = height * scale;

    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + finalX, -height / 2 + finalY);

    // Add holographic shimmer
    const shimmer = Math.sin(time * 3 + layerIndex * 2) * 0.2 + 0.8;
    ctx.filter = `brightness(${shimmer}) hue-rotate(${Math.sin(time) * 10}deg)`;

    ctx.drawImage(layer.image, 0, 0, width, height);

    ctx.restore();
  };

  const renderHolographicAnchors = (
    ctx: CanvasRenderingContext2D,
    anchors: AdAnchor[],
    params: { width: number; height: number; time: number }
  ) => {
    const { width, height, time } = params;

    anchors.forEach((anchor, index) => {
      if (!anchor.enabled) return;

      const x = anchor.x * width;
      const y = anchor.y * height;
      const w = anchor.width * width;
      const h = anchor.height * height;

      // Holographic anchor glow
      const glowIntensity = Math.sin(time * 4 + index) * 0.3 + 0.7;
      const hue = (time * 50 + index * 60) % 360;

      ctx.save();
      
      // Outer glow
      ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
      ctx.shadowBlur = 20 * glowIntensity;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.6 * glowIntensity})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Inner holographic border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `hsla(${hue + 30}, 90%, 80%, ${0.8 * glowIntensity})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = time * 20;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

      // Confidence indicator
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.2)`;
      ctx.fillRect(x, y, w * anchor.confidence, h);

      ctx.restore();
    });
  };

  const renderInterferencePattern = (
    ctx: CanvasRenderingContext2D,
    params: { width: number; height: number; time: number }
  ) => {
    const { width, height, time } = params;

    ctx.save();
    ctx.globalAlpha = holographicConfig.interferencePattern;
    ctx.globalCompositeOperation = 'overlay';

    // Create interference pattern
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const phase1 = Math.sin(time * 2) * 0.5 + 0.5;
    const phase2 = Math.cos(time * 1.5) * 0.5 + 0.5;

    gradient.addColorStop(0, `hsla(180, 100%, 50%, ${phase1 * 0.1})`);
    gradient.addColorStop(0.5, `hsla(240, 100%, 50%, ${phase2 * 0.15})`);
    gradient.addColorStop(1, `hsla(300, 100%, 50%, ${phase1 * 0.1})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add scan lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      const alpha = Math.sin(y * 0.1 + time * 5) * 0.05 + 0.05;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  const renderChromaticAberration = (
    ctx: CanvasRenderingContext2D,
    params: { width: number; height: number }
  ) => {
    const { width, height } = params;
    const aberration = holographicConfig.chromaticAberration;

    // This would typically be done with shaders, but we'll simulate it
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.1;

    // Red channel shift
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(-aberration, 0, width, height);

    // Blue channel shift
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
    ctx.fillRect(aberration, 0, width, height);

    ctx.restore();
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !card?.adAnchors) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // Check if click is on an ad anchor
    const clickedAnchor = card?.adAnchors?.find(anchor =>
      x >= anchor.x && x <= anchor.x + anchor.width &&
      y >= anchor.y && y <= anchor.y + anchor.height
    );

    if (clickedAnchor) {
      console.log('Ad anchor clicked:', clickedAnchor);
      // Handle ad anchor interaction
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ''}`}>
      {/* Hidden video element for HLS/Livepeer */}
      {(playbackId || hlsUrl || ipfsCid) && (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          loop
          controls={false}
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
          onPlay={() => startAnimation()}
          onPause={() => stopAnimation()}
          onLoadedData={() => {
            setIsLoaded(true);
            // Auto-start video for holographic content
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,20,40,0.8) 0%, rgba(0,5,15,0.95) 100%)'
        }}
      />

      {/* Holographic Controls */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-xs text-gray-300 mb-1">Holographic Intensity</label>
          <input
            id="holographic-intensity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={holographicIntensity}
            onChange={(e) => setHolographicIntensity(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Source:</span>
            <span>{
              playbackId ? 'Livepeer HLS' : 
              ipfsCid ? 'IPFS Video' : 
              card?.layers?.background?.includes('.m3u8') ? 'Holographic HLS' :
              card ? 'Layer Files' : 'None'
            }</span>
          </div>
          <div className="flex justify-between">
            <span>Loaded:</span>
            <span>{isLoaded ? '✅' : '⏳'}</span>
          </div>
          <div className="flex justify-between">
            <span>Layers:</span>
            <span>{layers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Depth Map:</span>
            <span>{depthMap ? '✓' : '✗'}</span>
          </div>
          <div className="flex justify-between">
            <span>Version:</span>
            <span className="capitalize">{animatorVersion}</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
            <p className="text-cyan-400 text-sm">Loading holographic layers...</p>
          </div>
        </div>
      )}

      {/* Holographic Frame Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-lg animate-pulse"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400"></div>
      </div>
    </div>
  );
}