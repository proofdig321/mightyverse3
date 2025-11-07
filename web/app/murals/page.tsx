'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MuralUtils } from '../../utils/murals/assembly';
import Pagination from '../../components/Pagination';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';

const mockMural = {
  id: 'mural_superhero_ego',
  title: 'Super Hero Ego',
  artist: 'Golden Shovel',
  description: 'Complete holographic mural with multiple animator perspectives',
  totalDuration: 180,
  animatorVersions: ['futuristic', 'gritty', 'cultural'],
  defaultVersion: 'futuristic',
  cards: [
    {
      id: 'card_intro',
      title: 'Intro - The Rise',
      startFrame: 0,
      endFrame: 480,
      duration: 30,
      animatorVersion: 'futuristic',
      manifestCid: 'QmIntro123',
      layers: { background: 'QmBg1', midground: 'QmMid1', foreground: 'QmFg1', depthMapCid: 'QmDepth1' },
      metadata: { confidence: 0.95, qcScore: 0.88, tags: ['intro', 'holographic', 'futuristic'] }
    },
    {
      id: 'card_verse1',
      title: 'Verse 1 - The Journey',
      startFrame: 480,
      endFrame: 960,
      duration: 30,
      animatorVersion: 'gritty',
      manifestCid: 'QmVerse123',
      layers: { background: 'QmBg2', midground: 'QmMid2', foreground: 'QmFg2', depthMapCid: 'QmDepth2' },
      metadata: { confidence: 0.87, qcScore: 0.91, tags: ['verse', 'street', 'gritty'] }
    }
  ],
  metadata: {
    genre: 'Afrofuturism Hip-Hop',
    tags: ['holographic', 'african', 'futuristic'],
    releaseDate: '2025-01-27',
    isrc: 'ZA-80H-25-00097',
    totalFrames: 1440,
    frameRate: 16
  }
};

export default function Murals() {
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [currentVersion, setCurrentVersion] = useState('futuristic');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [murals, setMurals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 6;

  useEffect(() => {
    loadMurals();
    
    // Set up real-time subscription
    const unsubscribe = enhancedDataManager.subscribe('murals', loadMurals);
    return unsubscribe;
  }, []);

  const loadMurals = async () => {
    try {
      const data = await enhancedDataManager.getData('murals');
      if (data.length === 0) {
        // Create sample mural if none exist
        await enhancedDataManager.createItem('murals', {
          title: 'Super Hero Ego',
          artist_wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          description: 'Complete holographic mural with multiple animator perspectives',
          total_duration: 180,
          animator_versions: ['futuristic', 'gritty', 'cultural'],
          default_version: 'futuristic',
          status: 'published',
          metadata: {
            genre: 'Afrofuturism Hip-Hop',
            tags: ['holographic', 'african', 'futuristic'],
            isrc: 'ZA-80H-25-00097'
          }
        });
        return loadMurals();
      }
      setMurals(data);
    } catch (error) {
      console.error('Failed to load murals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVersionCards = (version: string) => mockMural.cards.filter(card => card.animatorVersion === version);
  const getCardIcon = (card: any) => card.title.includes('Intro') ? '◆' : '◈';
  const getVersionColor = (version: string) => {
    switch (version) {
      case 'futuristic': return 'from-blue-400 to-purple-400';
      case 'gritty': return 'from-gray-400 to-red-400';
      case 'cultural': return 'from-yellow-400 to-green-400';
      default: return 'from-white/20 to-white/10';
    }
  };

  const currentMural = murals[0] || mockMural;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12 mv-fade-in">
          <h1 className="mv-heading-xl mb-4">◈ {currentMural.title} ◈</h1>
          <p className="mv-text-muted text-lg mb-6">{currentMural.description}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="mv-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{currentMural.cards?.length || 2}</div>
              <div className="mv-text-muted text-sm">Cards</div>
            </div>
            <div className="mv-card p-4 text-center">
              <div className="text-2xl font-bold text-white">3:00</div>
              <div className="mv-text-muted text-sm">Duration</div>
            </div>
            <div className="mv-card p-4 text-center">
              <div className="text-2xl font-bold text-white">89%</div>
              <div className="mv-text-muted text-sm">Quality</div>
            </div>
            <div className="mv-card p-4 text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="mv-text-muted text-sm">Holographic</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 mb-8 justify-center">
          {(currentMural.animator_versions || mockMural.animatorVersions).map((version: string) => (
            <button
              key={version}
              onClick={() => setCurrentVersion(version)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-500 flex items-center space-x-2 text-sm sm:text-base ${
                currentVersion === version ? 'mv-button shadow-2xl transform scale-105' : 'mv-button-secondary hover:scale-105'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getVersionColor(version)}`}></div>
              <span>{version.charAt(0).toUpperCase() + version.slice(1)}</span>
            </button>
          ))}
        </div>

        <div className="mv-card mv-holographic p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="mv-heading-md">Master Timeline</h3>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="mv-player-button bg-gradient-to-br from-yellow-400 to-green-400 text-black text-xl font-bold"
            >
              {isPlaying ? '◼' : '▶'}
            </button>
          </div>

          <div className="relative h-24 bg-black/20 rounded-xl overflow-hidden mb-4">
            {(currentMural.cards || mockMural.cards).map((card: any, index: number) => {
              const widthPercent = (card.duration / (currentMural.total_duration || mockMural.totalDuration)) * 100;
              const leftPercent = (card.startFrame / (currentMural.metadata?.totalFrames || mockMural.metadata.totalFrames)) * 100;
              
              return (
                <div
                  key={card.id}
                  className={`absolute h-full bg-gradient-to-r ${getVersionColor(card.animatorVersion)} opacity-80 hover:opacity-100 transition-all cursor-pointer border-r-2 border-white/20`}
                  style={{ width: `${widthPercent}%`, left: `${leftPercent}%` }}
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="p-2 h-full flex flex-col justify-center">
                    <div className="text-black text-lg font-bold">{getCardIcon(card)}</div>
                    <div className="text-black text-xs font-semibold truncate">{card.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mv-heading-md mb-6">Card Deck - {currentVersion.charAt(0).toUpperCase() + currentVersion.slice(1)} Version</h3>
          <div className="mv-grid-responsive">
            {getVersionCards(currentVersion).map((card: any) => (
              <div 
                key={card.id}
                className={`mv-card mv-holographic p-6 cursor-pointer transition-all duration-300 ${
                  selectedCard?.id === card.id ? 'ring-2 ring-yellow-400 scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setSelectedCard(card)}
              >
                <div className="aspect-video bg-gradient-to-br from-black/40 to-black/20 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                  <div className={`text-6xl opacity-60 bg-gradient-to-r ${getVersionColor(card.animatorVersion)} bg-clip-text text-transparent`}>
                    {getCardIcon(card)}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                    {card.duration}s
                  </div>
                  <div className="absolute bottom-2 left-2 bg-yellow-400/20 px-2 py-1 rounded text-xs text-yellow-400">
                    2.5D
                  </div>
                </div>

                <h4 className="mv-heading-md mb-2">{card.title}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="mv-text-muted">Quality:</span>
                    <span className="text-green-400 font-semibold">{Math.round(card.metadata.qcScore * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="mv-text-muted">Frames:</span>
                    <span className="text-white font-mono">{card.startFrame}-{card.endFrame}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {card.metadata.tags.slice(0, 3).map((tag: string, idx: number) => (
                    <span key={idx} className="bg-white/10 px-2 py-1 rounded text-xs mv-text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(getVersionCards(currentVersion).length / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={getVersionCards(currentVersion).length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
    </div>
  );
}