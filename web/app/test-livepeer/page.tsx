'use client';

import MediaRenderer from '../../components/media/media-renderer';
import LivepeerMigration from '../../components/admin/livepeer-migration';

export default function TestLivepeerPage() {
  const testCid = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn';

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white">Livepeer Integration Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Video Player</h2>
            <MediaRenderer 
              fileCid={testCid}
              mimeType="video/mp4"
              fileName="test-video.mp4"
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Migration Controls</h2>
            <LivepeerMigration userWallet="0x860Ec697167Ba865DdE1eC9e172004100613e970" />
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Migration Status</h3>
          <div className="space-y-2 text-sm">
            <div className="text-green-400">✅ Supabase client configured</div>
            <div className="text-green-400">✅ Livepeer API routes created</div>
            <div className="text-green-400">✅ MediaRenderer enhanced with fallback</div>
            <div className="text-yellow-400">⏳ Test video import pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}