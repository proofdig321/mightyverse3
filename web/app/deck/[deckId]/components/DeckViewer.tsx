'use client';

/**
 * DeckViewer - Interactive Card Grid with Holographic Effects
 * Responsive grid layout with holographic card previews
 */

import React, { useState } from 'react';
import { DeckCard } from './DeckCard';

interface CardData {
  id: string;
  title: string;
  startFrame: number;
  endFrame: number;
  duration: number;
  animatorVersion: string;
  manifestCid: string;
  layers: {
    background: string;
    midground: string;
    foreground: string;
    depthMapCid?: string;
  };
  adAnchors?: AdAnchor[];
  metadata: {
    confidence: number;
    qcScore: number;
    tags: string[];
  };
}

interface AdAnchor {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  confidence: number;
  enabled: boolean;
}

interface DeckViewerProps {
  cards: CardData[];
  currentCard: CardData | null;
  onCardSelect: (card: CardData) => void;
  animatorVersion: string;
}

export function DeckViewer({ cards, currentCard, onCardSelect, animatorVersion }: DeckViewerProps) {
  const [filter, setFilter] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'sequence' | 'duration' | 'quality'>('sequence');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter cards based on selected filter
  const filteredCards = cards.filter(card => {
    if (filter === 'all') return true;
    return card.metadata.tags.includes(filter);
  });

  // Sort cards based on selected sort option
  const sortedCards = [...filteredCards].sort((a, b) => {
    switch (sortBy) {
      case 'sequence':
        return a.startFrame - b.startFrame;
      case 'duration':
        return b.duration - a.duration;
      case 'quality':
        return b.metadata.qcScore - a.metadata.qcScore;
      default:
        return 0;
    }
  });

  // Get unique tags for filtering
  const availableTags = Array.from(
    new Set(cards.flatMap(card => card.metadata.tags))
  );

  const handleShuffle = () => {
    const shuffled = [...sortedCards].sort(() => Math.random() - 0.5);
    // In a real implementation, you'd update the cards order
    console.log('Shuffled cards:', shuffled);
  };

  const handlePlayOnlyArtist = () => {
    // Filter cards by the current animator version
    const artistCards = cards.filter(card => card.animatorVersion === animatorVersion);
    console.log('Playing only artist cards:', artistCards);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Deck Cards</h2>
          <p className="text-gray-400">
            {sortedCards.length} cards • {animatorVersion} version
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="all">All Cards</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="sequence">Sequence</option>
              <option value="duration">Duration</option>
              <option value="quality">Quality</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded text-sm ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded text-sm ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShuffle}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Shuffle
            </button>
            <button
              onClick={handlePlayOnlyArtist}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Play Artist Only
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCards.map((card, index) => (
            <DeckCard
              key={card.id}
              card={card}
              isActive={currentCard?.id === card.id}
              onClick={() => onCardSelect(card)}
              index={index}
              holographicEffect={true}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => onCardSelect(card)}
              className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                currentCard?.id === card.id
                  ? 'bg-blue-600/20 border border-blue-400/50 shadow-lg shadow-blue-400/20'
                  : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30'
              }`}
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-12 bg-gray-700 rounded overflow-hidden mr-4">
                <img
                  src={card.layers.foreground}
                  alt={card.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-card.jpg';
                  }}
                />
              </div>

              {/* Card Info */}
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{card.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>{Math.floor(card.duration)}s</span>
                    <span>•</span>
                    <span>QC: {Math.round(card.metadata.qcScore * 100)}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex flex-wrap gap-1">
                    {card.metadata.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {card.layers.depthMapCid && (
                      <span className="text-cyan-400">🔮 Holographic</span>
                    )}
                    {card.adAnchors && card.adAnchors.length > 0 && (
                      <span className="text-green-400">📍 {card.adAnchors.length} Anchors</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Play Indicator */}
              {currentCard?.id === card.id && (
                <div className="flex-shrink-0 ml-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedCards.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Cards Found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No cards available for this animator version.'
              : `No cards found with the "${filter}" tag.`
            }
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Show All Cards
            </button>
          )}
        </div>
      )}

      {/* Stats Footer */}
      <div className="bg-gray-900/50 rounded-lg p-4 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{cards.length}</div>
            <div className="text-sm text-gray-400">Total Cards</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {Math.round(cards.reduce((sum, card) => sum + card.duration, 0))}s
            </div>
            <div className="text-sm text-gray-400">Total Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {Math.round(cards.reduce((sum, card) => sum + card.metadata.qcScore, 0) / cards.length * 100)}%
            </div>
            <div className="text-sm text-gray-400">Avg Quality</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {cards.filter(card => card.layers.depthMapCid).length}
            </div>
            <div className="text-sm text-gray-400">Holographic</div>
          </div>
        </div>
      </div>
    </div>
  );
}