'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../auth/rbac-provider';
import Link from 'next/link';
import { dataManager } from '../../utils/storage/data-store';
import NavigationHeader from '../../components/shared/navigation-header';
import Pagination from '../../components/shared/pagination';
import MediaRenderer from '../../components/media/media-renderer';

interface Asset {
  id: string;
  name: string;
  type: 'animation' | '3d-model' | 'audio' | 'texture';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'minted';
  createdAt: string;
  fileSize: string;
  thumbnail?: string;
}

export default function AnimatorDashboard() {
  const { isAnimator, isAdmin, wallet } = useRBAC();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = assets.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await dataManager.getItemsByField('assets', 'creator', wallet);
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'animation' as Asset['type'],
    file: null as File | null
  });

  const handleUpload = async () => {
    if (!newAsset.name || !newAsset.file) return;
    
    try {
      await dataManager.addItem('assets', {
        name: newAsset.name,
        type: newAsset.type,
        status: 'draft',
        creator: wallet,
        fileSize: `${(newAsset.file.size / 1024 / 1024).toFixed(1)} MB`
      });
      await loadAssets();
      setNewAsset({ name: '', type: 'animation', file: null });
      setShowUploadForm(false);
    } catch (error) {
      console.error('Failed to upload asset:', error);
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await dataManager.updateItem('assets', id, { status: 'submitted' });
      await loadAssets();
    } catch (error) {
      console.error('Failed to submit asset:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dataManager.deleteItem('assets', id);
      await loadAssets();
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  if (!isAnimator && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mv-card p-8 text-center">
          <h1 className="mv-heading-lg text-red-400 mb-4">Access Denied</h1>
          <p className="mv-text-muted">Animator privileges required</p>
          <Link href="/auth/connect" className="mv-button mt-4 inline-block">
            Connect Wallet
          </Link>
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

  const stats = {
    total: assets.length,
    draft: assets.filter(a => a.status === 'draft').length,
    submitted: assets.filter(a => a.status === 'submitted').length,
    approved: assets.filter(a => a.status === 'approved').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <NavigationHeader 
        title="◯ Animator Dashboard ◯"
        subtitle="Create and manage your holographic assets"
        actions={
          <div className="text-sm mv-text-muted">
            Wallet: <code className="bg-white/10 px-2 py-1 rounded text-yellow-400">{wallet?.slice(0, 8)}...</code>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
          <div className="mv-text-muted text-sm">Total Assets</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-1">{stats.draft}</div>
          <div className="mv-text-muted text-sm">Drafts</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.submitted}</div>
          <div className="mv-text-muted text-sm">Submitted</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.approved}</div>
          <div className="mv-text-muted text-sm">Approved</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mv-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="mv-heading-md">Quick Actions</h2>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="mv-button"
          >
            {showUploadForm ? 'Cancel Upload' : '+ Upload Asset'}
          </button>
        </div>

        {showUploadForm && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Asset Name</label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter asset name"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Asset Type</label>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, type: e.target.value as Asset['type'] }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="animation">Animation</option>
                  <option value="3d-model">3D Model</option>
                  <option value="audio">Audio</option>
                  <option value="texture">Texture</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">File Upload</label>
              <input
                type="file"
                onChange={(e) => setNewAsset(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                accept=".mp4,.mov,.fbx,.obj,.mp3,.wav,.jpg,.png"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-400 file:text-black"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!newAsset.name || !newAsset.file}
              className="mv-button"
            >
              Upload Asset
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Link href="/animator/upload" className="mv-card p-4 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-2">📤</div>
            <h3 className="font-semibold text-white mb-1">Upload Assets</h3>
            <p className="text-sm mv-text-muted">Upload new animations and models</p>
          </Link>
          <Link href="/animator/submissions" className="mv-card p-4 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-white mb-1">Submissions</h3>
            <p className="text-sm mv-text-muted">Track submission status</p>
          </Link>
          <div className="mv-card p-4 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-semibold text-white mb-1">Templates</h3>
            <p className="text-sm mv-text-muted">Browse asset templates</p>
          </div>
          <div className="mv-card p-4 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-white mb-1">Earnings</h3>
            <p className="text-sm mv-text-muted">View your earnings</p>
          </div>
        </div>
      </div>

      {/* Asset Library */}
      <div className="mv-card p-6">
        <h2 className="mv-heading-md mb-6">Your Assets ({assets.length})</h2>
        
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="mv-heading-md mb-2">No Assets Yet</h3>
            <p className="mv-text-muted mb-6">Start creating by uploading your first asset</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="mv-button"
            >
              Upload First Asset
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedAssets.map((asset) => (
              <div key={asset.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-green-400/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">
                        {asset.type === 'animation' ? '🎬' : 
                         asset.type === '3d-model' ? '🎯' :
                         asset.type === 'audio' ? '🎵' : '🖼️'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{asset.name}</h3>
                      <div className="flex flex-wrap gap-4 text-sm mv-text-muted">
                        <span>Type: {asset.type}</span>
                        <span>Size: {asset.fileSize}</span>
                        <span>Created: {asset.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      asset.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                      asset.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                      asset.status === 'submitted' ? 'bg-yellow-400/20 text-yellow-400' :
                      asset.status === 'minted' ? 'bg-blue-400/20 text-blue-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {asset.status}
                    </span>
                    
                    <div className="flex space-x-2">
                      {asset.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSubmit(asset.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                          >
                            Submit
                          </button>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm">
                            Edit
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
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