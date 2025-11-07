'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Asset3D {
  id: string;
  title: string;
  type: '3d' | 'hologram';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  modelUrl?: string;
}

interface DeckViewer3DProps {
  assets: Asset3D[];
  viewMode: 'orbit' | 'walk' | 'fly';
  onAssetSelect?: (asset: Asset3D) => void;
  className?: string;
}

export default function DeckViewer3D({ 
  assets, 
  viewMode, 
  onAssetSelect,
  className = '' 
}: DeckViewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset3D | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize WebGL context
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Basic WebGL setup
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Animation loop
    let animationId: number;
    const animate = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      // Render assets (simplified for now)
      renderAssets(gl, assets);
      
      animationId = requestAnimationFrame(animate);
    };

    animate();
    setIsLoading(false);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [assets, viewMode]);

  const renderAssets = (gl: WebGLRenderingContext, assets: Asset3D[]) => {
    // Simplified rendering - in production, use Three.js or similar
    assets.forEach((asset, index) => {
      // Render asset placeholder
      const x = (asset.position.x / 10) * gl.canvas.width;
      const y = (asset.position.y / 10) * gl.canvas.height;
      
      // This would be replaced with actual 3D model rendering
      gl.scissor(x - 20, y - 20, 40, 40);
      gl.enable(gl.SCISSOR_TEST);
      gl.clearColor(
        asset.type === '3d' ? 0.2 : 0.8,
        asset.type === '3d' ? 0.6 : 0.4,
        asset.type === '3d' ? 0.8 : 0.2,
        1.0
      );
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Simple hit detection - in production, use proper 3D picking
    const clickedAsset = assets.find(asset => {
      const assetX = (asset.position.x / 10) * canvas.width;
      const assetY = (asset.position.y / 10) * canvas.height;
      
      return Math.abs(x - assetX) < 20 && Math.abs(y - assetY) < 20;
    });

    if (clickedAsset) {
      setSelectedAsset(clickedAsset);
      onAssetSelect?.(clickedAsset);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
        style={{ background: 'linear-gradient(45deg, #0a0a0a, #1a1a2e)' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-xl animate-spin">◈</div>
        </div>
      )}

      {/* Asset overlay info */}
      {selectedAsset && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg">
          <h3 className="font-bold mb-2">{selectedAsset.title}</h3>
          <div className="text-sm space-y-1">
            <div>Type: {selectedAsset.type}</div>
            <div>Position: {selectedAsset.position.x}, {selectedAsset.position.y}, {selectedAsset.position.z}</div>
            <div>Scale: {selectedAsset.scale}</div>
          </div>
        </div>
      )}

      {/* View mode indicator */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        View: {viewMode}
      </div>

      {/* Asset count */}
      <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        Assets: {assets.length}
      </div>
    </div>
  );
}