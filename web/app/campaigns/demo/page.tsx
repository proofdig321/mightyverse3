"use client";

import React, { useState } from 'react';
import DeckPlayer from '../../../components/DeckPlayer/DeckPlayer';
import ContextualBreadcrumb from '../../../components/admin/contextual-breadcrumb';
import Link from 'next/link';

export default function DemoPage() {
  const [campaignName, setCampaignName] = useState('Demo Campaign');
  const [sponsorId, setSponsorId] = useState('sponsor_demo');
  const [campaign, setCampaign] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [placements, setPlacements] = useState<any[]>([]);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  async function createCampaign() {
    const res = await fetch('/api/campaigns/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: campaignName, sponsorId, metadata: { description: 'Demo campaign created via UI' } })
    });
    const data = await res.json();
    setCampaign(data.campaign);
    await fetchCampaigns();
  }

  async function activateCampaign() {
    if (!campaign) return;
    const res = await fetch(`/api/campaigns/${campaign.id}/activate`, { method: 'POST' });
    const data = await res.json();
    setCampaign(data.campaign);
  }

  async function createStream() {
    if (!campaign) return;
    const res = await fetch(`/api/campaigns/${campaign.id}/streams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${campaign.name}-stream`, record: false })
    });
    const data = await res.json();
    setSession(data.session);
    setPlaybackUrl(data.session.playbackUrl || null);
    await fetchStreamsForCampaign(campaign.id);
  }

  async function addPlacement() {
    if (!session) return;
    const p = {
      id: `pl_${Date.now()}`,
      campaignId: campaign.id,
      assetCid: 'QmDemoCardCid',
      startTime: 5,
      duration: 10,
      layer: 0,
      z: 10
    };
    const res = await fetch(`/api/streams/${session.id}/placements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placements: [p] })
    });
    const data = await res.json();
    setPlacements((s) => [...s, p]);
    return data;
  }

  async function fetchCampaigns() {
    const res = await fetch(`/api/campaigns`);
    const data = await res.json();
    setCampaignsList(data.campaigns || []);
  }

  async function fetchStreamsForCampaign(cId: string) {
    const res = await fetch(`/api/campaigns/${cId}/streams`);
    const data = await res.json();
    setSessionsList(data.sessions || []);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ContextualBreadcrumb />
      
      <div className="mv-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mv-heading-lg mb-2">◇ Campaign Demo</h1>
            <p className="mv-text-muted">Original campaign creation and management workflow</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/campaigns/dashboard" className="mv-button-secondary">
              Dashboard View
            </Link>
            <Link href="/admin/demo-integration" className="mv-button-secondary">
              Demo Hub
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mv-card p-6">
        <h2 className="mv-heading-md mb-6">Campaign Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <input 
              value={campaignName} 
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sponsor ID</label>
            <input 
              value={sponsorId} 
              onChange={(e) => setSponsorId(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={createCampaign} className="mv-button">Create Campaign</button>
          <button onClick={activateCampaign} disabled={!campaign} className="mv-button-secondary">Activate</button>
          <button onClick={createStream} disabled={!campaign} className="mv-button-secondary">Create Stream</button>
          <button onClick={fetchCampaigns} className="mv-button-secondary">Refresh</button>
          <button onClick={() => campaign && fetchStreamsForCampaign(campaign.id)} disabled={!campaign} className="mv-button-secondary">Load Streams</button>
          <button onClick={addPlacement} disabled={!session} className="mv-button-secondary">Add Placement</button>
        </div>

        <div className="bg-black/20 rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Campaign Data</h3>
          <pre className="text-xs mv-text-muted overflow-auto">{JSON.stringify({ campaign, session, placements, campaignsList, sessionsList }, null, 2)}</pre>
        </div>

        <div className="w-full h-96 bg-black rounded-xl overflow-hidden">
          {playbackUrl ? (
            <DeckPlayer
              playbackUrl={playbackUrl}
              timeline={placements.map((p) => ({ id: p.id, startMs: p.startTime * 1000, durationMs: p.duration * 1000, cardCid: p.assetCid }))}
              onImpression={(i) => console.log('impression', i)}
            />
          ) : (
            <div className="text-white p-8 text-center">
              <div className="text-4xl mb-4">🎬</div>
              <p className="mv-text-muted">No stream created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
