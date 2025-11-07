'use client';

import React, { useState, useEffect, useRef } from 'react';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';

interface Placement {
  id: string;
  stream_id: string;
  asset_cid: string;
  start_time: number;
  duration: number;
  layer?: number;
  z_index?: number;
  metadata?: any;
}

interface TimelineEditorEmbeddedProps {
  streamId?: string;
  compact?: boolean;
  onPlacementChange?: (placements: Placement[]) => void;
}

export default function TimelineEditorEmbedded({ 
  streamId, 
  compact = false,
  onPlacementChange 
}: TimelineEditorEmbeddedProps) {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const pxPerSecond = compact ? 5 : 10;
  const timelineHeight = compact ? 60 : 120;
  const maxDuration = 300; // 5 minutes max

  useEffect(() => {
    if (streamId) {
      loadPlacements();
    }
  }, [streamId]);

  const loadPlacements = async () => {
    if (!streamId) return;
    
    setLoading(true);
    try {
      const data = await enhancedDataManager.getData('placements');
      const streamPlacements = data.filter((p: any) => p.stream_id === streamId);
      setPlacements(streamPlacements as Placement[]);
      onPlacementChange?.(streamPlacements as Placement[]);
    } catch (error) {
      console.error('Failed to load placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlacements = async () => {
    if (!streamId) return;
    
    setSaving(true);
    try {
      // Update each placement
      for (const placement of placements) {
        await enhancedDataManager.updateItem('placements', placement.id, {
          start_time: placement.start_time,
          duration: placement.duration,
          layer: placement.layer,
          z_index: placement.z_index
        });
      }
      
      // Trigger MCP content analysis
      await fetch('/api/agents/content-curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: streamId,
          contentType: 'stream',
          action: 'analyze_timeline'
        })
      });
      
    } catch (error) {
      console.error('Failed to save placements:', error);
    } finally {
      setSaving(false);
    }
  };

  const addPlacement = async () => {
    if (!streamId) return;
    
    try {
      const newPlacement = await enhancedDataManager.createItem('placements', {
        stream_id: streamId,
        asset_cid: `QmDemo${Date.now()}`,
        start_time: 0,
        duration: 10,
        layer: 0,
        z_index: 10,
        metadata: { created_via: 'timeline_editor' }
      });
      
      setPlacements(prev => [...prev, newPlacement as Placement]);
    } catch (error) {
      console.error('Failed to add placement:', error);
    }
  };

  const deletePlacement = async (placementId: string) => {
    try {
      await enhancedDataManager.deleteItem('placements', placementId);
      setPlacements(prev => prev.filter(p => p.id !== placementId));
      setSelectedPlacement(null);
    } catch (error) {
      console.error('Failed to delete placement:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, placement: Placement) => {
    e.dataTransfer.setData('text/plain', placement.id);
    setSelectedPlacement(placement);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const placementId = e.dataTransfer.getData('text/plain');
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const newStartTime = Math.max(0, Math.round(x / pxPerSecond));
    
    setPlacements(prev => prev.map(p => 
      p.id === placementId 
        ? { ...p, start_time: newStartTime }
        : p
    ));
  };

  const handlePlacementClick = (placement: Placement) => {
    setSelectedPlacement(selectedPlacement?.id === placement.id ? null : placement);
  };

  const updateSelectedPlacement = (updates: Partial<Placement>) => {
    if (!selectedPlacement) return;
    
    setPlacements(prev => prev.map(p => 
      p.id === selectedPlacement.id 
        ? { ...p, ...updates }
        : p
    ));
    
    setSelectedPlacement(prev => prev ? { ...prev, ...updates } : null);
  };

  const getPlacementColor = (layer: number = 0) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-yellow-500',
      'bg-red-500'
    ];
    return colors[layer % colors.length];
  };

  if (!streamId && !compact) {
    return (
      <div className="mv-card p-6 text-center">
        <div className="text-4xl mb-2">🎬</div>
        <p className="mv-text-muted">Select a stream to edit timeline</p>
      </div>
    );
  }

  return (
    <div className={`mv-card ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${compact ? 'text-lg' : 'mv-heading-md'} flex items-center space-x-2`}>
          <span>🎬</span>
          <span>{compact ? 'Timeline' : 'Timeline Editor'}</span>
        </h3>
        
        <div className="flex space-x-2">
          {!compact && (
            <button
              onClick={addPlacement}
              className="mv-button-sm"
              disabled={!streamId}
            >
              + Add
            </button>
          )}
          <button
            onClick={savePlacements}
            disabled={saving || !streamId}
            className="mv-button-sm"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <div
          ref={timelineRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative bg-black/20 rounded-xl overflow-hidden"
          style={{ height: timelineHeight }}
        >
          {/* Time markers */}
          <div className="absolute inset-0">
            {Array.from({ length: Math.ceil(maxDuration / 30) }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-white/10"
                style={{ left: `${(i * 30) * pxPerSecond}px` }}
              >
                <div className="absolute -top-1 text-xs mv-text-muted">
                  {i * 30}s
                </div>
              </div>
            ))}
          </div>

          {/* Placements */}
          <div 
            className="absolute inset-0"
            style={{ width: `${maxDuration * pxPerSecond}px` }}
          >
            {placements.map((placement) => (
              <div
                key={placement.id}
                draggable
                onDragStart={(e) => handleDragStart(e, placement)}
                onClick={() => handlePlacementClick(placement)}
                className={`absolute cursor-grab active:cursor-grabbing rounded transition-all hover:scale-105 ${
                  getPlacementColor(placement.layer)
                } ${
                  selectedPlacement?.id === placement.id 
                    ? 'ring-2 ring-white/50 scale-105' 
                    : ''
                }`}
                style={{
                  left: `${placement.start_time * pxPerSecond}px`,
                  top: `${20 + (placement.layer || 0) * (compact ? 15 : 25)}px`,
                  width: `${Math.max(20, placement.duration * pxPerSecond)}px`,
                  height: compact ? 20 : 40,
                  zIndex: placement.z_index || 10
                }}
              >
                <div className="p-1 h-full flex flex-col justify-center text-white text-xs">
                  {!compact && (
                    <div className="truncate font-semibold">
                      {placement.asset_cid.substring(0, 8)}...
                    </div>
                  )}
                  <div className="text-xs opacity-75">
                    {placement.start_time}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline controls */}
        <div className="flex justify-between items-center mt-2 text-xs mv-text-muted">
          <span>0s</span>
          <span>{placements.length} placements</span>
          <span>{maxDuration}s</span>
        </div>
      </div>

      {/* Placement Editor */}
      {selectedPlacement && !compact && (
        <div className="bg-white/5 rounded-xl p-4 mv-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Edit Placement</h4>
            <button
              onClick={() => deletePlacement(selectedPlacement.id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block mv-text-muted mb-1">Start Time (s)</label>
              <input
                type="number"
                value={selectedPlacement.start_time}
                onChange={(e) => updateSelectedPlacement({ start_time: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                min="0"
                max={maxDuration}
              />
            </div>
            
            <div>
              <label className="block mv-text-muted mb-1">Duration (s)</label>
              <input
                type="number"
                value={selectedPlacement.duration}
                onChange={(e) => updateSelectedPlacement({ duration: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <label className="block mv-text-muted mb-1">Layer</label>
              <select
                value={selectedPlacement.layer || 0}
                onChange={(e) => updateSelectedPlacement({ layer: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
              >
                {[0, 1, 2, 3, 4].map(layer => (
                  <option key={layer} value={layer} className="bg-gray-800">
                    Layer {layer}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mv-text-muted mb-1">Z-Index</label>
              <input
                type="number"
                value={selectedPlacement.z_index || 10}
                onChange={(e) => updateSelectedPlacement({ z_index: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                min="1"
                max="100"
              />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin text-2xl">🎬</div>
        </div>
      )}
    </div>
  );
}