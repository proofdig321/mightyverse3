'use client';

import React from 'react';
import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div className="mighty-verse-app min-h-screen flex items-center justify-center">
      <div className="mv-card mv-holographic p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-6 text-red-400">⚠</div>
        <h1 className="mv-heading-lg mb-4">Access Denied</h1>
        <p className="mv-text-muted mb-8">
          You don't have permission to access this area of The Mighty Verse.
        </p>
        
        <div className="space-y-4">
          <Link href="/auth/connect">
            <button className="w-full mv-button">
              Connect Wallet
            </button>
          </Link>
          
          <Link href="/">
            <button className="w-full mv-button-secondary">
              Return Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}