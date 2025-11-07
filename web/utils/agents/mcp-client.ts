/**
 * MCP Agent Client - Vercel Integration
 * Coordinates with deployed agent endpoints
 */

const AGENT_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || '/api';

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  agent: string;
  timestamp: string;
}

export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl = AGENT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async assetReview(asset: any): Promise<AgentResponse> {
    return this.callAgent('asset-review', { asset });
  }

  async generateMetadata(asset: any, context?: any): Promise<AgentResponse> {
    return this.callAgent('metadata-gen', { asset, context });
  }

  async requestMintApproval(asset: any, metadata: any): Promise<AgentResponse> {
    return this.callAgent('mint-approval', { asset, metadata });
  }

  async manageCampaign(campaign: any, assets?: any[]): Promise<AgentResponse> {
    return this.callAgent('campaigns', { campaign, assets });
  }

  async updateRoles(wallet: string, roles: string[], action = 'assign'): Promise<AgentResponse> {
    return this.callAgent('rbac', { wallet, roles, action });
  }

  async getAgentStatus(): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/status`);
      const data = await response.json();
      return { success: true, data, agent: 'status', timestamp: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: 'Status check failed', agent: 'status', timestamp: new Date().toISOString() };
    }
  }

  private async callAgent(agent: string, payload: any): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      return { success: response.ok, data, agent, timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Agent call failed',
        agent,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const mcpClient = new MCPClient();