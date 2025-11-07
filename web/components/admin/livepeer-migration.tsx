'use client';

import React, { useState } from 'react';

interface LivepeerMigrationProps {
  userWallet?: string;
}

export default function LivepeerMigration({ userWallet }: LivepeerMigrationProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleImport = async (ipfsCid: string, name: string) => {
    setImporting(true);
    setResult('');
    
    try {
      const response = await fetch('/api/livepeer/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipfsCid,
          name,
          uploaderWallet: userWallet
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Import successful! Playback ID: ${data.playbackId}`);
      } else {
        setResult(`❌ Import failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  const testVideo = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'; // Test video CID

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Livepeer Migration</h3>
      
      <div className="space-y-4">
        <button
          onClick={() => handleImport(testVideo, 'Test Video')}
          disabled={importing}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black px-4 py-2 rounded font-medium"
        >
          {importing ? 'Importing...' : 'Import Test Video'}
        </button>
        
        {result && (
          <div className="p-3 bg-black/20 rounded border border-white/10">
            <pre className="text-sm text-white whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}