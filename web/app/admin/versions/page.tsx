'use client';

import React, { useState, useEffect } from 'react';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';
import HolographicVideoPlayer from '../../../components/HolographicVideoPlayer';

export default function VersionApprovalPage() {
  const [pendingVersions, setPendingVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingVersions();
  }, []);

  const loadPendingVersions = async () => {
    try {
      const versions = await enhancedDataManager.getData('content_versions');
      const pending = versions.filter(v => !v.is_official);
      
      const versionsWithAssets = await Promise.all(
        pending.map(async (version) => {
          const asset = await enhancedDataManager.getItemById('assets', version.asset_id);
          const group = await enhancedDataManager.getItemById('content_groups', version.group_id);
          return { ...version, asset, group };
        })
      );
      
      setPendingVersions(versionsWithAssets);
    } catch (error) {
      console.error('Failed to load pending versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveVersion = async (versionId: string) => {
    setProcessing(versionId);
    try {
      await enhancedDataManager.updateItem('content_versions', versionId, {
        is_official: true,
        approved_at: new Date().toISOString(),
        approved_by: 'admin'
      });
      
      const version = pendingVersions.find(v => v.id === versionId);
      if (version?.asset_id) {
        await enhancedDataManager.updateItem('assets', version.asset_id, {
          status: 'approved'
        });
      }
      
      await loadPendingVersions();
    } catch (error) {
      console.error('Failed to approve version:', error);
    } finally {
      setProcessing(null);
    }
  };

  const rejectVersion = async (versionId: string) => {
    setProcessing(versionId);
    try {
      await enhancedDataManager.updateItem('content_versions', versionId, {
        is_official: false,
        rejected_at: new Date().toISOString(),
        rejected_by: 'admin'
      });
      
      const version = pendingVersions.find(v => v.id === versionId);
      if (version?.asset_id) {
        await enhancedDataManager.updateItem('assets', version.asset_id, {
          status: 'rejected'
        });
      }
      
      await loadPendingVersions();
    } catch (error) {
      console.error('Failed to reject version:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="animate-pulse">Loading pending versions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Version Approval</h1>
          <p className="text-gray-400">
            Review and approve animator versions. All approved versions become official.
          </p>
        </div>

        {pendingVersions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">All Caught Up!</h2>
            <p className="text-gray-400">No versions pending approval</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pendingVersions.map((version) => (
              <div key={version.id} className="border border-white/20 rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">{version.group?.title}</h3>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Version {version.version_number} • {version.animator_style} Style</div>
                    <div>Animator: {version.animator_wallet.slice(0, 8)}...{version.animator_wallet.slice(-4)}</div>
                    <div>Quality Score: {(version.quality_score * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <HolographicVideoPlayer
                  fileCid={version.asset?.file_cid}
                  thumbnailCid={version.asset?.thumbnail_cid}
                  mimeType={version.asset?.mime_type}
                  title=""
                  className="w-full aspect-video mb-4"
                />

                <div className="flex space-x-3">
                  <button
                    onClick={() => approveVersion(version.id)}
                    disabled={processing === version.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    {processing === version.id ? 'Processing...' : 'Approve as Official'}
                  </button>
                  <button
                    onClick={() => rejectVersion(version.id)}
                    disabled={processing === version.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    {processing === version.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}