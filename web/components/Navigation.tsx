'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRBAC } from '../app/auth/rbac-provider';
import { clearSession } from '../utils/auth/simple-auth';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { wallet, isAdmin, isAnimator } = useRBAC();

  const mainNavItems = [
    { href: '/murals', label: 'Murals', icon: '◉' },
    { href: '/campaigns', label: 'Campaigns', icon: '◇' },
    { href: '/animations', label: 'Animations', icon: '◈' },
    { href: '/milestones', label: 'Milestones', icon: '◆' },
  ];

  const userNavItems = [
    ...(isAnimator || isAdmin ? [{ href: '/animator', label: 'Animator', icon: '◯' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: '⬟' }] : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="mv-card mx-4 mt-4 sticky top-4 z-50 backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">◈</div>
              <div className="hidden sm:block">
                <div className="mv-heading-md">The Mighty Verse</div>
                <div className="mv-text-muted text-xs">2.5D Holographic Platform</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {mainNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 ${
                    isActive(item.href) 
                      ? 'bg-gradient-to-r from-yellow-400/20 to-green-400/20 text-yellow-400' 
                      : 'hover:bg-white/10 mv-text-muted hover:text-white'
                  }`}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center space-x-3">
              {/* User Menu */}
              {wallet && (
                <div className="hidden sm:flex items-center space-x-2">
                  {userNavItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center space-x-1 ${
                        isActive(item.href) 
                          ? 'bg-gradient-to-r from-yellow-400/20 to-green-400/20 text-yellow-400' 
                          : 'hover:bg-white/10 mv-text-muted hover:text-white'
                      }`}>
                        <span>{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Connect/Disconnect Button */}
              {wallet ? (
                <button
                  onClick={() => {
                    clearSession();
                    window.location.reload();
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-700 border-0 rounded-lg py-2 px-4 text-white font-medium text-sm"
                >
                  <span className="hidden sm:inline">Disconnect</span>
                  <span className="sm:hidden">◇</span>
                </button>
              ) : (
                <Link href="/auth/connect">
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 border-0 rounded-lg py-2 px-4 text-white font-medium text-sm">
                    <span className="hidden sm:inline">Connect</span>
                    <span className="sm:hidden">◈</span>
                  </button>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className={`w-5 h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                  <div className={`w-5 h-0.5 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
                  <div className={`w-5 h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 pb-4 border-t border-white/10">
            <div className="space-y-2 mt-4">
              {mainNavItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                    isActive(item.href) 
                      ? 'bg-gradient-to-r from-yellow-400/20 to-green-400/20 text-yellow-400' 
                      : 'hover:bg-white/10 mv-text-muted hover:text-white'
                  }`}>
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              ))}
              
              {wallet && userNavItems.length > 0 && (
                <>
                  <div className="border-t border-white/10 my-3"></div>
                  {userNavItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                        isActive(item.href) 
                          ? 'bg-gradient-to-r from-yellow-400/20 to-green-400/20 text-yellow-400' 
                          : 'hover:bg-white/10 mv-text-muted hover:text-white'
                      }`}>
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}