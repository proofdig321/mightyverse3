'use client';

import React, { useState } from 'react';
import { dataRecovery } from '../../utils/debug/recovery-tool';
import { dataManager } from '../../utils/storage/data-store';

export default function RecoveryPage() {
  const [results, setResults] = useState<any>(null);
  const [testCid, setTestCid] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runRecovery = async () => {
    setLoading(true);
    try {
      const result = await dataRecovery.searchForData();
      setResults(result);
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSpecificCid = async () => {
    if (!testCid.trim()) return;
    
    setLoading(true);
    try {
      const result = await dataRecovery.testCID(testCid.trim());
      setTestResult(result);
    } catch (error) {
      console.error('CID test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTestAsset = async () => {
    try {
      const testAsset = dataRecovery.generateTestAsset();
      await dataManager.addItem('assets', testAsset);
      alert('Test asset added! Check /animations page');
    } catch (error) {
      console.error('Failed to add test asset:', error);
      alert('Failed to add test asset');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🔧 Data Recovery Tool</h1>
      
      <div className="space-y-6">
        {/* Recovery Search */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Search for Lost Data</h2>
          <button 
            onClick={runRecovery}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            {loading ? 'Searching...' : 'Search Known CIDs'}
          </button>
          
          {results && (
            <div className="mt-4">
              <pre className="text-sm bg-black p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test Specific CID */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Specific CID</h2>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={testCid}
              onChange={(e) => setTestCid(e.target.value)}
              placeholder="Enter IPFS CID to test..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
            <button 
              onClick={testSpecificCid}
              disabled={loading || !testCid.trim()}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
            >
              Test CID
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4">
              <div className={`p-3 rounded ${testResult.accessible ? 'bg-green-900' : 'bg-red-900'}`}>
                <div className="font-semibold">
                  {testResult.accessible ? '✅ Accessible' : '❌ Not Accessible'}
                </div>
                {testResult.error && (
                  <div className="text-red-400 text-sm mt-1">{testResult.error}</div>
                )}
                {testResult.data && (
                  <div className="mt-2">
                    <div className="text-sm">
                      Type: {testResult.isArray ? 'Array' : 'Object'} | 
                      Length: {testResult.length} | 
                      Has Assets: {testResult.hasAssets ? 'Yes' : 'No'}
                    </div>
                    <pre className="text-xs bg-black p-2 rounded mt-2 overflow-auto max-h-32">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Test Asset */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Upload System</h2>
          <p className="text-gray-400 text-sm mb-4">
            Add a test asset to verify the upload system is working
          </p>
          <button 
            onClick={addTestAsset}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white"
          >
            Add Test Asset
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📋 Recovery Instructions</h2>
          <div className="text-sm space-y-2">
            <p><strong>What happened:</strong> Your data store was reset to empty arrays</p>
            <p><strong>Possible causes:</strong> LocalStorage cleared, browser reset, or initialization error</p>
            <p><strong>Recovery options:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Check browser history for IPFS CIDs</li>
              <li>Look in browser developer tools Network tab for recent CIDs</li>
              <li>Check Pinata dashboard for recent pins</li>
              <li>Re-upload your animation (recommended)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}