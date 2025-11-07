'use client';

/**
 * Admin Dashboard - Main Overview Page
 * Central hub for content management and platform administration
 */

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../auth/rbac-provider';
import Link from 'next/link';
import { dataManager } from '../../utils/storage/data-store';

interface DashboardStat {
  name: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  href: string;
}



const quickActions = [
  { name: 'Upload Media', href: '/admin/upload', icon: '⬆️', description: 'Upload audio, video, and visual assets' },
  { name: 'View Assets', href: '/admin/assets', icon: '📋', description: 'Review and manage all assets' },
  { name: 'Manage Animations', href: '/admin/animations', icon: '🎬', description: 'Review and curate animation submissions' },
  { name: 'View Murals', href: '/murals', icon: '◉', description: 'Interactive card deck experiences' },
  { name: 'Manage Roles', href: '/admin/rbac', icon: '👥', description: 'Assign and manage user roles' },
  { name: 'Campaign Setup', href: '/admin/campaigns', icon: '📢', description: 'Create new advertising campaigns' },
  { name: 'Mint Approval', href: '/admin/mint-queue', icon: '🎯', description: 'Approve pending mint requests' },
  { name: 'Sponsor Management', href: '/admin/sponsors', icon: '💼', description: 'Manage platform sponsors and partnerships' },
];

export default function AdminDashboard() {
  const { isAdmin, loading, wallet } = useRBAC();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [assets, campaigns, users] = await Promise.all([
        dataManager.getData('assets'),
        dataManager.getData('campaigns'), 
        dataManager.getData('users')
      ]);

      const pendingAssets = assets.filter(a => a.status === 'pending').length;
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const mintQueue = assets.filter(a => a.status === 'approved' && !a.minted).length;

      setStats([
        { name: 'Pending Assets', value: pendingAssets.toString(), change: '', changeType: 'increase', href: '/admin/assets' },
        { name: 'Active Campaigns', value: activeCampaigns.toString(), change: '', changeType: 'increase', href: '/admin/campaigns' },
        { name: 'Mint Queue', value: mintQueue.toString(), change: '', changeType: 'decrease', href: '/admin/mint-queue' },
        { name: 'Total Users', value: users.length.toString(), change: '', changeType: 'increase', href: '/admin/rbac' },
      ]);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Fallback to empty stats
      setStats([
        { name: 'Pending Assets', value: '0', change: '', changeType: 'increase', href: '/admin/assets' },
        { name: 'Active Campaigns', value: '0', change: '', changeType: 'increase', href: '/admin/campaigns' },
        { name: 'Mint Queue', value: '0', change: '', changeType: 'decrease', href: '/admin/mint-queue' },
        { name: 'Total Users', value: '0', change: '', changeType: 'increase', href: '/admin/rbac' },
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

      {/* Livepeer Test */}
      <div className="mv-card p-4 sm:p-6 mb-8">
        <h3 className="mv-heading-md mb-4">🚀 Livepeer Integration Test</h3>
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-400/20 rounded p-4">
            <p className="text-sm mb-4">Test the Livepeer integration with your IPFS video. This will import your video to Livepeer for fast streaming.</p>
            <div className="flex space-x-4">
              <input 
                type="text" 
                placeholder="Enter IPFS CID of test video"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                id="testCid"
              />
              <button 
                onClick={async () => {
                  const cid = (document.getElementById('testCid') as HTMLInputElement).value;
                  if (!cid) return alert('Enter CID');
                  
                  const response = await fetch('/api/livepeer/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ipfsCid: cid, name: 'Test Video', uploaderWallet: wallet })
                  });
                  
                  const result = await response.json();
                  alert(result.success ? 'Import started!' : 'Import failed: ' + result.error);
                }}
                className="mv-button"
              >
                Import to Livepeer
              </button>
            </div>
          </div>
        </div>
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