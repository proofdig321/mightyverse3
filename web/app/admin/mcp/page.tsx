'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';

interface MCPStatus {
  mcp_integration: string;
  missions: any[];
  agents: any;
  ready_missions: any[];
  timestamp: string;
}

export default function MCPDashboard() {
  const { isAdmin } = useRBAC();
  const [status, setStatus] = useState<MCPStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMCPStatus();
  }, []);

  const fetchMCPStatus = async () => {
    try {
      const response = await fetch('/api/mcp/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch MCP status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mv-card p-8 text-center">
          <h1 className="mv-heading-lg text-red-400 mb-4">Access Denied</h1>
          <p className="mv-text-muted">Admin privileges required for MCP dashboard</p>
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">◈ MCP Control Center ◈</h1>
        <p className="mv-text-muted text-lg">Model Context Protocol - Vercel Integration</p>
      </div>

      <div className="mv-card p-6 mb-8">
        <h2 className="mv-heading-md mb-4">Integration Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <div className="mv-text-muted text-sm">Deployment</div>
            <div className="text-green-400 font-semibold">{status?.mcp_integration}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="mv-text-muted text-sm">Agents</div>
            <div className="text-green-400 font-semibold">{Object.keys(status?.agents || {}).length}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="mv-text-muted text-sm">Missions</div>
            <div className="text-green-400 font-semibold">{status?.missions?.length || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="mv-text-muted text-sm">Ready</div>
            <div className="text-yellow-400 font-semibold">{status?.ready_missions?.length || 0}</div>
          </div>
        </div>
      </div>

      <div className="mv-card p-6 mb-8">
        <h2 className="mv-heading-md mb-4">Mission Status</h2>
        <div className="space-y-4">
          {status?.missions?.map((mission) => (
            <div key={mission.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h3 className="font-semibold text-white">{mission.name}</h3>
                <p className="text-sm mv-text-muted">Agent: {mission.agent}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  mission.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                  mission.status === 'active' ? 'bg-yellow-400/20 text-yellow-400' :
                  mission.status === 'blocked' ? 'bg-red-400/20 text-red-400' :
                  'bg-gray-400/20 text-gray-400'
                }`}>
                  {mission.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mv-card p-6">
        <h2 className="mv-heading-md mb-4">Agent Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(status?.agents || {}).map(([name, agent]: [string, any]) => (
            <div key={name} className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{name}</h3>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
              <p className="text-sm mv-text-muted">{agent.mission}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}