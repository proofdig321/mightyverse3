'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';
import AssetPreviewEnhanced from '../../../components/admin/asset-preview-enhanced';
import ContextualBreadcrumb from '../../../components/admin/contextual-breadcrumb';
import NavigationHeader from '../../../components/shared/navigation-header';
import Pagination from '../../../components/shared/pagination';
import HealthMonitor from '../../../components/system/health-monitor';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'processing' | 'submitted' | 'pending' | 'approved' | 'rejected' | 'published' | 'archived';
  submittedBy: string;
  submittedAt: string;
  created_at?: string;
  fileCid?: string;
  thumbnailCid?: string;
  fileName?: string;
  mimeType?: string;
  is_curated?: boolean;
  metadata?: {
    isrc?: string;
    duration?: number;
    format?: string;
    upload_method?: string;
    description?: string;
  };
}

export default function AssetsPage() {
  const { isAdmin } = useRBAC();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = assets.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await enhancedDataManager.getData('assets');
      setAssets(data as Asset[]);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (assetId: string, newStatus: string) => {
    try {
      if (newStatus === 'deleted') {
        // Remove from local state immediately for better UX
        setAssets(prev => prev.filter(asset => asset.id !== assetId));
      } else {
        await enhancedDataManager.updateItem('assets', assetId, { status: newStatus });
        await loadAssets();
      }
    } catch (error) {
      console.error('Failed to update asset status:', error);
      // Reload on error to ensure consistency
      await loadAssets();
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
      <ContextualBreadcrumb />
      <NavigationHeader 
        title="📋 Asset Review"
        subtitle="Review and approve pending asset submissions"
        backLink="/admin"
        actions={
          <Link href="/admin/upload" className="mv-button">
            + Upload Asset
          </Link>
        }
      />

      <HealthMonitor />
      
      <div className="mv-card p-6">
        {/* Asset Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="mv-card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{assets.filter(a => a.status === 'submitted').length}</div>
            <div className="text-sm mv-text-muted">Pending Review</div>
          </div>
          <div className="mv-card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{assets.filter(a => a.status === 'approved').length}</div>
            <div className="text-sm mv-text-muted">Approved</div>
          </div>
          <div className="mv-card p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{assets.filter(a => a.status === 'published').length}</div>
            <div className="text-sm mv-text-muted">Published</div>
          </div>
          <div className="mv-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{assets.filter(a => (a as any).is_curated).length}</div>
            <div className="text-sm mv-text-muted">Curated</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="mv-heading-md">All Assets ({assets.length})</h2>
          <div className="flex space-x-2">
            <select 
              className="mv-button-sm bg-white/10 border border-white/20"
              onChange={(e) => {
                const status = e.target.value;
                if (status === 'all') {
                  loadAssets();
                } else {
                  setAssets(prev => prev.filter(a => a.status === status));
                }
              }}
            >
              <option value="all">All Status</option>
              <option value="submitted">Pending</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
            <button 
              className="mv-button-sm"
              onClick={() => setAssets(prev => [...prev].sort((a, b) => new Date(b.submittedAt || b.created_at || '').getTime() - new Date(a.submittedAt || a.created_at || '').getTime()))}
            >
              Sort by Date
            </button>
          </div>
        </div>

        {/* Enhanced Asset Grid */}
        <div className="space-y-6">
          {assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="mv-heading-md mb-2">No Assets Submitted Yet</h3>
              <p className="mv-text-muted">This is a new platform - assets will appear here when submitted</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedAssets.map((asset) => (
                <AssetPreviewEnhanced
                  key={asset.id}
                  asset={{
                    id: asset.id,
                    name: asset.name,
                    asset_type: asset.type,
                    file_cid: asset.fileCid,
                    thumbnail_cid: asset.thumbnailCid,
                    status: asset.status,
                    quality_score: (asset.metadata as any)?.quality_score,
                    creator_wallet: asset.submittedBy || '0x0000000000000000000000000000000000000000',
                    created_at: asset.submittedAt,
                    metadata: asset.metadata
                  }}
                  onStatusChange={handleStatusChange}
                  showActions={true}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>
        
        {assets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={assets.length}
          />
        )}
      </div>
    </div>
  );
}