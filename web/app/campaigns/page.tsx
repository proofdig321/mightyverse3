'use client';

import Link from 'next/link';
import Breadcrumb from '../../components/Breadcrumb';

export default function Campaigns() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: 'Campaigns', icon: '◇' }
      ]} />
      <div className="text-center mb-8 sm:mb-16 mv-fade-in">
        <h1 className="mv-heading-xl mb-6">◇ Campaigns ◇</h1>
        <p className="mv-text-muted text-lg sm:text-xl mb-8">
          Live sponsor activations and featured collaborations
        </p>
      </div>

      <div className="mv-card mv-holographic p-6 sm:p-12 text-center">
        <div className="text-6xl sm:text-8xl mb-6">◇</div>
        <h2 className="mv-heading-lg mb-4">Campaign System</h2>
        <p className="mv-text-muted text-base sm:text-lg mb-8">
          Sponsor-driven campaigns with holographic brand placements in 2.5D space
        </p>
        <div className="text-sm mv-text-muted">
          Coming Soon - Campaign Builder & Sponsor Dashboard Integration
        </div>
      </div>
    </div>
  );
}