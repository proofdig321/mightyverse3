'use client';

import React, { useState, useEffect } from 'react';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sponsor_id?: string;
  created_at: string;
  budget?: number;
  impressions?: number;
}

interface StreamSession {
  id: string;
  campaign_id: string;
  playback_url?: string;
  status: 'active' | 'inactive';
  placements_count?: number;
}

export default function CampaignManagementWidget() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', sponsor_id: '' });

  useEffect(() => {
    loadData();
    
    // Real-time subscriptions
    const unsubscribeCampaigns = enhancedDataManager.subscribe('campaigns', loadCampaigns);
    const unsubscribeSessions = enhancedDataManager.subscribe('stream_sessions', loadSessions);
    
    return () => {
      unsubscribeCampaigns();
      unsubscribeSessions();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCampaigns(), loadSessions()]);
    } catch (error) {
      console.error('Failed to load campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    const data = await enhancedDataManager.getData('campaigns');
    setCampaigns(data as Campaign[]);
  };

  const loadSessions = async () => {
    const data = await enhancedDataManager.getData('stream_sessions');
    setSessions(data as StreamSession[]);
  };

  const createCampaign = async () => {
    if (!newCampaign.name.trim()) return;
    
    try {
      await enhancedDataManager.createItem('campaigns', {
        name: newCampaign.name,
        sponsor_id: newCampaign.sponsor_id || 'default_sponsor',
        status: 'draft',
        budget: 0,
        impressions: 0,
        metadata: { created_via: 'admin_widget' }
      });
      
      setNewCampaign({ name: '', sponsor_id: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const activateCampaign = async (campaignId: string) => {
    try {
      await enhancedDataManager.updateItem('campaigns', campaignId, { 
        status: 'active',
        activated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to activate campaign:', error);
    }
  };

  const createStream = async (campaignId: string) => {
    try {
      await enhancedDataManager.createItem('stream_sessions', {
        campaign_id: campaignId,
        name: `Stream-${Date.now()}`,
        status: 'active',
        playback_url: `https://stream.livepeer.studio/hls/${campaignId}`,
        placements_count: 0
      });
    } catch (error) {
      console.error('Failed to create stream:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'mv-status-pending',
      active: 'mv-status-success',
      paused: 'text-orange-400 bg-orange-400/10 border border-orange-400/30',
      completed: 'text-purple-400 bg-purple-400/10 border border-purple-400/30'
    };
    return colors[status as keyof typeof colors] || 'mv-status-pending';
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const campaignSessions = sessions.filter(s => selectedCampaign && s.campaign_id === selectedCampaign.id);

  if (loading) {
    return (
      <div className="mv-card p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin text-4xl">◇</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mv-card mv-holographic p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="mv-heading-md flex items-center space-x-2">
          <span>◇</span>
          <span>Campaign Management</span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mv-button-sm"
          >
            + Create
          </button>
          <Link href="/campaigns/dashboard" className="mv-button-secondary mv-button-sm">
            Full Dashboard
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{campaigns.length}</div>
          <div className="text-sm mv-text-muted">Total Campaigns</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold mv-text-energy">{activeCampaigns.length}</div>
          <div className="text-sm mv-text-muted">Active</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold mv-text-accent">{sessions.length}</div>
          <div className="text-sm mv-text-muted">Live Streams</div>
        </div>
      </div>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <div className="bg-white/5 rounded-xl p-4 mb-6 mv-fade-in">
          <h4 className="mv-heading-sm mb-4">Create New Campaign</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Campaign name"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
            <input
              type="text"
              placeholder="Sponsor ID (optional)"
              value={newCampaign.sponsor_id}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, sponsor_id: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
            <div className="flex space-x-2">
              <button onClick={createCampaign} className="mv-button flex-1">
                Create Campaign
              </button>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="mv-button-secondary px-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-3">
        {campaigns.slice(0, 3).map((campaign) => (
          <div 
            key={campaign.id}
            className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
              selectedCampaign?.id === campaign.id 
                ? 'bg-white/10 border-white/30' 
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
            onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{campaign.name}</h4>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  {campaign.sponsor_id && (
                    <span className="mv-text-muted">
                      Sponsor: {campaign.sponsor_id}
                    </span>
                  )}
                  <span className="mv-text-muted">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                {campaign.status === 'draft' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      activateCampaign(campaign.id);
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Activate
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      createStream(campaign.id);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + Stream
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Campaign Details */}
            {selectedCampaign?.id === campaign.id && (
              <div className="mt-4 pt-4 border-t border-white/10 mv-fade-in">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm mv-text-muted">Budget:</span>
                    <div className="font-semibold">${campaign.budget || 0}</div>
                  </div>
                  <div>
                    <span className="text-sm mv-text-muted">Impressions:</span>
                    <div className="font-semibold">{campaign.impressions || 0}</div>
                  </div>
                </div>

                {/* Stream Sessions */}
                {campaignSessions.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2">Stream Sessions ({campaignSessions.length})</h5>
                    <div className="space-y-2">
                      {campaignSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <div>
                            <span className="text-sm font-medium">{session.id}</span>
                            <div className="text-xs mv-text-muted">
                              {session.placements_count || 0} placements
                            </div>
                          </div>
                          <Link 
                            href={`/campaigns/dashboard?stream=${session.id}`}
                            className="text-xs mv-button-secondary px-2 py-1"
                          >
                            Edit Timeline
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {campaigns.length > 3 && (
          <Link href="/campaigns/dashboard" className="block text-center py-3 mv-text-muted hover:text-white transition-colors">
            View all {campaigns.length} campaigns →
          </Link>
        )}

        {campaigns.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">◇</div>
            <p className="mv-text-muted">No campaigns yet</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="mt-2 mv-button-secondary"
            >
              Create your first campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}