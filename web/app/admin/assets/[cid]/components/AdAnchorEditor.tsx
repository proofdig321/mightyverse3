'use client';

/**
 * Ad Anchor Editor Component
 * 3D visualization for placing advertising anchors on assets
 */

import React, { useState, useRef, useCallback } from 'react';

interface AdAnchor {
  id: string;
  x: number;
  y: number;
  z: number;
  confidence: number;
  reason: string;
  active?: boolean;
}

interface AdAnchorEditorProps {
  assetId: string;
  suggestedAnchors: AdAnchor[];
  previewUrl: string;
}

export default function AdAnchorEditor({ assetId, suggestedAnchors, previewUrl }: AdAnchorEditorProps) {
  const [anchors, setAnchors] = useState<AdAnchor[]>(suggestedAnchors);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlacing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const newAnchor: AdAnchor = {
      id: `anchor_${Date.now()}`,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      z: 0.1,
      confidence: 1.0,
      reason: 'Manually placed',
      active: true
    };

    setAnchors(prev => [...prev, newAnchor]);
    setIsPlacing(false);
  }, [isPlacing]);

  const handleAnchorSelect = (anchorId: string) => {
    setSelectedAnchor(selectedAnchor === anchorId ? null : anchorId);
  };

  const handleAnchorDelete = (anchorId: string) => {
    setAnchors(prev => prev.filter(anchor => anchor.id !== anchorId));
    setSelectedAnchor(null);
  };

  const handleAnchorToggle = (anchorId: string) => {
    setAnchors(prev => prev.map(anchor =>
      anchor.id === anchorId ? { ...anchor, active: !anchor.active } : anchor
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call to save anchors
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would save to IPFS and update the asset manifest
      console.log('Saving anchors:', anchors);
      
      alert('Ad anchors saved successfully!');
    } catch (error) {
      console.error('Failed to save anchors:', error);
      alert('Failed to save anchors. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const drawAnchors = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Draw anchors
    anchors.forEach(anchor => {
      const x = anchor.x * canvas.width;
      const y = anchor.y * canvas.height;
      
      // Anchor circle
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI);
      ctx.fillStyle = anchor.active ? 
        (selectedAnchor === anchor.id ? '#3B82F6' : '#10B981') : 
        '#6B7280';
      ctx.fill();
      
      // Border
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Confidence indicator
      if (anchor.confidence < 0.8) {
        ctx.beginPath();
        ctx.arc(x + 8, y - 8, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
      }
    });
  }, [anchors, selectedAnchor]);

  React.useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete) {
      drawAnchors();
    }
  }, [drawAnchors]);

  const activeAnchors = anchors.filter(a => a.active);
  const selectedAnchorData = anchors.find(a => a.id === selectedAnchor);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Ad Anchor Editor</h2>
        <p className="text-sm text-gray-600">
          Place and manage advertising anchor points on the asset. Click "Place Anchor" then click on the image to add new anchors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="relative">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Asset preview"
                className="hidden"
                onLoad={drawAnchors}
              />
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className={`w-full h-auto border border-gray-300 rounded ${
                  isPlacing ? 'cursor-crosshair' : 'cursor-default'
                }`}
                onClick={handleCanvasClick}
              />
              
              {isPlacing && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
                  Click to place anchor
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsPlacing(!isPlacing)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    isPlacing
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isPlacing ? 'Cancel Placement' : 'Place Anchor'}
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Anchors'}
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                {activeAnchors.length} active anchor{activeAnchors.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Anchor List */}
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Anchor Points</h3>
            
            {anchors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm">No anchors placed yet</p>
                <p className="text-xs">Click "Place Anchor" to add one</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {anchors.map((anchor, index) => (
                  <div
                    key={anchor.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnchor === anchor.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnchorSelect(anchor.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          anchor.active ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm font-medium">
                          Anchor {index + 1}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnchorToggle(anchor.id);
                          }}
                          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          {anchor.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnchorDelete(anchor.id);
                          }}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <div>Position: ({Math.round(anchor.x * 100)}%, {Math.round(anchor.y * 100)}%)</div>
                      <div>Confidence: {Math.round(anchor.confidence * 100)}%</div>
                      <div className="truncate">Reason: {anchor.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Anchor Details */}
          {selectedAnchorData && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Anchor Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="block text-gray-500">X Position</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedAnchorData.x}
                    onChange={(e) => {
                      const newX = parseFloat(e.target.value);
                      setAnchors(prev => prev.map(anchor =>
                        anchor.id === selectedAnchor ? { ...anchor, x: newX } : anchor
                      ));
                    }}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{Math.round(selectedAnchorData.x * 100)}%</span>
                </div>
                
                <div>
                  <label className="block text-gray-500">Y Position</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedAnchorData.y}
                    onChange={(e) => {
                      const newY = parseFloat(e.target.value);
                      setAnchors(prev => prev.map(anchor =>
                        anchor.id === selectedAnchor ? { ...anchor, y: newY } : anchor
                      ));
                    }}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{Math.round(selectedAnchorData.y * 100)}%</span>
                </div>
                
                <div>
                  <label className="block text-gray-500">Z Depth</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedAnchorData.z}
                    onChange={(e) => {
                      const newZ = parseFloat(e.target.value);
                      setAnchors(prev => prev.map(anchor =>
                        anchor.id === selectedAnchor ? { ...anchor, z: newZ } : anchor
                      ));
                    }}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{Math.round(selectedAnchorData.z * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}