"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ContextualBreadcrumb from '../../../components/admin/contextual-breadcrumb';
import Link from 'next/link';

const TimelineEditor = dynamic(() => import('../../../components/TimelineEditor/TimelineEditor'), { ssr: false });

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    const res = await fetch('/api/campaigns');
    const data = await res.json();
    setCampaigns(data.campaigns || []);
  }

  async function fetchStreams(campaignId: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/streams`);
    const data = await res.json();
    setSessions(data.sessions || []);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ContextualBreadcrumb />
      
      <div className="mv-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mv-heading-lg mb-2">🎬 Campaign Dashboard</h1>
            <p className="mv-text-muted">Timeline editor and session management</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/campaigns/demo" className="mv-button-secondary">
              Demo View
            </Link>
            <Link href="/admin/demo-integration" className="mv-button-secondary">
              Demo Hub
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mv-card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="mv-heading-sm">Campaigns</h3>
              <button onClick={fetchCampaigns} className="mv-button-secondary mv-button-sm">Refresh</button>
            </div>
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="font-semibold text-white mb-1">{c.name}</div>
                  <div className="text-xs mv-text-muted mb-3">{c.id}</div>
                  <button
                    onClick={() => {
                      setSelectedCampaign(c.id);
                      fetchStreams(c.id);
                    }}
                    className="mv-button-secondary mv-button-sm"
                  >
                    Load Streams
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mv-heading-sm mb-4">Stream Sessions {selectedCampaign ? `for ${selectedCampaign}` : ''}</h3>
            <div className="space-y-3 mb-6">
              {sessions.map((s) => (
                <div key={s.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{s.playbackUrl || s.playbackId || s.id}</div>
                      <div className="text-xs mv-text-muted">{s.id}</div>
                    </div>
                    <button 
                      onClick={() => setSelectedCampaign(s.id)}
                      className="mv-button-secondary mv-button-sm"
                    >
                      Open Timeline
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedCampaign && (
              <div className="mt-6">
                <TimelineEditor streamId={selectedCampaign} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
