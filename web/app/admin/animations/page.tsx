'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { dataManager } from '../../../utils/storage/data-store';
import NavigationHeader from '../../../components/shared/navigation-header';
import Pagination from '../../../components/shared/pagination';
import MediaRenderer from '../../../components/media/media-renderer';
import HolographicVideoPlayer from '../../../components/HolographicVideoPlayer';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  fileCid?: string;
  thumbnailCid?: string;
  fileName?: string;
  mimeType?: string;
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

  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredAssets = assets.filter(asset => {
    const isAnimation = asset.type === 'animation' || asset.type === 'video' || asset.mimeType?.startsWith('video/');
    if (!isAnimation) return false;
    if (statusFilter === 'all') return true;
    return asset.status === statusFilter;
  });
  const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await dataManager.getData('assets');
      setAssets(data);
      if (data.length > 0) {
        setSelectedAsset(data[0]);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await dataManager.updateItem('assets', id, { status: newStatus });
      await loadAssets();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleCuratedToggle = async (id: string, currentCurated: boolean) => {
    try {
      await dataManager.updateItem('assets', id, { curated: !currentCurated });
      await loadAssets();
    } catch (error) {
      console.error('Failed to toggle curated status:', error);
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
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

          <HolographicVideoPlayer
            fileCid={selectedAsset.fileCid}
            thumbnailCid={selectedAsset.thumbnailCid}
            mimeType={selectedAsset.mimeType}
            fileName={selectedAsset.fileName}
            renditions={selectedAsset.metadata?.renditions}
            title={selectedAsset.name}
            className="w-full h-96"
          />

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
            <div className="aspect-video mb-4">
              <MediaRenderer
                fileCid={asset.fileCid}
                thumbnailCid={asset.thumbnailCid}
                mimeType={asset.mimeType}
                fileName={asset.fileName}
                className="w-full h-full object-cover rounded-lg"
              />
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