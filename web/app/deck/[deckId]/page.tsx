'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface DeckAsset {
  id: string;
  title: string;
  type: '3d' | 'hologram';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

const mockDeck: DeckAsset[] = [
  { id: '1', title: 'Ancient Mask', type: '3d', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 45, z: 0 }, scale: 1 },
  { id: '2', title: 'Holographic Dancer', type: 'hologram', position: { x: 2, y: 0, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: 0.8 },
  { id: '3', title: 'Energy Orb', type: 'hologram', position: { x: -2, y: 1, z: 1 }, rotation: { x: 0, y: 90, z: 0 }, scale: 0.6 }
];

export default function DeckViewer({ params }: { params: { deckId: string } }) {
  const [selectedAsset, setSelectedAsset] = useState<DeckAsset | null>(null);
  const [viewMode, setViewMode] = useState<'orbit' | 'walk' | 'fly'>('orbit');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Simulate 3D scene updates
    if (isPlaying) {
      const interval = setInterval(() => {
        // Update animations
      }, 16);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className="mighty-verse-app min-h-screen">
      <div className="mv-nav mx-4 mt-4">
        <div className="mv-nav-brand">
          <Link href="/" className="mv-heading-lg hover:text-yellow-400 transition-colors">
            ◉ Deck Viewer
          </Link>
        </div>
        <div className="mv-nav-links">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-lg transition-all ${isPlaying ? 'mv-button' : 'mv-button-secondary'}`}
          >
            {isPlaying ? '◼ Pause' : '▶ Play'}
          </button>
        </div>
      </div>

      <div className="flex h-screen pt-20">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <div className="mv-card mv-holographic h-full m-4 relative overflow-hidden">
            {/* 3D Scene Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/30 flex items-center justify-center">
              <div className="relative">
                {/* Central Holographic Display */}
                <div className="w-64 h-64 relative">
                  <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-spin"></div>
                  <div className="absolute inset-4 border border-green-400/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-yellow-400/20 to-green-400/20 rounded-full flex items-center justify-center">
                    <span className="text-6xl animate-pulse">◉</span>
                  </div>
                </div>
                
                {/* Floating Assets */}
                {mockDeck.map((asset, index) => (
                  <div
                    key={asset.id}
                    className="absolute w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300"
                    style={{
                      left: `${50 + asset.position.x * 20}%`,
                      top: `${50 + asset.position.y * 20}%`,
                      transform: `perspective(200px) rotateX(${asset.rotation.x}deg) rotateY(${asset.rotation.y}deg) scale(${asset.scale})`,
                      animation: `float ${3 + index}s ease-in-out infinite`
                    }}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <span className="text-white text-xl font-bold">
                      {asset.type === '3d' ? '◉' : '◈'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* View Controls */}
            <div className="absolute bottom-6 left-6 flex gap-2">
              {['orbit', 'walk', 'fly'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    viewMode === mode ? 'mv-button' : 'mv-button-secondary'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Scene Info */}
            <div className="absolute top-6 left-6 mv-card p-4">
              <div className="text-sm mv-text-muted">Deck: {params.deckId}</div>
              <div className="text-sm mv-text-muted">Assets: {mockDeck.length}</div>
              <div className="text-sm mv-text-muted">Mode: {viewMode}</div>
            </div>
          </div>
        </div>

        {/* Asset Panel */}
        <div className="w-80 p-4">
          <div className="mv-card p-6 h-full">
            <h3 className="mv-heading-md mb-6">◉ Scene Assets</h3>
            
            <div className="space-y-4 mb-6">
              {mockDeck.map((asset) => (
                <div
                  key={asset.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedAsset?.id === asset.id 
                      ? 'bg-white/10 border border-yellow-400/50' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/8'
                  }`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-green-400 rounded-lg flex items-center justify-center">
                      <span className="text-black text-sm font-bold">
                        {asset.type === '3d' ? '◉' : '◈'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{asset.title}</div>
                      <div className="mv-text-muted text-xs">{asset.type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedAsset && (
              <div className="border-t border-white/10 pt-6">
                <h4 className="mv-heading-md mb-4">Asset Properties</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="mv-text-muted">Position:</span>
                    <span className="text-white font-mono">
                      {selectedAsset.position.x}, {selectedAsset.position.y}, {selectedAsset.position.z}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="mv-text-muted">Rotation:</span>
                    <span className="text-white font-mono">
                      {selectedAsset.rotation.x}°, {selectedAsset.rotation.y}°, {selectedAsset.rotation.z}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="mv-text-muted">Scale:</span>
                    <span className="text-white font-mono">{selectedAsset.scale}</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <button className="mv-button w-full text-sm py-2">◆ Edit Properties</button>
                  <button className="mv-button-secondary w-full text-sm py-2">◇ Remove Asset</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}