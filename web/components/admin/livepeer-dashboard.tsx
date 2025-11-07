'use client';

import React, { useState, useEffect } from 'react';

interface StreamStatus {
  id: string;
  ipfs_cid: string;
  livepeer_playback_id: string;
  status: string;
  name: string;
  created_at: string;
}

export default function LivepeerDashboard() {
  const [streams, setStreams] = useState<StreamStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/livepeer/streams');
      const data = await response.json();
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    }
    setLoading(false);
  };

  const processBatch = async () => {
    setBatchProcessing(true);
    try {
      const response = await fetch('/api/livepeer/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 })
      });
      const result = await response.json();
      alert(`Processed ${result.processed} assets`);
      fetchStreams();
    } catch (error) {
      console.error('Batch processing failed:', error);
      alert('Batch processing failed');
    }
    setBatchProcessing(false);
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  return (
    <div className="p-6 bg-black/20 rounded-lg border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Livepeer Dashboard</h2>
        <div className="space-x-4">
          <button
            onClick={fetchStreams}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={processBatch}
            disabled={batchProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {batchProcessing ? 'Processing...' : 'Process Batch'}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {streams.map((stream) => (
          <div key={stream.id} className="p-4 bg-white/5 rounded border border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-medium">{stream.name}</h3>
                <p className="text-sm text-gray-400">CID: {stream.ipfs_cid}</p>
                <p className="text-sm text-gray-400">Playback ID: {stream.livepeer_playback_id}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs ${
                  stream.status === 'ready' ? 'bg-green-600' :
                  stream.status === 'processing' ? 'bg-yellow-600' :
                  'bg-red-600'
                } text-white`}>
                  {stream.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(stream.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {streams.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          No streams found. Click "Process Batch" to migrate video assets.
        </div>
      )}
    </div>
  );
}