'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { href: '/murals', label: 'Murals' },
        { href: '/campaigns', label: 'Campaigns' },
        { href: '/animations', label: 'Animations' },
        { href: '/milestones', label: 'Milestones' },
      ]
    },
    {
      title: 'Creators',
      links: [
        { href: '/animator', label: 'Animator Portal' },
        { href: '/animator/upload', label: 'Upload Assets' },
        { href: '/animator/submissions', label: 'Submissions' },
      ]
    },
    {
      title: 'Community',
      links: [
        { href: '#', label: 'Discord' },
        { href: '#', label: 'Twitter' },
        { href: '#', label: 'GitHub' },
        { href: '#', label: 'Documentation' },
      ]
    }
  ];

  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-3xl">◈</div>
              <div>
                <div className="mv-heading-md">The Mighty Verse</div>
                <div className="mv-text-muted text-sm">2.5D Holographic Platform</div>
              </div>
            </div>
            <p className="mv-text-muted text-sm mb-4 max-w-xs">
              Revolutionary platform for African heroes in the metaverse with holographic visualization and blockchain integration.
            </p>
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <span className="text-sm">◆</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <span className="text-sm">◈</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <span className="text-sm">◉</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mv-heading-md mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="mv-text-muted hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mv-card mv-holographic p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white mb-1">247</div>
              <div className="mv-text-muted text-sm">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">1.2K</div>
              <div className="mv-text-muted text-sm">Animations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">89</div>
              <div className="mv-text-muted text-sm">Murals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">15</div>
              <div className="mv-text-muted text-sm">Campaigns</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
          <div className="mv-text-muted text-sm mb-4 md:mb-0">
            © {currentYear} The Mighty Verse. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="#" className="mv-text-muted hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="mv-text-muted hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="mv-text-muted hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>

        {/* Holographic Accent */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 mv-text-muted text-xs">
            <span>◆</span>
            <span>Powered by 2.5D Holographic Technology</span>
            <span>◆</span>
          </div>
        </div>
      </div>
    </footer>
  );
}