'use client';

import React, { useState, useEffect } from 'react';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';
import MediaRenderer from '../media/media-renderer';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  file_cid?: string;
  thumbnail_cid?: string;
  status: string;
  quality_score?: number;
  creator_wallet: string;
  created_at: string;
  metadata?: any;
}

interface AssetPreviewEnhancedProps {
  asset: Asset;
  onStatusChange?: (assetId: string, newStatus: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function AssetPreviewEnhanced({ 
  asset, 
  onStatusChange, 
  showActions = true,
  compact = false 
}: AssetPreviewEnhancedProps) {
  const [previewMode, setPreviewMode] = useState<'2d' | '3d' | 'holographic'>('2d');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/agents/content-curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: asset.id,
          contentType: 'asset',
          action: 'analyze'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAnalysisResult(result.analysis);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await enhancedDataManager.updateItem('assets', asset.id, { status: newStatus });
      onStatusChange?.(asset.id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      // Refresh the parent component
      onStatusChange?.(asset.id, 'deleted');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('Failed to delete asset. Please try again.');
    }
  };

  const handleToggleCurated = async () => {
    try {
      const newCuratedStatus = !(asset as any).is_curated;
      // Use both is_curated and curated for compatibility
      await enhancedDataManager.updateItem('assets', asset.id, { 
        is_curated: newCuratedStatus,
        curated: newCuratedStatus 
      });
      onStatusChange?.(asset.id, asset.status); // Trigger refresh
    } catch (error) {
      console.error('Failed to toggle curated status:', error);
      // Show user-friendly error
      alert('Curation update failed. The system is syncing - please try again in a moment.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'mv-status-pending',
      processing: 'text-blue-400 bg-blue-400/10 border border-blue-400/30',
      submitted: 'mv-status-pending',
      approved: 'mv-status-success',
      rejected: 'mv-status-error',
      published: 'text-purple-400 bg-purple-400/10 border border-purple-400/30'
    };
    return colors[status as keyof typeof colors] || 'mv-status-pending';
  };

  const renderPreview = () => {
    switch (previewMode) {
      case '3d':
        return (
          <div className="aspect-square bg-gradient-to-br from-black/60 to-black/30 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="relative">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border border-green-400/20 rounded-full animate-ping"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-yellow-400/20 to-green-400/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl animate-pulse">◉</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
              3D Preview
            </div>
          </div>
        );
      
      case 'holographic':
        return (
          <div className="aspect-square mv-holographic rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="relative z-10">
              {(asset as any).livepeer_thumbnail_url ? (
                <img
                  src={(asset as any).livepeer_thumbnail_url}
                  alt={asset.name}
                  className="w-full h-full object-cover rounded-lg opacity-80"
                />
              ) : (
                <MediaRenderer
                  fileCid={asset.file_cid}
                  thumbnailCid={asset.thumbnail_cid}
                  mimeType={asset.metadata?.mime_type}
                  fileName={asset.name}
                  className="w-full h-full object-cover rounded-lg opacity-80"
                />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-green-400/10"></div>
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-yellow-400">
              Holographic
            </div>
          </div>
        );
      
      default:
        return (
          <div className="aspect-square bg-white/5 rounded-xl overflow-hidden">
            {/* HLS Video Player for Livepeer assets */}
            {(asset as any).livepeer_playback_url && asset.asset_type === 'video' ? (
              <video
                controls
                className="w-full h-full object-cover"
                src={(asset as any).livepeer_playback_url}
                poster={
                  (asset as any).livepeer_thumbnail_url || 
                  (asset.thumbnail_cid ? `https://gateway.pinata.cloud/ipfs/${asset.thumbnail_cid}` : undefined)
                }
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <MediaRenderer
                fileCid={asset.file_cid}
                thumbnailCid={asset.thumbnail_cid}
                mimeType={asset.metadata?.mime_type}
                fileName={asset.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        );
    }
  };

  if (compact) {
    return (
      <div className="mv-card p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
            <MediaRenderer
              fileCid={asset.file_cid}
              thumbnailCid={asset.thumbnail_cid}
              mimeType={asset.metadata?.mime_type}
              fileName={asset.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{asset.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
              {asset.quality_score && (
                <span className="text-xs mv-text-muted">
                  {Math.round(asset.quality_score * 100)}% quality
                </span>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex space-x-1">
              <Link href={`/deck/${asset.id}`} className="mv-button-secondary mv-button-sm">
                3D
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mv-card mv-holographic p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="mv-heading-sm mb-1">{asset.name}</h3>
          <div className="flex items-center space-x-3 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(asset.status)}`}>
              {asset.status}
            </span>
            <span className="mv-text-muted">{asset.asset_type}</span>
            {(asset as any).livepeer_status && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                (asset as any).livepeer_status === 'ready' ? 'text-green-400 bg-green-400/10' :
                (asset as any).livepeer_status === 'processing' ? 'text-blue-400 bg-blue-400/10' :
                'text-yellow-400 bg-yellow-400/10'
              }`}>
                🎬 {(asset as any).livepeer_status}
              </span>
            )}
            {(asset as any).export_status && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                (asset as any).export_status === 'completed' ? 'text-purple-400 bg-purple-400/10' :
                (asset as any).export_status === 'pending' ? 'text-orange-400 bg-orange-400/10' :
                'text-red-400 bg-red-400/10'
              }`}>
                📦 {(asset as any).export_status}
              </span>
            )}
            {(asset as any).metadata?.upload_method === 'livepeer_direct' && (
              <span className="px-2 py-1 rounded-full text-xs text-cyan-400 bg-cyan-400/10">
                🏷️ embedded
              </span>
            )}
            <button
              onClick={handleToggleCurated}
              className={`px-2 py-1 rounded-full text-xs ${
                (asset as any).is_curated 
                  ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30' 
                  : 'text-gray-400 bg-gray-400/10 border border-gray-400/30'
              }`}
              title="Toggle curation status"
            >
              {(asset as any).is_curated ? '⭐ Curated' : '☆ Curate'}
            </button>
            {asset.quality_score && (
              <span className="mv-text-energy">
                {Math.round(asset.quality_score * 100)}% quality
              </span>
            )}
          </div>
        </div>
        
        {/* Preview Mode Toggle */}
        <div className="flex space-x-1">
          {['2d', '3d', 'holographic'].map((mode) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode as any)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                previewMode === mode 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/5 mv-text-muted hover:bg-white/10'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mb-4">
        {renderPreview()}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="mv-text-muted">Creator:</span>
          <div className="font-mono text-xs">{asset.creator_wallet.slice(0, 12)}...</div>
        </div>
        <div>
          <span className="mv-text-muted">Created:</span>
          <div>{new Date(asset.created_at).toLocaleDateString()}</div>
        </div>
        {(asset as any).livepeer_playback_id && (
          <div>
            <span className="mv-text-muted">Playback ID:</span>
            <div className="font-mono text-xs">{(asset as any).livepeer_playback_id}</div>
          </div>
        )}
        {(asset as any).livepeer_playback_url && (
          <div>
            <span className="mv-text-muted">Stream:</span>
            <div className="text-xs text-green-400">HLS Ready</div>
          </div>
        )}
        {asset.file_cid && (
          <div className="col-span-2">
            <span className="mv-text-muted">IPFS CID:</span>
            <div className="font-mono text-xs break-all">{asset.file_cid}</div>
          </div>
        )}
        {(asset as any).metadata?.upload_method && (
          <div className="col-span-2">
            <span className="mv-text-muted">Upload Method:</span>
            <div className="text-xs capitalize">{(asset as any).metadata.upload_method.replace('_', ' ')}</div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-white/5 rounded-xl p-4 mb-4 mv-fade-in">
          <h4 className="font-semibold mb-2">AI Analysis</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="mv-text-muted">Confidence:</span>
              <span className="mv-text-energy">{Math.round(analysisResult.confidence * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="mv-text-muted">Quality Score:</span>
              <span className="mv-text-energy">{Math.round(analysisResult.quality * 100)}%</span>
            </div>
            {analysisResult.tags && (
              <div>
                <span className="mv-text-muted">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="bg-white/10 px-2 py-1 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="mv-button-secondary flex-1"
          >
            {isAnalyzing ? 'Analyzing...' : '🔍 Analyze'}
          </button>
          
          <Link href={`/deck/${asset.id}`} className="mv-button-secondary">
            ◉ 3D View
          </Link>
          
          {asset.status === 'submitted' && (
            <>
              <button
                onClick={() => handleStatusChange('approved')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                ✗ Reject
              </button>
            </>
          )}
          
          {asset.status === 'approved' && (
            <button
              onClick={() => handleStatusChange('published')}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              🚀 Publish
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-600/80 text-white rounded-lg text-sm hover:bg-red-700 border border-red-500/30"
            title="Delete asset permanently"
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}