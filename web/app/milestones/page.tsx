'use client';

import Link from 'next/link';
import Breadcrumb from '../../components/Breadcrumb';

export default function Milestones() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: 'Milestones', icon: '◆' }
      ]} />
      <div className="text-center mb-8 sm:mb-16 mv-fade-in">
        <h1 className="mv-heading-xl mb-6">◆ Milestones ◆</h1>
        <p className="mv-text-muted text-lg sm:text-xl mb-8">
          Golden Shovel eras: Cassettes → CDs → Digital
        </p>
      </div>

      <div className="mv-grid-responsive mb-8 sm:mb-16">
          <div className="mv-card mv-holographic p-8 text-center">
            <div className="text-6xl mb-4">📼</div>
            <h3 className="mv-heading-md mb-2">Cassette Era</h3>
            <p className="mv-text-muted">The analog foundation</p>
          </div>
          
          <div className="mv-card mv-holographic p-8 text-center">
            <div className="text-6xl mb-4">💿</div>
            <h3 className="mv-heading-md mb-2">CD Era</h3>
            <p className="mv-text-muted">Digital transition</p>
          </div>
          
          <div className="mv-card mv-holographic p-8 text-center">
            <div className="text-6xl mb-4">🔮</div>
            <h3 className="mv-heading-md mb-2">Metaverse Era</h3>
            <p className="mv-text-muted">Holographic future</p>
          </div>
        </div>

      <div className="mv-card mv-holographic p-6 sm:p-12 text-center">
        <div className="text-6xl sm:text-8xl mb-6">◆</div>
        <h2 className="mv-heading-lg mb-4">Golden Shovel Legacy Timeline</h2>
        <p className="mv-text-muted text-base sm:text-lg mb-8">
          Journey through the evolution of Golden Shovel's musical storytelling
        </p>
        <div className="text-sm mv-text-muted">
          Coming Soon - Interactive Timeline & Era Navigation
        </div>
      </div>
    </div>
  );
}