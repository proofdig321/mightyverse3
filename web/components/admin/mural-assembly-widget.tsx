'use client';

import React, { useState, useEffect } from 'react';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';
import Link from 'next/link';

interface Mural {
  id: string;
  title: string;
  artist_wallet: string;
  status: string;
  total_duration?: number;
  animator_versions?: string[];
  default_version?: string;
  created_at: string;
  metadata?: any;
}

interface MuralCard {
  id: string;
  mural_id: string;
  title: string;
  start_frame: number;
  end_frame: number;
  duration: number;
  animator_version: string;
  asset_cid?: string;
}

export default function MuralAssemblyWidget() {
  const [murals, setMurals] = useState<Mural[]>([]);
  const [selectedMural, setSelectedMural] = useState<Mural | null>(null);
  const [muralCards, setMuralCards] = useState<MuralCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState<string>('futuristic');

  useEffect(() => {
    loadData();
    
    // Real-time subscriptions
    const unsubscribeMurals = enhancedDataManager.subscribe('murals', loadMurals);
    const unsubscribeCards = enhancedDataManager.subscribe('mural_cards', loadMuralCards);
    
    return () => {
      unsubscribeMurals();
      unsubscribeCards();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadMurals(), loadMuralCards()]);
    } catch (error) {
      console.error('Failed to load mural data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMurals = async () => {
    const data = await enhancedDataManager.getData('murals');
    setMurals(data as Mural[]);
    
    // Auto-select first mural if none selected
    if (data.length > 0 && !selectedMural) {
      setSelectedMural(data[0] as Mural);
    }
  };

  const loadMuralCards = async () => {
    const data = await enhancedDataManager.getData('mural_cards');
    setMuralCards(data as MuralCard[]);
  };

  const createSampleMural = async () => {
    try {
      const newMural = await enhancedDataManager.createItem('murals', {
        title: 'New Holographic Experience',
        artist_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
        description: 'Interactive holographic mural',
        status: 'draft',
        total_duration: 120,
        animator_versions: ['futuristic', 'gritty', 'cultural'],
        default_version: 'futuristic',
        metadata: { 
          theme: 'experimental',
          complexity: 'medium',
          created_via: 'admin_widget'
        }
      });
      
      // Create sample cards
      const cardTemplates = [
        { title: 'Intro Sequence', duration: 30, version: 'futuristic' },
        { title: 'Main Verse', duration: 45, version: 'gritty' },
        { title: 'Outro', duration: 45, version: 'cultural' }
      ];
      
      let currentFrame = 0;
      for (const template of cardTemplates) {
        await enhancedDataManager.createItem('mural_cards', {
          mural_id: newMural.id,
          title: template.title,
          start_frame: currentFrame,
          end_frame: currentFrame + (template.duration * 16), // 16 FPS
          duration: template.duration,
          animator_version: template.version,
          asset_cid: `Qm${Math.random().toString(36).substring(2, 15)}`
        });
        currentFrame += template.duration * 16;
      }
      
      setSelectedMural(newMural as Mural);
    } catch (error) {
      console.error('Failed to create sample mural:', error);
    }
  };

  const getVersionColor = (version: string) => {
    const colors = {
      futuristic: 'from-blue-400 to-purple-400',
      gritty: 'from-gray-400 to-red-400',
      cultural: 'from-yellow-400 to-green-400'
    };
    return colors[version as keyof typeof colors] || 'from-white/20 to-white/10';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'mv-status-pending',
      submitted: 'mv-status-pending',
      approved: 'mv-status-success',
      published: 'text-purple-400 bg-purple-400/10 border border-purple-400/30'
    };
    return colors[status as keyof typeof colors] || 'mv-status-pending';
  };

  const selectedMuralCards = muralCards.filter(card => 
    selectedMural && card.mural_id === selectedMural.id
  );

  const versionCards = selectedMuralCards.filter(card => 
    card.animator_version === activeVersion
  );

  if (loading) {
    return (
      <div className="mv-card p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin text-4xl">◈</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mv-card mv-holographic p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="mv-heading-md flex items-center space-x-2">
          <span>◈</span>
          <span>Mural Assembly</span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={createSampleMural}
            className="mv-button-sm"
          >
            + Create Mural
          </button>
          <Link href="/murals" className="mv-button-secondary mv-button-sm">
            Full Gallery
          </Link>
        </div>
      </div>

      {/* Mural Selection */}
      {murals.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <select
              value={selectedMural?.id || ''}
              onChange={(e) => {
                const mural = murals.find(m => m.id === e.target.value);
                setSelectedMural(mural || null);
              }}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              {murals.map((mural) => (
                <option key={mural.id} value={mural.id} className="bg-gray-800">
                  {mural.title}
                </option>
              ))}
            </select>
            
            {selectedMural && (
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedMural.status)}`}>
                {selectedMural.status}
              </span>
            )}
          </div>

          {/* Mural Info */}
          {selectedMural && (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="mv-text-muted">Duration:</span>
                  <div className="font-semibold">{selectedMural.total_duration || 0}s</div>
                </div>
                <div>
                  <span className="mv-text-muted">Cards:</span>
                  <div className="font-semibold">{selectedMuralCards.length}</div>
                </div>
                <div>
                  <span className="mv-text-muted">Versions:</span>
                  <div className="font-semibold">{selectedMural.animator_versions?.length || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Version Selector */}
          {selectedMural?.animator_versions && (
            <div className="flex space-x-2 mb-4">
              {selectedMural.animator_versions.map((version) => (
                <button
                  key={version}
                  onClick={() => setActiveVersion(version)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center space-x-2 ${
                    activeVersion === version 
                      ? 'mv-button' 
                      : 'mv-button-secondary'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getVersionColor(version)}`}></div>
                  <span>{version.charAt(0).toUpperCase() + version.slice(1)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timeline Visualization */}
          {selectedMural && selectedMuralCards.length > 0 && (
            <div className="bg-black/20 rounded-xl p-4 mb-4">
              <h4 className="font-semibold mb-3 flex items-center space-x-2">
                <span>🎬</span>
                <span>Timeline - {activeVersion.charAt(0).toUpperCase() + activeVersion.slice(1)}</span>
              </h4>
              
              <div className="relative h-16 bg-black/30 rounded-lg overflow-hidden">
                {versionCards.map((card) => {
                  const totalFrames = selectedMural.total_duration ? selectedMural.total_duration * 16 : 1920;
                  const widthPercent = ((card.end_frame - card.start_frame) / totalFrames) * 100;
                  const leftPercent = (card.start_frame / totalFrames) * 100;
                  
                  return (
                    <div
                      key={card.id}
                      className={`absolute h-full bg-gradient-to-r ${getVersionColor(card.animator_version)} opacity-80 hover:opacity-100 transition-all cursor-pointer border-r-2 border-white/20`}
                      style={{ width: `${widthPercent}%`, left: `${leftPercent}%` }}
                      title={`${card.title} (${card.duration}s)`}
                    >
                      <div className="p-2 h-full flex flex-col justify-center">
                        <div className="text-black text-xs font-bold truncate">
                          {card.title}
                        </div>
                        <div className="text-black text-xs opacity-75">
                          {card.duration}s
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-xs mv-text-muted mt-2">
                <span>0s</span>
                <span>{selectedMural.total_duration || 0}s</span>
              </div>
            </div>
          )}

          {/* Card Grid */}
          {versionCards.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {versionCards.slice(0, 4).map((card) => (
                <div key={card.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-4 h-4 rounded bg-gradient-to-r ${getVersionColor(card.animator_version)}`}></div>
                    <h5 className="font-semibold text-sm truncate">{card.title}</h5>
                  </div>
                  <div className="text-xs mv-text-muted space-y-1">
                    <div>Duration: {card.duration}s</div>
                    <div>Frames: {card.start_frame}-{card.end_frame}</div>
                    {card.asset_cid && (
                      <div className="font-mono">CID: {card.asset_cid.substring(0, 12)}...</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">◈</div>
          <p className="mv-text-muted mb-4">No murals created yet</p>
          <button 
            onClick={createSampleMural}
            className="mv-button"
          >
            Create Your First Mural
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {selectedMural && (
        <div className="flex space-x-2 pt-4 border-t border-white/10">
          <Link 
            href={`/murals?mural=${selectedMural.id}`}
            className="mv-button-secondary flex-1 text-center"
          >
            ◈ View Full Mural
          </Link>
          <button className="mv-button-secondary">
            🎨 Edit Cards
          </button>
          <button className="mv-button-secondary">
            🚀 Publish
          </button>
        </div>
      )}
    </div>
  );
}