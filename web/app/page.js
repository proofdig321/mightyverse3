import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 mv-fade-in">
          <h1 className="mv-heading-xl mb-6">◈ The Mighty Verse ◈</h1>
          <p className="mv-text-muted text-xl mb-8 max-w-3xl mx-auto">
            2.5D Holographic Animation Platform
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/animations">
              <button className="mv-button text-lg px-8 py-4">
                ◈ Watch Animations ◈
              </button>
            </Link>
            <Link href="/murals">
              <button className="mv-button-secondary text-lg px-8 py-4">
                ◉ Explore Murals ◉
              </button>
            </Link>
            <Link href="/auth/connect">
              <button className="mv-button-secondary text-lg px-8 py-4">
                ◆ Creator Access ◆
              </button>
            </Link>
          </div>
        </div>

        {/* Main Navigation - Aligned with Playbook */}
        <div className="mv-grid-responsive mb-8 sm:mb-16">
          <Link href="/murals">
            <div className="mv-card mv-holographic p-8 text-center cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">◉</div>
              <h3 className="mv-heading-md mb-2">Murals</h3>
              <p className="mv-text-muted">2.5D cinematic card deck experiences</p>
            </div>
          </Link>

          <Link href="/campaigns">
            <div className="mv-card mv-holographic p-8 text-center cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">◇</div>
              <h3 className="mv-heading-md mb-2">Campaigns</h3>
              <p className="mv-text-muted">Live sponsor activations and featured collabs</p>
            </div>
          </Link>

          <Link href="/animations">
            <div className="mv-card mv-holographic p-8 text-center cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">◈</div>
              <h3 className="mv-heading-md mb-2">Animations</h3>
              <p className="mv-text-muted">Gallery of 2.5D holographic pieces</p>
            </div>
          </Link>

          <Link href="/milestones">
            <div className="mv-card mv-holographic p-8 text-center cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">◆</div>
              <h3 className="mv-heading-md mb-2">Milestones</h3>
              <p className="mv-text-muted">Golden Shovel eras: Cassettes → CDs → Digital</p>
            </div>
          </Link>

          <Link href="/animator">
            <div className="mv-card mv-holographic p-8 text-center cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">◯</div>
              <h3 className="mv-heading-md mb-2">Animator Portal</h3>
              <p className="mv-text-muted">Create and submit holographic content</p>
            </div>
          </Link>

          <Link href="/admin">
            <div className="mv-card mv-holographic p-8 text-center cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">⬟</div>
              <h3 className="mv-heading-md mb-2">Admin Dashboard</h3>
              <p className="mv-text-muted">Platform administration and RBAC</p>
            </div>
          </Link>
        </div>

        {/* Featured: Golden Shovel Legacy */}
        <div className="mv-card mv-holographic p-12 text-center">
          <div className="text-8xl mb-6 animate-pulse">🎵</div>
          <h2 className="mv-heading-lg mb-4">The Mighty Verse</h2>
          <p className="mv-text-muted text-lg mb-8">
            Experience 2.5D holographic animations and immersive storytelling
          </p>
          <Link href="/murals">
            <button className="mv-button-secondary text-lg px-8 py-4">
              Experience the Verse
            </button>
          </Link>
        </div>
    </div>
  );
}