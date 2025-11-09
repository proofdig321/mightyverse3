'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';
import NavigationHeader from '../../../components/shared/navigation-header';
import Pagination from '../../../components/shared/pagination';
import MediaRenderer from '../../../components/media/media-renderer';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  type?: string;
  asset_type?: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  fileCid?: string;
  file_cid?: string;
  thumbnailCid?: string;
  thumbnail_cid?: string;
  fileName?: string;
  file_name?: string;
  mimeType?: string;
  mime_type?: string;
  metadata?: {
    duration?: number;
    renditions?: Array<{
      cid: string;
      width?: number;
      height?: number;
      bitrate?: number;
      label?: string;
    }>;
    isrc?: string;
  };
  creator?: string;
  uploadedAt?: string;
  curated?: boolean;
}

export default function AdminAnimationsPage() {
  const { isAdmin } = useRBAC();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [recovering, setRecovering] = useState(false);

  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredAssets = assets.filter(asset => {
    const isAnimation = asset.asset_type === 'video' || asset.type === 'animation' || asset.type === 'video' || asset.mimeType?.startsWith('video/');
    if (!isAnimation) return false;
    if (statusFilter === 'all') return true;
    return asset.status === statusFilter || (statusFilter === 'approved' && asset.status === 'published');
  });
  const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    // Force hard cache clear and reload
    enhancedDataManager.clearAllCaches();
    setTimeout(() => {
      loadAssets();
    }, 100);
  }, []);

  const loadAssets = async () => {
    try {
      console.log('Loading assets...');
      const data = await enhancedDataManager.getData('assets');
      console.log('Assets loaded:', data.length, 'items');
      
      // Log CID information for debugging
      data.forEach((asset, index) => {
        if (asset.file_cid || asset.fileCid) {
          console.log(`Asset ${index}:`, {
            id: asset.id,
            name: asset.name,
            file_cid: asset.file_cid,
            fileCid: asset.fileCid,
            mime_type: asset.mime_type,
            mimeType: asset.mimeType
          });
        }
      });
      
      setAssets(data as Asset[]);
      setSelectedAsset(null);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await enhancedDataManager.updateItem('assets', id, { status: newStatus });
      await loadAssets();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleCuratedToggle = async (id: string, currentCurated: boolean) => {
    try {
      await enhancedDataManager.updateItem('assets', id, { curated: !currentCurated });
      await loadAssets();
    } catch (error) {
      console.error('Failed to toggle curated status:', error);
    }
  };

  const handleDataRecovery = async () => {
    setRecovering(true);
    try {
      const response = await fetch('/api/system/recover', { method: 'POST' });
      const result = await response.json();
      console.log('Recovery result:', result);
      
      // Force reload after recovery
      enhancedDataManager.clearAllCaches();
      await loadAssets();
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      setRecovering(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mv-card p-8 text-center">
          <h1 className="mv-heading-lg text-red-400 mb-4">Access Denied</h1>
          <p className="mv-text-muted">Admin privileges required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-6xl">◈</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <NavigationHeader 
        title="🎬 Animation Assets"
        subtitle="Review and manage animation submissions"
        backLink="/admin"
      />

      {/* Filters */}
      <div className="mv-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="mv-heading-md">Animations ({filteredAssets.length})</h2>
          <div className="flex space-x-4">
            <select
              id="status-filter"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={handleDataRecovery}
              disabled={recovering}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg text-white text-sm"
            >
              {recovering ? '🔄 Recovering...' : '🔧 Fix Data'}
            </button>
            <button
              onClick={async () => {
                if (confirm('⚠️ OPTION B: COMPLETE RESET\n\nThis will DELETE ALL ASSETS from database.\n\nBefore clicking OK:\n1. Delete all files from Pinata dashboard\n2. Delete all assets from Livepeer dashboard\n3. Then click OK for database cleanup\n\nProceed with complete reset?')) {
                  try {
                    const response = await fetch('/api/admin/cleanup', { method: 'POST' });
                    const result = await response.json();
                    console.log('Complete reset result:', result);
                    alert(`Complete Reset: ${result.message}\nDeleted: ${result.deleted} assets`);
                    await loadAssets();
                  } catch (error) {
                    console.error('Complete reset failed:', error);
                    alert('Complete reset failed. Check console for details.');
                  }
                }
              }}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-bold"
            >
              ⚠️ RESET ALL
            </button>
          </div>
        </div>
      </div>

      {/* Selected Asset Preview */}
      {selectedAsset && (
        <div className="mv-card p-6 mb-8">
          <div className="mb-4">
            <h3 className="mv-heading-lg mb-2">{selectedAsset.name}</h3>
            <div className="flex flex-wrap gap-4 text-sm mv-text-muted">
              <span>Type: {selectedAsset.type}</span>
              {selectedAsset.metadata?.duration && (
                <span>Duration: {Math.floor(selectedAsset.metadata.duration / 60)}:{(selectedAsset.metadata.duration % 60).toString().padStart(2, '0')}</span>
              )}
              {selectedAsset.creator && <span>Creator: {selectedAsset.creator.slice(0, 8)}...</span>}
              {selectedAsset.metadata?.isrc && <span>ISRC: {selectedAsset.metadata.isrc}</span>}
            </div>
          </div>

          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <MediaRenderer
              fileCid={selectedAsset.fileCid || selectedAsset.file_cid}
              thumbnailCid={selectedAsset.thumbnailCid || selectedAsset.thumbnail_cid}
              mimeType={selectedAsset.mimeType || selectedAsset.mime_type}
              fileName={selectedAsset.fileName || selectedAsset.file_name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex justify-end mt-4 space-x-4">
            <Link 
              href={`/admin/assets/${selectedAsset.id}`}
              className="mv-button-secondary"
            >
              View Details
            </Link>
          </div>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedAssets.map((asset) => (
          <div 
            key={asset.id}
            className={`mv-card cursor-pointer group transition-all duration-300 ${
              selectedAsset?.id === asset.id ? 'ring-2 ring-yellow-400 scale-105' : 'hover:scale-102'
            }`}
            onClick={() => setSelectedAsset(asset)}
          >
            {/* Thumbnail */}
            <div className="aspect-video mb-4 bg-black rounded-lg overflow-hidden">
              {(asset.fileCid || asset.file_cid) ? (
                <MediaRenderer
                  fileCid={asset.fileCid || asset.file_cid}
                  thumbnailCid={asset.thumbnailCid || asset.thumbnail_cid}
                  mimeType={asset.mimeType || asset.mime_type}
                  fileName={asset.fileName || asset.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎬</div>
                    <div className="text-sm mv-text-muted">No video available</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="mv-heading-sm truncate flex-1">{asset.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  asset.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                  asset.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                  'bg-yellow-400/20 text-yellow-400'
                }`}>
                  {asset.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs mv-text-muted mb-2">
                {asset.metadata?.duration && (
                  <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded">
                    {Math.floor(asset.metadata.duration / 60)}:{(asset.metadata.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {asset.curated && (
                  <span className="px-2 py-1 bg-purple-400/20 text-purple-400 rounded">
                    Curated
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCuratedToggle(asset.id, !!asset.curated);
                  }}
                  className={`px-3 py-1 rounded text-xs ${
                    asset.curated 
                      ? 'bg-purple-400/20 text-purple-400 hover:bg-purple-400/30'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {asset.curated ? 'Remove from Murals' : 'Add to Murals'}
                </button>

                <div className="flex space-x-2">
                  {asset.status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(asset.id, 'approved');
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(asset.id, 'rejected');
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredAssets.length}
      />
    </div>
  );
}