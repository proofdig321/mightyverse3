'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export default function NavigationHeader({ 
  title, 
  subtitle, 
  backLink, 
  backLabel = 'Back to Dashboard',
  actions 
}: NavigationHeaderProps) {
  const pathname = usePathname();
  
  const getDashboardLink = () => {
    if (pathname.startsWith('/admin')) return '/admin';
    if (pathname.startsWith('/animator')) return '/animator';
    return '/';
  };

  return (
    <div className="mb-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm mv-text-muted mb-4">
        <Link href={getDashboardLink()} className="hover:text-yellow-400 transition-colors">
          {pathname.startsWith('/admin') ? 'Admin Dashboard' : 
           pathname.startsWith('/animator') ? 'Animator Dashboard' : 'Home'}
        </Link>
        <span>›</span>
        <span className="text-white">{title}</span>
      </div>

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="mv-heading-xl mb-2">{title}</h1>
          {subtitle && <p className="mv-text-muted text-lg">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-4">
          {backLink && (
            <Link href={backLink} className="mv-button-secondary">
              ← {backLabel}
            </Link>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}