'use client';

import React, { useState, useEffect } from 'react';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';
import CampaignManagementWidget from './campaign-management-widget';
import MuralAssemblyWidget from './mural-assembly-widget';
import TimelineEditorEmbedded from './timeline-editor-embedded';
import AssetPreviewEnhanced from './asset-preview-enhanced';
import Link from 'next/link';

interface IntegratedDemoHubProps {
  mode?: 'full' | 'compact' | 'dashboard';
}

export default function IntegratedDemoHub({ mode = 'dashboard' }: IntegratedDemoHubProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'assets' | 'murals' | 'timeline'>('campaigns');
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentAssets();
  }, []);

  const loadRecentAssets = async () => {
    try {
      const assets = await enhancedDataManager.getData('assets');
      setRecentAssets(assets.slice(0, 3));
    } catch (error) {
      console.error('Failed to load recent assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetStatusChange = (assetId: string, newStatus: string) => {
    setRecentAssets(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, status: newStatus } : asset
    ));
  };

  if (mode === 'compact') {
    return (
      <div className="mv-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="mv-heading-sm">🎯 Demo Hub</h3>
          <Link href="/admin" className="mv-button-secondary mv-button-sm">
            Full Dashboard
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Link href="/campaigns/demo" className="mv-card p-3 text-center hover:scale-105 transition-transform">
            <div className="text-2xl mb-1">◇</div>
            <div>Campaign Demo</div>
          </Link>
          <Link href="/murals" className="mv-card p-3 text-center hover:scale-105 transition-transform">
            <div className="text-2xl mb-1">◈</div>
            <div>Murals</div>
          </Link>
          <Link href="/campaigns/dashboard" className="mv-card p-3 text-center hover:scale-105 transition-transform">
            <div className="text-2xl mb-1">🎬</div>
            <div>Timeline</div>
          </Link>
          <Link href="/deck/demo" className="mv-card p-3 text-center hover:scale-105 transition-transform">
            <div className="text-2xl mb-1">◉</div>
            <div>3D Viewer</div>
          </Link>
        </div>
      </div>
    );
  }

  if (mode === 'full') {
    return (
      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="mv-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="mv-heading-lg">🎯 Integrated Demo Hub</h2>
            <div className="flex space-x-2">
              <Link href="/campaigns/demo" className="mv-button-secondary">
                Original Demo
              </Link>
              <Link href="/campaigns/dashboard" className="mv-button-secondary">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex space-x-4 mb-6">
            {[
              { key: 'campaigns', label: 'Campaigns', icon: '◇' },
              { key: 'assets', label: 'Assets', icon: '📋' },
              { key: 'murals', label: 'Murals', icon: '◈' },
              { key: 'timeline', label: 'Timeline', icon: '🎬' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  activeTab === tab.key 
                    ? 'mv-button' 
                    : 'mv-button-secondary'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'campaigns' && <CampaignManagementWidget />}
            {activeTab === 'murals' && <MuralAssemblyWidget />}
            {activeTab === 'timeline' && (
              <TimelineEditorEmbedded 
                streamId={selectedStream || undefined}
                compact={false}
              />
            )}
            {activeTab === 'assets' && (
              <div className="space-y-4">
                <h3 className="mv-heading-md">Recent Assets</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin text-4xl">📋</div>
                  </div>
                ) : recentAssets.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {recentAssets.map((asset) => (
                      <AssetPreviewEnhanced
                        key={asset.id}
                        asset={asset}
                        onStatusChange={handleAssetStatusChange}
                        compact={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="mv-text-muted">No assets yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard mode (default)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <CampaignManagementWidget />
      <MuralAssemblyWidget />
    </div>
  );
}