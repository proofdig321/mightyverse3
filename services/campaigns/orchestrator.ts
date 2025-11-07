/**
 * Campaign Orchestrator Service - Enhanced with Real Database Integration
 * Manages campaign lifecycle and stream coordination with MCP coordination
 */

import { enhancedDataManager } from '../../web/utils/storage/enhanced-data-store';

export interface CampaignConfig {
  id?: string;
  name: string;
  streamId?: string;
  placements?: PlacementConfig[];
  sponsorId?: string;
  budget?: number;
  metadata?: any;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface PlacementConfig {
  id: string;
  startTime: number;
  duration: number;
  assetId: string;
  campaignId?: string;
  streamId?: string;
  status?: 'scheduled' | 'active' | 'completed';
}

export class CampaignOrchestrator {
  async createCampaign(config: CampaignConfig): Promise<CampaignConfig> {
    const campaign = await enhancedDataManager.createItem('campaigns', {
      name: config.name,
      sponsor_id: config.sponsorId,
      budget: config.budget || 0,
      status: 'draft',
      metadata: config.metadata || {},
      placements: []
    });
    
    // Trigger MCP content analysis
    await this.triggerMCPAnalysis(campaign.id, 'campaign', campaign);
    
    return {
      id: campaign.id,
      name: campaign.name,
      sponsorId: campaign.sponsor_id,
      budget: campaign.budget,
      status: campaign.status,
      metadata: campaign.metadata,
      created_at: campaign.created_at
    };
  }
  
  async getCampaign(campaignId: string): Promise<CampaignConfig | null> {
    const campaign = await enhancedDataManager.getItemById('campaigns', campaignId);
    if (!campaign) return null;
    
    return {
      id: campaign.id,
      name: campaign.name,
      sponsorId: campaign.sponsor_id,
      budget: campaign.budget,
      status: campaign.status,
      metadata: campaign.metadata
    };
  }
  
  async listCampaigns(limit: number = 50, offset: number = 0): Promise<CampaignConfig[]> {
    const campaigns = await enhancedDataManager.getData('campaigns');
    return campaigns.slice(offset, offset + limit).map(c => ({
      id: c.id,
      name: c.name,
      sponsorId: c.sponsor_id,
      status: c.status,
      budget: c.budget,
      created_at: c.created_at
    }));
  }
  
  async activateCampaign(campaignId: string): Promise<CampaignConfig> {
    const campaign = await enhancedDataManager.updateItem('campaigns', campaignId, {
      status: 'active',
      activated_at: new Date().toISOString()
    });
    
    // Trigger MCP workflow
    await this.triggerMCPAnalysis(campaignId, 'campaign_activation', campaign);
    
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sponsorId: campaign.sponsor_id
    };
  }
  
  async schedulePlacements(streamId: string, placements: PlacementConfig[]): Promise<PlacementConfig[]> {
    const results = [];
    
    for (const placement of placements) {
      const created = await enhancedDataManager.createItem('placements', {
        stream_id: streamId,
        campaign_id: placement.campaignId,
        asset_id: placement.assetId,
        start_time: placement.startTime,
        duration: placement.duration,
        status: 'scheduled'
      });
      
      // Trigger MCP content analysis for placement
      await this.triggerMCPAnalysis(created.id, 'placement', created);
      
      results.push({
        id: created.id,
        startTime: created.start_time,
        duration: created.duration,
        assetId: created.asset_id,
        status: created.status
      });
    }
    
    return results;
  }
  
  async listPlacements(streamId: string): Promise<PlacementConfig[]> {
    const placements = await enhancedDataManager.getData('placements');
    return placements
      .filter(p => p.stream_id === streamId)
      .map(p => ({
        id: p.id,
        startTime: p.start_time,
        duration: p.duration,
        assetId: p.asset_id,
        status: p.status
      }));
  }
  
  async createStreamSession(campaignId: string, config: { name: string; record: boolean }): Promise<any> {
    const session = await enhancedDataManager.createItem('stream_sessions', {
      campaign_id: campaignId,
      name: config.name,
      record: config.record,
      status: 'active',
      playback_url: `https://livepeer.studio/api/playback/session_${Date.now()}/index.m3u8`
    });
    
    return {
      id: session.id,
      name: session.name,
      campaignId: session.campaign_id,
      playbackUrl: session.playback_url,
      status: session.status
    };
  }
  
  async listStreamSessions(campaignId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const sessions = await enhancedDataManager.getData('stream_sessions');
    return sessions
      .filter(s => s.campaign_id === campaignId)
      .slice(offset, offset + limit)
      .map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        playbackUrl: s.playback_url,
        created_at: s.created_at
      }));
  }
  
  async getStreamSession(streamId: string): Promise<any> {
    const session = await enhancedDataManager.getItemById('stream_sessions', streamId);
    if (!session) return null;
    
    return {
      id: session.id,
      name: session.name,
      status: session.status,
      playbackUrl: session.playback_url,
      campaignId: session.campaign_id,
      created_at: session.created_at
    };
  }
  
  private async triggerMCPAnalysis(contentId: string, contentType: string, data: any) {
    try {
      await fetch('/api/agents/content-curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          action: 'analyze',
          metadata: data
        })
      });
    } catch (error) {
      console.warn('MCP analysis failed:', error);
    }
  }
}

export const campaignOrchestrator = new CampaignOrchestrator();

// Add missing tables to enhanced data manager
if (typeof window !== 'undefined') {
  // Initialize campaign-related tables in localStorage for fallback
  const tables = ['campaigns', 'stream_sessions', 'placements'];
  tables.forEach(table => {
    const key = `mighty_${table}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  });
}
