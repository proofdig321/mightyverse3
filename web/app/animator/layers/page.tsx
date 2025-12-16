'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import Link from 'next/link';
import HolographicVideoPlayer from '../../../components/HolographicVideoPlayer';

interface Mural {
  id: string;
  title: string;
  description: string;
  artist_wallet: string;
  total_duration: number;
  animator_versions: string[];
  status: string;
  created_at: string;
  cards: Card[];
}

interface Card {
  id: string;
  title: string;
  layers: {
    background?: string;
    midground?: string;
    foreground?: string;
    depthMap?: string;
  };
  duration: number;
  animator_version: string;
}

export default function LayerManagementPage() {
  const { wallet, isAnimator, isAdmin } = useRBAC();
  const [murals, setMurals] = useState<Mural[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMural, setSelectedMural] = useState<Mural | null>(null);
  const [editingMural, setEditingMural] = useState<Mural | null>(null);

  useEffect(() => {
    loadMurals();
  }, [wallet]);

  const loadMurals = async () => {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (wallet && !isAdmin) {
        params.append('creator', wallet);
      }
      
      const response = await fetch(`/api/layers?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setMurals(result.murals);
      }
    } catch (error) {
      console.error('Failed to load murals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMural = async (id: string, updates: Partial<Mural>) => {
    try {
      const response = await fetch(`/api/layers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadMurals();
        setEditingMural(null);
      } else {
        alert(result.error || 'Update failed');
      }
    } catch (error) {
      alert('Update failed');
    }
  };

  const handleDeleteMural = async (id: string) => {
    if (!confirm('Delete this mural? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/layers/${id}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        await loadMurals();
        setSelectedMural(null);
      } else {
        alert(result.error || 'Delete failed');
      }
    } catch (error) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-400/20';
      case 'approved': return 'text-blue-400 bg-blue-400/20';
      case 'submitted': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (!isAnimator && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mv-card p-8 text-center">
          <h1 className="mv-heading-lg text-red-400 mb-4">Access Denied</h1>
          <p className="mv-text-muted">Animator privileges required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-6xl">◈</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="mv-heading-xl mb-2">◈ Holographic Murals ◈</h1>
          <p className="mv-text-muted">Manage your 2.5D holographic layer compositions</p>
        </div>
        <Link href="/animator/upload-layers" className="mv-button">
          + Upload New Layers
        </Link>
      </div>

      {murals.length === 0 ? (
        <div className="mv-card p-12 text-center">
          <div className="text-6xl mb-4">◈</div>
          <h3 className="mv-heading-md mb-2">No Murals Yet</h3>
          <p className="mv-text-muted mb-6">Start creating holographic experiences</p>
          <Link href="/animator/upload-layers" className="mv-button">
            Upload First Mural
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {murals.map((mural) => (
            <div key={mural.id} className="mv-card p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="mv-heading-md truncate flex-1">{mural.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(mural.status)}`}>
                  {mural.status}
                </span>
              </div>
              
              <p className="mv-text-muted text-sm mb-4 line-clamp-2">{mural.description}</p>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="mv-text-muted">Duration:</span>
                  <span>{Math.floor(mural.total_duration / 60)}:{(mural.total_duration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="mv-text-muted">Cards:</span>
                  <span>{mural.cards?.length || 0}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedMural(mural)}
                  className="mv-button-secondary flex-1 text-sm py-2"
                >
                  Preview
                </button>
                <button
                  onClick={() => setEditingMural(mural)}
                  className="mv-button-secondary px-3 py-2 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMural(mural.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedMural && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="mv-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="mv-heading-lg">{selectedMural.title}</h2>
              <button
                onClick={() => setSelectedMural(null)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {selectedMural.cards?.[0]?.layers?.background && (
                <HolographicVideoPlayer
                  fileCid={selectedMural.cards[0].layers.background}
                  title={selectedMural.title}
                  className="w-full aspect-video mb-6"
                />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="mv-text-muted">Duration:</span> {selectedMural.total_duration}s</div>
                    <div><span className="mv-text-muted">Status:</span> {selectedMural.status}</div>
                  </div>
                </div>
                
                {selectedMural.cards?.[0] && (
                  <div>
                    <h4 className="font-semibold mb-2">Layers</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(selectedMural.cards[0].layers).map(([layer, cid]) => (
                        <div key={layer} className="flex justify-between">
                          <span className="mv-text-muted capitalize">{layer}:</span>
                          <span className="text-green-400">{cid ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMural && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="mv-card max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="mv-heading-lg">Edit Mural</h2>
              <button
                onClick={() => setEditingMural(null)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editingMural.title}
                  onChange={(e) => setEditingMural(prev => prev ? {...prev, title: e.target.value} : null)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={editingMural.status}
                  onChange={(e) => setEditingMural(prev => prev ? {...prev, status: e.target.value} : null)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleUpdateMural(editingMural.id, {
                    title: editingMural.title,
                    status: editingMural.status
                  })}
                  className="mv-button flex-1"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingMural(null)}
                  className="mv-button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}