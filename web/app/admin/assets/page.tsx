'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { dataManager } from '../../../utils/storage/data-store';
import MediaRenderer from '../../../components/media/media-renderer';
import NavigationHeader from '../../../components/shared/navigation-header';
import Pagination from '../../../components/shared/pagination';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  fileCid?: string;
  thumbnailCid?: string;
  fileName?: string;
  mimeType?: string;
  metadata?: {
    isrc?: string;
    duration?: number;
    format?: string;
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
      const data = await dataManager.getData('assets');
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await dataManager.updateItem('assets', id, { status: 'approved' });
      await loadAssets();
    } catch (error) {
      console.error('Failed to approve asset:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await dataManager.updateItem('assets', id, { status: 'rejected' });
      await loadAssets();
    } catch (error) {
      console.error('Failed to reject asset:', error);
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
        title="📋 Asset Review"
        subtitle="Review and approve pending asset submissions"
        backLink="/admin"
        actions={
          <Link href="/admin/upload" className="mv-button">
            + Upload Asset
          </Link>
        }
      />

      <div className="mv-card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="mv-heading-md">Pending Assets ({assets.filter(a => a.status === 'pending').length})</h2>
          <div className="flex space-x-2">
            <button className="mv-button-sm">Filter</button>
            <button className="mv-button-sm">Sort</button>
          </div>
        </div>

        <div className="space-y-4">
          {assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="mv-heading-md mb-2">No Assets Submitted Yet</h3>
              <p className="mv-text-muted">This is a new platform - assets will appear here when submitted</p>
            </div>
          ) : (
            paginatedAssets.map((asset) => (
              <div key={asset.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Media Preview */}
                  <div className="lg:col-span-1">
                    <MediaRenderer
                      fileCid={asset.fileCid}
                      thumbnailCid={asset.thumbnailCid}
                      mimeType={asset.mimeType}
                      fileName={asset.fileName}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Asset Details */}
                  <div className="lg:col-span-2">
                    <h3 className="font-semibold text-white mb-2">{asset.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm mv-text-muted mb-2">
                      <span>Type: {asset.type}</span>
                      <span>Format: {asset.metadata?.format || 'Unknown'}</span>
                      <span>By: {asset.submittedBy?.slice(0, 8)}...</span>
                      <span>Date: {new Date(asset.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {asset.metadata?.isrc && (
                      <div className="text-xs mv-text-muted">
                        ISRC: <code className="bg-white/10 px-1 rounded">{asset.metadata.isrc}</code>
                      </div>
                    )}
                    {asset.metadata?.duration && (
                      <div className="text-xs mv-text-muted">
                        Duration: {Math.floor(asset.metadata.duration / 60)}:{(asset.metadata.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="lg:col-span-1 flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      asset.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                      asset.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                      'bg-yellow-400/20 text-yellow-400'
                    }`}>
                      {asset.status}
                    </span>
                    {asset.status === 'pending' && (
                      <div className="flex flex-col space-y-2 w-full">
                        <button
                          onClick={() => handleApprove(asset.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm w-full"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(asset.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm w-full"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={assets.length}
        />
      </div>
    </div>
  );
}