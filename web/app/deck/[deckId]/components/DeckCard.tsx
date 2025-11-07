'use client';

/**
 * DeckCard - Individual Holographic Card Component
 * Interactive card with holographic effects and animations
 */

import React, { useRef, useEffect, useState } from 'react';

interface CardData {
  id: string;
  title: string;
  startFrame: number;
  endFrame: number;
  duration: number;
  animatorVersion: string;
  manifestCid: string;
  layers: {
    background: string;
    midground: string;
    foreground: string;
    depthMapCid?: string;
  };
  adAnchors?: AdAnchor[];
  metadata: {
    confidence: number;
    qcScore: number;
    tags: string[];
  };
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

interface DeckCardProps {
  card: CardData;
  isActive: boolean;
  onClick: () => void;
  index: number;
  holographicEffect?: boolean;
}

export function DeckCard({ card, isActive, onClick, index, holographicEffect = true }: DeckCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (holographicEffect && canvasRef.current) {
      initializeHolographicPreview();
    }
  }, [card, holographicEffect]);

  const initializeHolographicPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Load the foreground layer for preview
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = 300;
        canvas.height = 200;
        renderHolographicPreview(ctx, img);
        setIsLoaded(true);
      };
      img.onerror = () => {
        // Fallback to placeholder
        renderPlaceholder(ctx);
        setIsLoaded(true);
      };
      img.src = card.layers.foreground;
    } catch (error) {
      console.error('Failed to load card preview:', error);
      renderPlaceholder(ctx);
      setIsLoaded(true);
    }
  };

  const renderHolographicPreview = (ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
    const { width, height } = ctx.canvas;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 10, 20, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // Calculate holographic effects
    const time = Date.now() * 0.001;
    const hoverIntensity = isHovered ? 1 : 0.3;
    
    // Base image with holographic tint
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.filter = `hue-rotate(${Math.sin(time) * 30}deg) brightness(${1 + Math.sin(time * 2) * 0.2})`;
    ctx.drawImage(image, 0, 0, width, height);
    ctx.restore();

    // Holographic overlay
    if (card.layers.depthMapCid) {
      renderHolographicOverlay(ctx, { width, height, time, hoverIntensity });
    }

    // Quality indicator
    renderQualityIndicator(ctx, card.metadata.qcScore, { width, height });

    // Ad anchors preview
    if (card.adAnchors && card.adAnchors.length > 0) {
      renderAdAnchorsPreview(ctx, card.adAnchors, { width, height, time });
    }
  };

  const renderHolographicOverlay = (
    ctx: CanvasRenderingContext2D,
    params: { width: number; height: number; time: number; hoverIntensity: number }
  ) => {
    const { width, height, time, hoverIntensity } = params;

    // Holographic shimmer
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const phase = Math.sin(time * 2) * 0.5 + 0.5;
    
    gradient.addColorStop(0, `hsla(180, 100%, 70%, ${0.1 * hoverIntensity})`);
    gradient.addColorStop(phase, `hsla(240, 100%, 80%, ${0.2 * hoverIntensity})`);
    gradient.addColorStop(1, `hsla(300, 100%, 70%, ${0.1 * hoverIntensity})`);

    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(0, 0, width, height);

    // Scan lines
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 * hoverIntensity})`;
    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = 'overlay';
    
    for (let y = 0; y < height; y += 3) {
      const alpha = Math.sin(y * 0.1 + time * 5) * 0.1 + 0.1;
      ctx.globalAlpha = alpha * hoverIntensity;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  const renderQualityIndicator = (
    ctx: CanvasRenderingContext2D,
    qcScore: number,
    params: { width: number; height: number }
  ) => {
    const { width, height } = params;
    
    // Quality bar
    const barWidth = 40;
    const barHeight = 4;
    const x = width - barWidth - 8;
    const y = height - barHeight - 8;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Quality fill
    const qualityWidth = barWidth * qcScore;
    const hue = qcScore * 120; // Red to green
    ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.fillRect(x, y, qualityWidth, barHeight);

    // Quality text
    ctx.fillStyle = 'white';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(qcScore * 100)}%`, width - 8, y - 2);
  };

  const renderAdAnchorsPreview = (
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

      const pulse = Math.sin(time * 4 + index) * 0.3 + 0.7;
      const hue = (time * 50 + index * 60) % 360;

      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.6 * pulse})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      // Anchor dot
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.8 * pulse})`;
      ctx.beginPath();
      ctx.arc(x + w/2, y + h/2, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const renderPlaceholder = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1f2937');
    gradient.addColorStop(1, '#111827');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Placeholder icon
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎬', width / 2, height / 2 + 8);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });

    // Apply 3D tilt effect
    const tiltX = (y - 0.5) * 10;
    const tiltY = (x - 0.5) * -10;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.05 : 1})`;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  // Animation loop for holographic effects
  useEffect(() => {
    if (!holographicEffect || !isLoaded) return;

    const animate = () => {
      if (canvasRef.current && isHovered) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Re-render with updated time for animations
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => renderHolographicPreview(ctx, img);
          img.src = card.layers.foreground;
        }
      }
    };

    const interval = setInterval(animate, 100);
    return () => clearInterval(interval);
  }, [isHovered, isLoaded, card.layers.foreground, holographicEffect]);

  return (
    <div
      ref={cardRef}
      className={`relative group cursor-pointer transition-all duration-300 ${
        isActive ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Card Container */}
      <div className={`bg-gray-900 rounded-lg overflow-hidden shadow-lg ${
        isActive ? 'shadow-blue-400/20 shadow-2xl' : 'shadow-black/50'
      } ${isHovered ? 'shadow-cyan-400/30 shadow-xl' : ''}`}>
        
        {/* Canvas Preview */}
        <div className="relative aspect-[3/2] overflow-hidden">
          {holographicEffect ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={card.layers.foreground}
              alt={card.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-card.jpg';
              }}
            />
          )}

          {/* Loading Overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
            </div>
          )}

          {/* Holographic Badge */}
          {card.layers.depthMapCid && (
            <div className="absolute top-2 right-2 bg-cyan-400/20 backdrop-blur-sm rounded px-2 py-1">
              <span className="text-cyan-400 text-xs font-medium">🔮 Holographic</span>
            </div>
          )}

          {/* Active Indicator */}
          {isActive && (
            <div className="absolute top-2 left-2 bg-blue-600 rounded-full p-1">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center justify-between text-white text-xs">
                <span>{Math.floor(card.duration)}s</span>
                {card.adAnchors && card.adAnchors.length > 0 && (
                  <span>📍 {card.adAnchors.length}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Info */}
        <div className="p-4">
          <h3 className="font-medium text-white mb-2 line-clamp-2">{card.title}</h3>
          
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <span>Frame {card.startFrame}-{card.endFrame}</span>
            <span>QC: {Math.round(card.metadata.qcScore * 100)}%</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {card.metadata.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {card.metadata.tags.length > 3 && (
              <span className="text-gray-500 text-xs">
                +{card.metadata.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Features */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              {card.layers.depthMapCid && (
                <span className="text-cyan-400">Depth</span>
              )}
              {card.adAnchors && card.adAnchors.length > 0 && (
                <span className="text-green-400">Ads</span>
              )}
            </div>
            <span className="text-gray-500 capitalize">{card.animatorVersion}</span>
          </div>
        </div>

        {/* Holographic Border Effect */}
        {holographicEffect && isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border border-cyan-400/50 rounded-lg animate-pulse"></div>
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-400"></div>
          </div>
        )}
      </div>
    </div>
  );
}