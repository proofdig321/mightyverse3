'use client';

import React, { useState, useEffect } from 'react';
import { dataManager } from '../../utils/storage/data-store';

export default function TestStorage() {
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const testStorage = async () => {
      try {
        // Check localStorage directly
        const localStorage_data = typeof window !== 'undefined' ? localStorage.getItem('mv-data-store') : null;
        
        // Try to get assets
        const assets = await dataManager.getData('assets');
        
        // Get store info
        const store = await dataManager.getStore();
        
        setResults({
          localStorage_exists: !!localStorage_data,
          localStorage_raw: localStorage_data,
          assets_count: assets.length,
          assets_data: assets,
          store_cids: store,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setResults({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    };

    testStorage();
  }, []);

  if (!results) {
    return <div>Loading storage test...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Storage Test Results</h1>
      
      <div className="bg-gray-900 p-4 rounded-lg">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
      
      {results.assets_data && results.assets_data.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Found Assets ({results.assets_data.length})</h2>
          <div className="space-y-2">
            {results.assets_data.map((asset: any, index: number) => (
              <div key={index} className="bg-gray-800 p-3 rounded">
                <div className="font-semibold">{asset.name}</div>
                <div className="text-sm text-gray-400">
                  Type: {asset.type} | Status: {asset.status} | 
                  Uploaded: {asset.uploadedAt ? new Date(asset.uploadedAt).toLocaleString() : 'Unknown'}
                </div>
                {asset.fileCid && (
                  <div className="text-xs text-blue-400 mt-1">
                    CID: {asset.fileCid}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}