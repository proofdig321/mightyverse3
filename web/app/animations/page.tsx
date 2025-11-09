'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MediaRenderer from '../../components/media/media-renderer';
import Breadcrumb from '../../components/Breadcrumb';
import { HeroCanvas } from '../deck/[deckId]/components/HeroCanvas';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';
import Pagination from '../../components/shared/pagination';

interface Asset {
  id: string;
  name: string;
  type?: string;
  asset_type?: string;
  status: string;
  fileCid?: string;
  file_cid?: string;
  thumbnailCid?: string;
  thumbnail_cid?: string;
  fileName?: string;
  file_name?: string;
  mimeType?: string;
  mime_type?: string;
  livepeer_asset_id?: string;
  livepeer_playback_id?: string;
  livepeer_status?: string;
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
    upload_method?: string;
    layers?: {
      background?: string;
      midground?: string;
      foreground?: string;
      depthMapCid?: string;
    };
    holographicType?: string;
  };
  creator?: string;
  uploadedAt?: string;
  curated?: boolean;
}

export default function Animations() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  
  // Get approved/published animations/videos/holographic (no curation gate like murals/campaigns)
  const filteredAssets = assets.filter(asset => {
    const isAnimation = asset.asset_type === 'video' || asset.asset_type === 'holographic' || asset.type === 'animation' || asset.type === 'video' || asset.mimeType?.startsWith('video/');
    const isApproved = asset.status === 'approved' || asset.status === 'published';
    return isAnimation && isApproved;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    loadAssets();
  }, []);
  const loadAssets = async () => {
    try {
      const data = await enhancedDataManager.getData('assets');
      // store raw assets locally
      setAssets(data as Asset[] || []);

      // pick a featured approved animation to show by default (prioritize holographic)
      const firstApproved = (data as Asset[] || []).find((asset: Asset) => {
        const isAnimation = asset.asset_type === 'video' || asset.asset_type === 'holographic' || asset.type === 'animation' || asset.type === 'video' || asset.mimeType?.startsWith('video/');
        return isAnimation && (asset.status === 'approved' || asset.status === 'published');
      }) || (data as Asset[] || []).find((asset: Asset) => asset.asset_type === 'holographic');

      if (firstApproved) setSelectedAsset(firstApproved);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-6xl">◈</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: 'Animations', icon: '◈' }
      ]} />
        <div className="text-center mb-16 mv-fade-in">
          <h1 className="mv-heading-xl mb-6">◈ Animations ◈</h1>
          <p className="mv-text-muted text-xl mb-8">
            Gallery of 2.5D holographic cinematic pieces
          </p>
        </div>

        {/* Main Video Player */}
        {selectedAsset && (
          <div className="mb-12">
            <div className="mv-card mv-holographic p-6">
              <div className="mb-4">
                <h2 className="mv-heading-lg mb-2">{selectedAsset.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm mv-text-muted mb-4">
                  <span className={`px-2 py-1 rounded ${
                    selectedAsset.asset_type === 'holographic' ? 'bg-purple-500/20 text-purple-400' :
                    selectedAsset.asset_type === 'video' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedAsset.asset_type === 'holographic' ? '2.5D Holographic' : 
                     selectedAsset.asset_type || selectedAsset.type}
                  </span>
                  {selectedAsset.metadata?.duration && (
                    <span>Duration: {Math.floor(selectedAsset.metadata.duration / 60)}:{(selectedAsset.metadata.duration % 60).toString().padStart(2, '0')}</span>
                  )}
                  {selectedAsset.creator && <span>Creator: {selectedAsset.creator.slice(0, 8)}...</span>}
                  {selectedAsset.metadata?.isrc && <span>ISRC: {selectedAsset.metadata.isrc}</span>}
                  {selectedAsset.livepeer_playback_id && <span className="text-green-400">Livepeer: {selectedAsset.livepeer_playback_id.slice(0, 8)}...</span>}
                  {selectedAsset.asset_type === 'holographic' && selectedAsset.metadata?.layers && (
                    <span className="text-purple-400">Layers: {Object.keys(selectedAsset.metadata.layers).length}</span>
                  )}
                </div>
              </div>
              
              {/* Enhanced Holographic Video Player */}
              <div className="w-full aspect-video max-w-4xl mx-auto">
                <HeroCanvas
                  playbackId={selectedAsset.livepeer_playback_id}
                  ipfsCid={selectedAsset.fileCid || selectedAsset.file_cid}
                  card={(selectedAsset.asset_type === 'holographic' && selectedAsset.metadata?.layers) ? {
                    id: selectedAsset.id,
                    title: selectedAsset.name,
                    layers: {
                      background: selectedAsset.metadata.layers.background || '',
                      midground: selectedAsset.metadata.layers.midground || '',
                      foreground: selectedAsset.metadata.layers.foreground || '',
                      depthMapCid: selectedAsset.metadata.layers.depthMapCid
                    }
                  } : undefined}
                  isPlaying={true}
                  currentTime={0}
                  onTimeUpdate={() => {}}
                  animatorVersion="enhanced"
                  className="w-full h-full rounded-xl overflow-hidden"
                />
              </div>
            </div>
          </div>
        )}

  {/* Animation Gallery */}
  {filteredAssets.length === 0 ? (
          <div className="mv-card p-12 text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="mv-heading-md mb-2">No Animations Yet</h3>
            <p className="mv-text-muted mb-6">The gallery is empty. Animations will appear here once uploaded by creators.</p>
            <Link href="/" className="mv-button">
              Explore Platform
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mv-heading-lg mb-6">Animated Murals ({filteredAssets.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedAssets.map((asset) => (
                <div 
                  key={asset.id}
                  className={`mv-card cursor-pointer group transition-all duration-300 ${
                    selectedAsset?.id === asset.id ? 'ring-2 ring-yellow-400 scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => handleSelect(asset)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video mb-4">
                    <MediaRenderer
                      fileCid={asset.fileCid || asset.file_cid}
                      thumbnailCid={asset.thumbnailCid || asset.thumbnail_cid}
                      mimeType={asset.mimeType || asset.mime_type}
                      fileName={asset.fileName || asset.file_name}
                      livepeerPlaybackId={asset.livepeer_playback_id}
                      livepeerAssetId={asset.livepeer_asset_id}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="mv-heading-sm mb-2 truncate">{asset.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs mv-text-muted mb-2">
                      <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded">{asset.type}</span>
                      {asset.metadata?.duration && (
                        <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded">
                          {Math.floor(asset.metadata.duration / 60)}:{(asset.metadata.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    {asset.creator && (
                      <p className="text-xs mv-text-muted truncate">by {asset.creator.slice(0, 8)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAssets.length}
            />
          </>
        )}

        {/* Info Section */}
        <div className="mv-card mv-holographic p-8 text-center mt-12">
          <div className="text-6xl mb-4 animate-pulse">◈</div>
          <h2 className="mv-heading-lg mb-4">Holographic Animation Gallery</h2>
          <p className="mv-text-muted text-lg">
            Real IPFS-stored animations with full video playback and metadata
          </p>
        </div>
    </div>
  );
}