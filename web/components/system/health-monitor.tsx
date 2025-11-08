'use client';

import React, { useState, useEffect } from 'react';

interface SystemHealth {
  overall: string;
  database: {
    connected: boolean;
    mode: string;
    issues: string[];
  };
  gateways: {
    ipfs: number;
    livepeer: number;
    total_active: number;
  };
  cache: {
    tables: number;
    size: number;
  };
  timestamp: string;
}

export default function HealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/system/health');
      const data = await response.json();
      setHealth(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSchemaSync = async () => {
    try {
      const response = await fetch('/api/mcp/sync', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        alert(`Schema sync completed: ${result.changes.length} changes applied`);
        checkHealth(); // Refresh health status
      } else {
        alert(`Schema sync failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      alert('Schema sync request failed');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-4">
        <div className="animate-pulse">System health loading...</div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="text-red-400">Health check unavailable</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'degraded': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">System Health</h3>
        <div className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(health.overall)}`}>
          {health.overall}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Database Status */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm font-medium text-white mb-2">Database</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className={health.database.connected ? 'text-green-400' : 'text-yellow-400'}>
                {health.database.mode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Issues:</span>
              <span className={health.database.issues.length > 0 ? 'text-red-400' : 'text-green-400'}>
                {health.database.issues.length}
              </span>
            </div>
          </div>
          {health.database.issues.length > 0 && (
            <button
              onClick={triggerSchemaSync}
              className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Sync Schema
            </button>
          )}
        </div>

        {/* Gateway Status */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm font-medium text-white mb-2">Gateways</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">IPFS:</span>
              <span className="text-green-400">{health.gateways.ipfs} active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Livepeer:</span>
              <span className="text-green-400">{health.gateways.livepeer} active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="text-green-400">{health.gateways.total_active}</span>
            </div>
          </div>
        </div>

        {/* Cache Status */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm font-medium text-white mb-2">Cache</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Tables:</span>
              <span className="text-blue-400">{health.cache.tables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="text-blue-400">{health.cache.size}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}