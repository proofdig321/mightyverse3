/**
 * Livepeer Orchestrator - Enterprise Stream Management
 * Handles stream creation, recording, and manifest management
 */

export interface StreamConfig {
  name: string;
  profiles?: TranscodingProfile[];
  record?: boolean;
  recordingSpec?: {
    profiles: string[];
  };
}

export interface TranscodingProfile {
  name: string;
  bitrate: number;
  fps: number;
  width: number;
  height: number;
  quality?: number;
}

export interface StreamSession {
  id: string;
  streamId: string;
  playbackId: string;
  rtmpIngestUrl: string;
  status: 'idle' | 'active' | 'recording';
  recordingUrl?: string;
  manifestCid?: string;
  createdAt: string;
}

export class LivepeerOrchestrator {
  private apiKey: string;
  private baseUrl = 'https://livepeer.studio/api';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LIVEPEER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Livepeer API key not configured - running in stub mode');
    }
  }
  
  async createStream(config: StreamConfig): Promise<StreamSession> {
    if (!this.apiKey) {
      return this.createStubStream(config);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: config.name,
          profiles: config.profiles || this.getDefaultProfiles(),
          record: config.record || true,
          recordingSpec: config.recordingSpec
        })
      });
      
      if (!response.ok) {
        throw new Error(`Livepeer stream creation failed: ${response.statusText}`);
      }
      
      const stream = await response.json();
      
      return {
        id: stream.id,
        streamId: stream.id,
        playbackId: stream.playbackId,
        rtmpIngestUrl: stream.rtmpIngestUrl,
        status: 'idle',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Livepeer stream creation failed:', error);
      return this.createStubStream(config);
    }
  }
  
  private createStubStream(config: StreamConfig): StreamSession {
    const id = `stub_${Date.now()}`;
    return {
      id,
      streamId: id,
      playbackId: `playback_${id}`,
      rtmpIngestUrl: `rtmp://stub.livepeer.studio/live/${id}`,
      status: 'idle',
      createdAt: new Date().toISOString()
    };
  }
  
  async getStreamStatus(streamId: string): Promise<StreamSession | null> {
    if (!this.apiKey) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/stream/${streamId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      if (!response.ok) return null;
      
      const stream = await response.json();
      
      return {
        id: stream.id,
        streamId: stream.id,
        playbackId: stream.playbackId,
        rtmpIngestUrl: stream.rtmpIngestUrl,
        status: stream.isActive ? 'active' : 'idle',
        recordingUrl: stream.recordingUrl,
        createdAt: stream.createdAt
      };
    } catch (error) {
      console.error('Failed to get stream status:', error);
      return null;
    }
  }
  
  async getRecordings(streamId: string): Promise<any[]> {
    if (!this.apiKey) {
      return [];
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/stream/${streamId}/sessions`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      if (!response.ok) return [];
      
      const sessions = await response.json();
      return sessions.filter((session: any) => session.recordingUrl);
    } catch (error) {
      console.error('Failed to get recordings:', error);
      return [];
    }
  }
  
  private getDefaultProfiles(): TranscodingProfile[] {
    return [
      { name: '720p', bitrate: 2000000, fps: 30, width: 1280, height: 720 },
      { name: '480p', bitrate: 1000000, fps: 30, width: 854, height: 480 },
      { name: '360p', bitrate: 500000, fps: 30, width: 640, height: 360 }
    ];
  }
  
  async deleteStream(streamId: string): Promise<boolean> {
    if (!this.apiKey) {
      return true; // Stub mode
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/stream/${streamId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to delete stream:', error);
      return false;
    }
  }
}

export const livepeerOrchestrator = new LivepeerOrchestrator();