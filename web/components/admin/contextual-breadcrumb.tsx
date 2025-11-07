'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: string;
}

export default function ContextualBreadcrumb() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/', icon: '◈' }
    ];

    // Admin paths
    if (segments[0] === 'admin') {
      breadcrumbs.push({ label: 'Admin Dashboard', href: '/admin', icon: '⬟' });
      
      if (segments[1] === 'assets') {
        breadcrumbs.push({ label: 'Enhanced Assets', href: '/admin/assets', icon: '📋' });
      } else if (segments[1] === 'demo-integration') {
        breadcrumbs.push({ label: 'Demo Integration Hub', href: '/admin/demo-integration', icon: '🎯' });
      } else if (segments[1] === 'campaigns') {
        breadcrumbs.push({ label: 'Campaign Management', href: '/admin/campaigns', icon: '📢' });
      }
    }
    
    // Campaign paths
    else if (segments[0] === 'campaigns') {
      breadcrumbs.push({ label: 'Campaigns', href: '/campaigns', icon: '◇' });
      
      if (segments[1] === 'demo') {
        breadcrumbs.push({ label: 'Campaign Demo', href: '/campaigns/demo', icon: '🎮' });
      } else if (segments[1] === 'dashboard') {
        breadcrumbs.push({ label: 'Campaign Dashboard', href: '/campaigns/dashboard', icon: '🎬' });
      }
    }
    
    // Mural paths
    else if (segments[0] === 'murals') {
      breadcrumbs.push({ label: 'Murals Gallery', href: '/murals', icon: '◈' });
    }
    
    // Deck paths
    else if (segments[0] === 'deck') {
      breadcrumbs.push({ label: '3D Deck Viewer', href: `/deck/${segments[1] || 'demo'}`, icon: '◉' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="mb-6">
      <div className="mv-card p-4">
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && (
                <span className="mv-text-muted">›</span>
              )}
              
              {index === breadcrumbs.length - 1 ? (
                <div className="flex items-center space-x-2 text-white font-medium">
                  {crumb.icon && <span>{crumb.icon}</span>}
                  <span>{crumb.label}</span>
                </div>
              ) : (
                <Link 
                  href={crumb.href}
                  className="flex items-center space-x-2 mv-text-muted hover:text-yellow-400 transition-colors"
                >
                  {crumb.icon && <span>{crumb.icon}</span>}
                  <span>{crumb.label}</span>
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Context Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <div className="text-xs mv-text-muted">
            {pathname.includes('/admin') && '🔧 Admin Area'}
            {pathname.includes('/campaigns') && '◇ Campaign Management'}
            {pathname.includes('/murals') && '◈ Holographic Experiences'}
            {pathname.includes('/deck') && '◉ 3D Visualization'}
          </div>
          
          <div className="flex space-x-2">
            {!pathname.includes('/admin/demo-integration') && (
              <Link href="/admin/demo-integration" className="text-xs mv-button-secondary px-2 py-1">
                Demo Hub
              </Link>
            )}
            {!pathname.includes('/admin') && pathname !== '/' && (
              <Link href="/admin" className="text-xs mv-button-secondary px-2 py-1">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}