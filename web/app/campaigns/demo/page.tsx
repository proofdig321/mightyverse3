"use client";

import React, { useState } from 'react';
import DeckPlayer from '../../../components/DeckPlayer/DeckPlayer';

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
    <div style={{ padding: 24 }}>
      <h2>Campaign Demo</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block' }}>Campaign name</label>
        <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block' }}>Sponsor ID</label>
        <input value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={createCampaign}>Create Campaign</button>
        <button onClick={activateCampaign} disabled={!campaign}>Activate</button>
        <button onClick={createStream} disabled={!campaign}>Create Stream</button>
        <button onClick={fetchCampaigns}>Refresh Campaigns</button>
        <button onClick={() => campaign && fetchStreamsForCampaign(campaign.id)} disabled={!campaign}>Load Streams for Campaign</button>
        <button onClick={addPlacement} disabled={!session}>Add Placement</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <pre>{JSON.stringify({ campaign, session, placements, campaignsList, sessionsList }, null, 2)}</pre>
      </div>

      <div style={{ width: '100%', height: 480, background: '#000' }}>
        {playbackUrl ? (
          <DeckPlayer
            playbackUrl={playbackUrl}
            timeline={placements.map((p) => ({ id: p.id, startMs: p.startTime * 1000, durationMs: p.duration * 1000, cardCid: p.assetCid }))}
            onImpression={(i) => console.log('impression', i)}
          />
        ) : (
          <div style={{ color: '#fff', padding: 20 }}>No stream created yet</div>
        )}
      </div>
    </div>
  );
}
