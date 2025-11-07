'use client';

/**
 * Admin Dashboard - Main Overview Page
 * Central hub for content management and platform administration
 * Enhanced with integrated demo functionality
 */

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../auth/rbac-provider';
import Link from 'next/link';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';
import ContentCurationPanel from '../../components/admin/content-curation-panel';
import CampaignManagementWidget from '../../components/admin/campaign-management-widget';
import MuralAssemblyWidget from '../../components/admin/mural-assembly-widget';
import TimelineEditorEmbedded from '../../components/admin/timeline-editor-embedded';
import DemoNavigationPanel from '../../components/admin/demo-navigation-panel';

interface DashboardStat {
  name: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  href: string;
}



const quickActions = [
  { name: 'Demo Integration', href: '/admin/demo-integration', icon: '🎯', description: 'Comprehensive demo functionality hub' },
  { name: 'Upload Media', href: '/admin/upload', icon: '⬆️', description: 'Upload audio, video, and visual assets' },
  { name: 'View Assets', href: '/admin/assets', icon: '📋', description: 'Review and manage all assets' },
  { name: 'Manage Animations', href: '/admin/animations', icon: '🎬', description: 'Review and curate animation submissions' },
  { name: 'View Murals', href: '/murals', icon: '◉', description: 'Interactive card deck experiences' },
  { name: 'Manage Roles', href: '/admin/rbac', icon: '👥', description: 'Assign and manage user roles' },
  { name: 'Campaign Setup', href: '/admin/campaigns', icon: '📢', description: 'Create new advertising campaigns' },
  { name: 'Mint Approval', href: '/admin/mint-queue', icon: '🎯', description: 'Approve pending mint requests' },
];

export default function AdminDashboard() {
  const { isAdmin, loading, wallet } = useRBAC();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Set up real-time subscriptions
    const unsubscribeAssets = enhancedDataManager.subscribe('assets', loadStats);
    const unsubscribeCampaigns = enhancedDataManager.subscribe('campaigns', loadStats);
    
    return () => {
      unsubscribeAssets();
      unsubscribeCampaigns();
    };
  }, []);

  const loadStats = async () => {
    try {
      const [assets, campaigns, users, jobs] = await Promise.all([
        enhancedDataManager.getData('assets'),
        enhancedDataManager.getData('campaigns'), 
        enhancedDataManager.getData('users'),
        enhancedDataManager.getData('processing_jobs')
      ]);

      const pendingAssets = assets.filter(a => a.status === 'submitted').length;
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const processingAssets = assets.filter(a => a.livepeer_status === 'processing').length;
      const readyAssets = assets.filter(a => a.livepeer_status === 'ready').length;

      setStats([
        { name: 'Pending Assets', value: pendingAssets.toString(), change: '', changeType: 'increase', href: '/admin/assets' },
        { name: 'Processing', value: processingAssets.toString(), change: '', changeType: 'decrease', href: '/admin/assets' },
        { name: 'Ready to Stream', value: readyAssets.toString(), change: '', changeType: 'increase', href: '/admin/assets' },
        { name: 'Active Campaigns', value: activeCampaigns.toString(), change: '', changeType: 'increase', href: '/admin/campaigns' },
      ]);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats([
        { name: 'Pending Assets', value: '0', change: '', changeType: 'increase', href: '/admin/assets' },
        { name: 'Processing', value: '0', change: '', changeType: 'decrease', href: '/admin/assets' },
        { name: 'Ready to Stream', value: '0', change: '', changeType: 'increase', href: '/admin/assets' },
        { name: 'Active Campaigns', value: '0', change: '', changeType: 'increase', href: '/admin/campaigns' },
      ]);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">⬟ Admin Dashboard ⬟</h1>
        <p className="mv-text-muted text-lg mb-4">The Mighty Verse Platform Administration</p>
        <div className="mv-text-muted text-sm">
          Admin: <code className="bg-white/10 px-2 py-1 rounded text-yellow-400">{wallet?.slice(0, 8)}...</code>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <div className="mv-card mv-holographic p-6 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-green-400 rounded-xl flex items-center justify-center">
                    <span className="text-black text-lg font-bold">{stat.value.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="mv-text-muted text-sm mb-1">{stat.name}</div>
                    <div className="flex items-baseline space-x-2">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      {stat.change && (
                        <div className={`text-sm font-semibold ${
                          stat.changeType === 'increase' ? 'mv-text-energy' : 'text-red-400'
                        }`}>
                          {stat.change}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mv-heading-md mb-6">Quick Actions</h2>
        <div className="mv-grid-responsive">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <div className="mv-card p-6 cursor-pointer group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{action.icon}</div>
                  <h3 className="mv-heading-md mb-2">{action.name}</h3>
                  <p className="mv-text-muted text-sm">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      {/* Livepeer Processing Status */}
      <div className="mv-card p-4 sm:p-6 mb-8">
        <h3 className="mv-heading-md mb-4">🎬 Livepeer Processing Center</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-900/20 border border-blue-400/20 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.find(s => s.name === 'Processing')?.value || '0'}</div>
              <div className="text-sm mv-text-muted">Transcoding</div>
            </div>
            <div className="bg-green-900/20 border border-green-400/20 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.find(s => s.name === 'Ready to Stream')?.value || '0'}</div>
              <div className="text-sm mv-text-muted">Ready for HLS</div>
            </div>
            <div className="bg-purple-900/20 border border-purple-400/20 rounded p-4 text-center">
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/livepeer/sync', { method: 'POST' });
                    const result = await response.json();
                    alert(result.success ? result.message : 'Sync failed: ' + result.error);
                    loadStats(); // Refresh stats
                  } catch (error) {
                    alert('Sync failed: ' + error);
                  }
                }}
                className="mv-button w-full"
              >
                🔄 Sync Dashboard
              </button>
              <div className="text-xs mv-text-muted mt-2">Check & export assets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Features - Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <div className="mv-card p-4">
          <h3 className="mv-heading-sm mb-3 flex items-center space-x-2">
            <span>◇</span>
            <span>Campaign Management</span>
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/5 rounded p-2">
                <div className="text-lg font-bold">{stats.find(s => s.name === 'Active Campaigns')?.value || '0'}</div>
                <div className="text-xs mv-text-muted">Active</div>
              </div>
              <div className="bg-white/5 rounded p-2">
                <div className="text-lg font-bold">0</div>
                <div className="text-xs mv-text-muted">Streams</div>
              </div>
              <div className="bg-white/5 rounded p-2">
                <div className="text-lg font-bold">0</div>
                <div className="text-xs mv-text-muted">Revenue</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href="/campaigns/demo" className="mv-button-secondary flex-1 text-center text-sm py-2">
                Create
              </Link>
              <Link href="/campaigns/dashboard" className="mv-button-secondary flex-1 text-center text-sm py-2">
                Manage
              </Link>
            </div>
          </div>
        </div>

        <div className="mv-card p-4">
          <h3 className="mv-heading-sm mb-3 flex items-center space-x-2">
            <span>◈</span>
            <span>Mural Assembly</span>
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/5 rounded p-2">
                <div className="text-lg font-bold">1</div>
                <div className="text-xs mv-text-muted">Murals</div>
              </div>
              <div className="bg-white/5 rounded p-2">
                <div className="text-lg font-bold">3</div>
                <div className="text-xs mv-text-muted">Versions</div>
              </div>
              <div className="bg-white/5 rounded p-2">
                <div className="text-lg font-bold">120s</div>
                <div className="text-xs mv-text-muted">Duration</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href="/murals" className="mv-button-secondary flex-1 text-center text-sm py-2">
                View
              </Link>
              <button className="mv-button-secondary flex-1 text-sm py-2">
                Create
              </button>
            </div>
          </div>
        </div>

        <div className="mv-card p-4">
          <h3 className="mv-heading-sm mb-3 flex items-center space-x-2">
            <span>🎯</span>
            <span>Demo Features</span>
          </h3>
          <div className="space-y-2">
            <Link href="/admin/demo-integration" className="block p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
              <div className="text-sm font-medium">Integration Hub</div>
              <div className="text-xs mv-text-muted">All demo features</div>
            </Link>
            <Link href="/campaigns/demo" className="block p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
              <div className="text-sm font-medium">Campaign Demo</div>
              <div className="text-xs mv-text-muted">Original workflow</div>
            </Link>
            <Link href="/deck/demo" className="block p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
              <div className="text-sm font-medium">3D Deck Viewer</div>
              <div className="text-xs mv-text-muted">Asset positioning</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline Editor - Full Width */}
      <div className="mb-8">
        <TimelineEditorEmbedded compact={true} />
      </div>

      {/* Content Curation Panel */}
      <div className="mb-8">
        <ContentCurationPanel />
      </div>

      {/* Recent Activity */}
      <div className="mv-card p-4 sm:p-6">
          <h3 className="mv-heading-md mb-6">Recent Activity</h3>
        <div className="space-y-4 sm:space-y-6">
            {[
              { action: 'Asset submitted', user: '0x1234...5678', time: '2 hours ago', type: 'asset' },
              { action: 'Role assigned', user: '0x9876...5432', time: '4 hours ago', type: 'role' },
              { action: 'Campaign created', user: '0xabcd...efgh', time: '6 hours ago', type: 'campaign' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-green-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-black text-sm">
                    {item.type === 'asset' ? '📄' : item.type === 'role' ? '👤' : '📢'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm sm:text-base">
                    {item.action} by <code className="mv-text-accent bg-white/10 px-2 py-1 rounded text-xs sm:text-sm">{item.user}</code>
                  </p>
                </div>
                <div className="mv-text-muted text-sm">
                  {item.time}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}