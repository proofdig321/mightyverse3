'use client';

import React, { useState } from 'react';

export default function FixPage() {
  const [cid, setCid] = useState('');
  const [fixed, setFixed] = useState(false);

  const fixRegistry = () => {
    if (!cid.trim()) {
      alert('Please enter the full CID');
      return;
    }

    const store = {
      assets: cid.trim(),
      campaigns: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
      submissions: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
      sponsors: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
      users: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
      mintRequests: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
      roles: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ'
    };
    
    localStorage.setItem('mv-data-store', JSON.stringify(store));
    setFixed(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🔧 Fix Registry CID</h1>
      
      <div className="bg-red-900/20 border border-red-400/20 rounded p-4 mb-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">ANIMATION FOUND IN PINATA!</h2>
        <p className="text-sm">
          Your "Golden Shovel" animation (68.43 MB) is still in Pinata.<br/>
          System is using wrong assets-registry CID.
        </p>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Enter Correct CID</h2>
        <p className="text-sm text-gray-400 mb-4">
          Copy the full CID of the 1.09KB "assets-registry" from Pinata dashboard
        </p>
        
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            placeholder="Paste full CID here..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
          />
          <button 
            onClick={fixRegistry}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
          >
            Fix Registry
          </button>
        </div>
      </div>

      {fixed && (
        <div className="bg-green-900/20 border border-green-400/20 rounded p-4">
          <h2 className="text-lg font-semibold text-green-400 mb-2">✅ Fixed!</h2>
          <p>Go to <a href="/animations" className="text-blue-400 underline">/animations</a> to see your animation</p>
        </div>
      )}
    </div>
  );
}