'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { dataManager } from '../../../utils/storage/data-store';

interface Campaign {
  id: string;
  name: string;
  sponsor: string;
  budget: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate: string;
  assets: number;
}

export default function CampaignsPage() {
  const { isAdmin } = useRBAC();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignData, sponsorData] = await Promise.all([
        dataManager.getData('campaigns'),
        dataManager.getData('sponsors')
      ]);
      setCampaigns(campaignData);
      setSponsors(sponsorData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    sponsor: '',
    budget: 0,
    startDate: '',
    endDate: ''
  });

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.sponsor) return;
    
    try {
      await dataManager.addItem('campaigns', {
        ...newCampaign,
        status: 'draft',
        assets: 0
      });
      await loadData();
      setNewCampaign({ name: '', sponsor: '', budget: 0, startDate: '', endDate: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleStatusChange = async (id: string, status: Campaign['status']) => {
    try {
      await dataManager.updateItem('campaigns', id, { status });
      await loadData();
    } catch (error) {
      console.error('Failed to update campaign:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-6xl">◈</div>
      </div>
    );
  }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">📢 Campaign Management</h1>
        <p className="mv-text-muted text-lg">Create and manage advertising campaigns</p>
      </div>

      {/* Create Campaign */}
      <div className="mv-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="mv-heading-md">Campaigns ({campaigns.length})</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mv-button"
          >
            {showCreateForm ? 'Cancel' : 'Create Campaign'}
          </button>
        </div>

        {showCreateForm && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sponsor</label>
                <select
                  value={newCampaign.sponsor}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, sponsor: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="">Select sponsor</option>
                  {sponsors.map(sponsor => (
                    <option key={sponsor.id} value={sponsor.name}>{sponsor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Budget ($)</label>
                <input
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={newCampaign.startDate}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>
            <button onClick={handleCreateCampaign} className="mv-button">
              Create Campaign
            </button>
          </div>
        )}
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="mv-card p-12 text-center">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="mv-heading-md mb-2">No Campaigns Yet</h3>
            <p className="mv-text-muted mb-6">This is a new platform - create your first campaign</p>
            <button onClick={() => setShowCreateForm(true)} className="mv-button">
              Create First Campaign
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
          <div key={campaign.id} className="mv-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg mb-2">{campaign.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mv-text-muted">
                  <div>Sponsor: {campaign.sponsor}</div>
                  <div>Budget: ${campaign.budget.toLocaleString()}</div>
                  <div>Assets: {campaign.assets}</div>
                  <div>Duration: {campaign.startDate} - {campaign.endDate}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  campaign.status === 'active' ? 'bg-green-400/20 text-green-400' :
                  campaign.status === 'paused' ? 'bg-yellow-400/20 text-yellow-400' :
                  campaign.status === 'completed' ? 'bg-blue-400/20 text-blue-400' :
                  'bg-gray-400/20 text-gray-400'
                }`}>
                  {campaign.status}
                </span>
                <div className="flex space-x-2">
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(campaign.id, 'active')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                    >
                      Launch
                    </button>
                  )}
                  {campaign.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(campaign.id, 'paused')}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white text-sm"
                    >
                      Pause
                    </button>
                  )}
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}