'use client';

import React from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import IntegratedDemoHub from '../../../components/admin/integrated-demo-hub';
import ContextualBreadcrumb from '../../../components/admin/contextual-breadcrumb';
import Link from 'next/link';

export default function DemoIntegrationPage() {
  const { isAdmin, loading } = useRBAC();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ContextualBreadcrumb />
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">🎯 Demo Integration Hub</h1>
        <p className="mv-text-muted text-lg mb-6">
          Comprehensive integration of all demo functionality into the main platform
        </p>
        
        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link href="/admin" className="mv-button-secondary">
            ← Back to Admin
          </Link>
          <Link href="/campaigns/demo" className="mv-button-secondary">
            Original Campaign Demo
          </Link>
          <Link href="/campaigns/dashboard" className="mv-button-secondary">
            Campaign Dashboard
          </Link>
          <Link href="/murals" className="mv-button-secondary">
            Murals Gallery
          </Link>
          <Link href="/deck/demo" className="mv-button-secondary">
            3D Deck Viewer
          </Link>
        </div>
      </div>

      {/* Integration Overview */}
      <div className="mv-card mv-holographic p-8 mb-8">
        <h2 className="mv-heading-lg mb-6 text-center">🚀 Integration Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">✓</span>
            </div>
            <h3 className="font-semibold mb-2">Campaign Management</h3>
            <p className="text-sm mv-text-muted">Integrated into admin dashboard with real-time updates</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">✓</span>
            </div>
            <h3 className="font-semibold mb-2">Asset Preview</h3>
            <p className="text-sm mv-text-muted">Enhanced with 3D and holographic viewing modes</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">✓</span>
            </div>
            <h3 className="font-semibold mb-2">Mural Assembly</h3>
            <p className="text-sm mv-text-muted">Timeline visualization and card management</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-400 to-purple-400 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">✓</span>
            </div>
            <h3 className="font-semibold mb-2">Timeline Editor</h3>
            <p className="text-sm mv-text-muted">Real server persistence with MCP coordination</p>
          </div>
        </div>
      </div>

      {/* Full Demo Hub */}
      <IntegratedDemoHub mode="full" />

      {/* Technical Details */}
      <div className="mv-card p-6 mt-8">
        <h3 className="mv-heading-md mb-4">🔧 Technical Integration Details</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">✅ Completed Integrations</h4>
            <ul className="space-y-2 text-sm mv-text-muted">
              <li>• Campaign management widget in admin dashboard</li>
              <li>• Enhanced asset preview with 3D/holographic modes</li>
              <li>• Mural assembly with timeline visualization</li>
              <li>• Timeline editor with server persistence</li>
              <li>• Real-time data synchronization</li>
              <li>• MCP content analysis integration</li>
              <li>• Responsive design system compliance</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">🚀 Enhanced Features</h4>
            <ul className="space-y-2 text-sm mv-text-muted">
              <li>• Real database persistence (Supabase + localStorage)</li>
              <li>• WebSocket real-time updates</li>
              <li>• AI-powered content curation</li>
              <li>• Drag-and-drop timeline editing</li>
              <li>• Multi-version mural support</li>
              <li>• 3D asset positioning</li>
              <li>• Holographic preview modes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="mv-card p-6 mt-6">
        <h3 className="mv-heading-md mb-4">🔗 New API Endpoints</h3>
        
        <div className="bg-black/20 rounded-xl p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <div className="text-green-400 mb-2">Timeline Management:</div>
              <div className="mv-text-muted space-y-1">
                <div>PATCH /api/streams/[id]/placements/[placementId]</div>
                <div>DELETE /api/streams/[id]/placements/[placementId]</div>
                <div>GET /api/campaigns/[id]/timeline</div>
                <div>PUT /api/campaigns/[id]/timeline</div>
              </div>
            </div>
            
            <div>
              <div className="text-blue-400 mb-2">Content Curation:</div>
              <div className="mv-text-muted space-y-1">
                <div>POST /api/agents/content-curation</div>
                <div>GET /api/admin/processing-jobs</div>
                <div>POST /api/admin/mcp-analysis</div>
                <div>GET /api/admin/system-status</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}