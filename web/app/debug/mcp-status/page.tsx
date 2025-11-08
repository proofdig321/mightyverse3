'use client';

import { useState, useEffect } from 'react';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';

export default function MCPStatusPage() {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    try {
      const health = await enhancedDataManager.getSystemHealth();
      setSystemHealth(health);
      console.log('MCP System Health:', health);
    } catch (error) {
      console.error('Failed to load system health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-6xl">◈</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">MCP System Status</h1>
      
      <div className="space-y-6">
        {/* Cache Info */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Data Store Status</h2>
          <pre className="text-sm bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify(systemHealth?.cache, null, 2)}
          </pre>
        </div>

        {/* Schema Health */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Schema Health</h2>
          <pre className="text-sm bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify(systemHealth?.schema, null, 2)}
          </pre>
        </div>

        {/* Gateway Status */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Gateway Status</h2>
          <pre className="text-sm bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify(systemHealth?.gateways, null, 2)}
          </pre>
        </div>

        {/* Content Integrity */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Content Integrity</h2>
          <pre className="text-sm bg-black/20 p-4 rounded overflow-auto">
            {JSON.stringify(systemHealth?.content, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}