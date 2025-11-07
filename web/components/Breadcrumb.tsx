'use client';

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm mv-text-muted mb-6 overflow-x-auto">
      <Link href="/" className="hover:text-white transition-colors flex items-center space-x-1 flex-shrink-0">
        <span>◈</span>
        <span className="hidden sm:inline">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-white/30 flex-shrink-0">◆</span>
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-white transition-colors flex items-center space-x-1 flex-shrink-0"
            >
              {item.icon && <span>{item.icon}</span>}
              <span className="truncate max-w-[120px] sm:max-w-none">{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center space-x-1 text-white flex-shrink-0">
              {item.icon && <span>{item.icon}</span>}
              <span className="truncate max-w-[120px] sm:max-w-none">{item.label}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}