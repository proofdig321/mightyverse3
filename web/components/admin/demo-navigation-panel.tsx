'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DemoFeature {
  id: string;
  title: string;
  icon: string;
  href: string;
  description: string;
  status: 'integrated' | 'original' | 'enhanced';
  category: 'admin' | 'public' | 'demo';
}

const demoFeatures: DemoFeature[] = [
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard',
    icon: '⬟',
    href: '/admin',
    description: 'Integrated campaign & mural widgets',
    status: 'integrated',
    category: 'admin'
  },
  {
    id: 'demo-hub',
    title: 'Demo Integration Hub',
    icon: '🎯',
    href: '/admin/demo-integration',
    description: 'Comprehensive demo showcase',
    status: 'integrated',
    category: 'admin'
  },
  {
    id: 'enhanced-assets',
    title: 'Enhanced Assets',
    icon: '📋',
    href: '/admin/assets',
    description: '3D & holographic preview modes',
    status: 'enhanced',
    category: 'admin'
  },
  {
    id: 'campaign-demo',
    title: 'Campaign Demo',
    icon: '◇',
    href: '/campaigns/demo',
    description: 'Original campaign creation flow',
    status: 'original',
    category: 'demo'
  },
  {
    id: 'campaign-dashboard',
    title: 'Campaign Dashboard',
    icon: '🎬',
    href: '/campaigns/dashboard',
    description: 'Timeline editor & session management',
    status: 'enhanced',
    category: 'demo'
  },
  {
    id: 'murals',
    title: 'Murals Gallery',
    icon: '◈',
    href: '/murals',
    description: 'Holographic mural experiences',
    status: 'enhanced',
    category: 'public'
  },
  {
    id: 'deck-viewer',
    title: '3D Deck Viewer',
    icon: '◉',
    href: '/deck/demo',
    description: '3D asset positioning & visualization',
    status: 'original',
    category: 'demo'
  }
];

export default function DemoNavigationPanel() {
  const pathname = usePathname();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'integrated': return 'bg-green-400/20 text-green-400 border-green-400/30';
      case 'enhanced': return 'bg-blue-400/20 text-blue-400 border-blue-400/30';
      case 'original': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      default: return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'admin': return '🔧 Admin Features';
      case 'public': return '🌟 Public Features';
      case 'demo': return '🎮 Demo Pages';
      default: return 'Features';
    }
  };

  const groupedFeatures = demoFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, DemoFeature[]>);

  return (
    <div className="mv-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="mv-heading-md">🧭 Demo Navigation</h3>
        <div className="flex space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="mv-text-muted">Integrated</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="mv-text-muted">Enhanced</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span className="mv-text-muted">Original</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedFeatures).map(([category, features]) => (
          <div key={category}>
            <h4 className="font-semibold mb-3 text-sm mv-text-muted">
              {getCategoryTitle(category)}
            </h4>
            
            <div className="space-y-2">
              {features.map((feature) => (
                <Link key={feature.id} href={feature.href}>
                  <div className={`p-3 rounded-xl border transition-all duration-300 hover:scale-102 ${
                    pathname === feature.href 
                      ? 'bg-white/10 border-white/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/8'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{feature.icon}</span>
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {feature.title}
                          </div>
                          <div className="text-xs mv-text-muted">
                            {feature.description}
                          </div>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(feature.status)}`}>
                        {feature.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin" className="mv-button-secondary text-center text-sm py-2">
            Admin Hub
          </Link>
          <Link href="/admin/demo-integration" className="mv-button text-center text-sm py-2">
            Demo Hub
          </Link>
        </div>
      </div>
    </div>
  );
}