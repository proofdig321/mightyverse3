/**
 * Murals Assembly System
 * Multi-card timeline coordination and deck creation
 */

export interface CardManifest {
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

export interface AdAnchor {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  confidence: number;
  enabled: boolean;
}

export interface MuralManifest {
  id: string;
  title: string;
  artist: string;
  description: string;
  totalDuration: number;
  animatorVersions: string[];
  defaultVersion: string;
  timeline: TimelineSegment[];
  cards: CardManifest[];
  metadata: {
    genre: string;
    tags: string[];
    releaseDate: string;
    isrc?: string;
    totalFrames: number;
    frameRate: number;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface TimelineSegment {
  startFrame: number;
  endFrame: number;
  cardId: string;
  animatorVersion: string;
  transitionType?: 'cut' | 'fade' | 'slide';
  transitionDuration?: number;
}

export class MuralAssembler {
  /**
   * Assemble multiple animator versions into a cohesive mural
   */
  static assembleMural(
    cards: CardManifest[],
    metadata: {
      title: string;
      artist: string;
      description: string;
      genre: string;
      tags: string[];
      isrc?: string;
    }
  ): MuralManifest {
    // Validate timeline continuity
    const validation = this.validateTimeline(cards);
    
    // Generate master timeline
    const timeline = this.generateTimeline(cards);
    
    // Calculate total duration
    const totalDuration = Math.max(...cards.map(card => card.endFrame)) / 16; // Assuming 16 FPS
    const totalFrames = Math.max(...cards.map(card => card.endFrame));
    
    // Get all animator versions
    const animatorVersions = Array.from(new Set(cards.map(card => card.animatorVersion)));
    
    const mural: MuralManifest = {
      id: `mural_${Date.now()}`,
      title: metadata.title,
      artist: metadata.artist,
      description: metadata.description,
      totalDuration,
      animatorVersions,
      defaultVersion: animatorVersions[0] || 'default',
      timeline,
      cards: cards.sort((a, b) => a.startFrame - b.startFrame),
      metadata: {
        genre: metadata.genre,
        tags: metadata.tags,
        releaseDate: new Date().toISOString().split('T')[0],
        isrc: metadata.isrc,
        totalFrames,
        frameRate: 16
      },
      validation
    };

    return mural;
  }

  /**
   * Validate timeline continuity and detect issues
   */
  private static validateTimeline(cards: CardManifest[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Sort cards by start frame
    const sortedCards = [...cards].sort((a, b) => a.startFrame - b.startFrame);
    
    // Check for overlaps and gaps
    for (let i = 0; i < sortedCards.length - 1; i++) {
      const current = sortedCards[i];
      const next = sortedCards[i + 1];
      
      // Check for overlap
      if (current.endFrame > next.startFrame) {
        errors.push(`Overlap detected: Card "${current.title}" overlaps with "${next.title}"`);
      }
      
      // Check for gaps
      if (current.endFrame < next.startFrame - 1) {
        const gapDuration = (next.startFrame - current.endFrame) / 16;
        if (gapDuration > 1) {
          warnings.push(`Gap detected: ${gapDuration.toFixed(1)}s gap between cards`);
        }
      }
    }
    
    // Check for minimum quality scores
    const lowQualityCards = cards.filter(card => card.metadata.qcScore < 0.7);
    if (lowQualityCards.length > 0) {
      warnings.push(`${lowQualityCards.length} cards have quality scores below 70%`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate master timeline with transitions
   */
  private static generateTimeline(cards: CardManifest[]): TimelineSegment[] {
    const sortedCards = [...cards].sort((a, b) => a.startFrame - b.startFrame);
    
    return sortedCards.map((card, index) => {
      const segment: TimelineSegment = {
        startFrame: card.startFrame,
        endFrame: card.endFrame,
        cardId: card.id,
        animatorVersion: card.animatorVersion
      };

      // Add transitions between segments
      if (index < sortedCards.length - 1) {
        const nextCard = sortedCards[index + 1];
        const gap = nextCard.startFrame - card.endFrame;
        
        if (gap <= 16) { // Less than 1 second gap
          segment.transitionType = 'fade';
          segment.transitionDuration = gap;
        } else {
          segment.transitionType = 'cut';
        }
      }

      return segment;
    });
  }

  /**
   * Generate deck card list for specific animator version
   */
  static generateDeckCardList(
    mural: MuralManifest,
    animatorVersion: string
  ): {
    cards: CardManifest[];
    totalDuration: number;
    continuity: boolean;
  } {
    const versionCards = mural.cards.filter(card => card.animatorVersion === animatorVersion);
    const sortedCards = versionCards.sort((a, b) => a.startFrame - b.startFrame);
    
    // Check continuity
    let continuity = true;
    for (let i = 0; i < sortedCards.length - 1; i++) {
      if (sortedCards[i].endFrame !== sortedCards[i + 1].startFrame) {
        continuity = false;
        break;
      }
    }
    
    const totalDuration = sortedCards.reduce((sum, card) => sum + card.duration, 0);
    
    return {
      cards: sortedCards,
      totalDuration,
      continuity
    };
  }

  /**
   * Export mural manifest for IPFS storage
   */
  static exportManifest(mural: MuralManifest): string {
    return JSON.stringify(mural, null, 2);
  }
}

/**
 * Mural utilities
 */
export const MuralUtils = {
  /**
   * Calculate mural statistics
   */
  getStatistics(mural: MuralManifest) {
    const totalCards = mural.cards.length;
    const avgQuality = mural.cards.reduce((sum, card) => sum + card.metadata.qcScore, 0) / totalCards;
    const holographicCards = mural.cards.filter(card => card.layers.depthMapCid).length;
    const adAnchors = mural.cards.reduce((sum, card) => sum + (card.adAnchors?.length || 0), 0);
    
    return {
      totalCards,
      totalDuration: mural.totalDuration,
      avgQuality: Math.round(avgQuality * 100),
      holographicCards,
      holographicPercentage: Math.round((holographicCards / totalCards) * 100),
      adAnchors,
      animatorVersions: mural.animatorVersions.length,
      isValid: mural.validation.isValid,
      errors: mural.validation.errors.length,
      warnings: mural.validation.warnings.length
    };
  },

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};