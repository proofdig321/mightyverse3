"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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
    <div style={{ padding: 24 }}>
      <h2>Campaigns Dashboard</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: '40%' }}>
          <h3>Campaigns</h3>
          <button onClick={fetchCampaigns}>Refresh</button>
          <ul>
            {campaigns.map((c) => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <div>
                  <strong>{c.name}</strong>
                </div>
                <div>{c.id}</div>
                <div>
                  <button
                    onClick={() => {
                      setSelectedCampaign(c.id);
                      fetchStreams(c.id);
                    }}
                  >
                    Load Streams
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ width: '60%' }}>
          <h3>Stream Sessions {selectedCampaign ? `for ${selectedCampaign}` : ''}</h3>
          <ul>
            {sessions.map((s) => (
              <li key={s.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{s.playbackUrl || s.playbackId || s.id}</strong>
                    <div style={{ fontSize: 12 }}>{s.id}</div>
                  </div>
                  <div>
                    <button onClick={() => setSelectedCampaign(s.id)}>Open Timeline</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {selectedCampaign ? (
            <div style={{ marginTop: 12 }}>
              <TimelineEditor streamId={selectedCampaign} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
