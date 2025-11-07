'use client';

import React, { useState } from 'react';
import { ipfsDiagnostic } from '../../utils/debug/ipfs-diagnostic';
import TestStorage from './test-storage';

export default function DebugPage() {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const result = await ipfsDiagnostic.runFullDiagnostic();
      setDiagnostic(result);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="mv-heading-xl mb-8">🔍 IPFS Storage Diagnostic</h1>
      
      <div className="mb-8">
        <TestStorage />
      </div>
      
      <div className="mb-8">
        <a href="/debug/recovery" className="mv-button">
          🔧 Data Recovery Tool
        </a>
      </div>
      
      <button 
        onClick={runDiagnostic}
        disabled={loading}
        className="mv-button mb-8"
      >
        {loading ? 'Running Diagnostic...' : 'Run Full Diagnostic'}
      </button>

      {diagnostic && (
        <div className="space-y-6">
          <div className="mv-card p-6">
            <h2 className="mv-heading-md mb-4">📱 LocalStorage Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm mv-text-muted">Exists:</span>
                <div className={diagnostic.localStorage.exists ? 'text-green-400' : 'text-red-400'}>
                  {diagnostic.localStorage.exists ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div>
                <span className="text-sm mv-text-muted">Size:</span>
                <div>{diagnostic.localStorage.size} bytes</div>
              </div>
            </div>
          </div>

          <div className="mv-card p-6">
            <h2 className="mv-heading-md mb-4">🌐 IPFS Connectivity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm mv-text-muted">Gateway:</span>
                <div className="break-all">{diagnostic.ipfsConnectivity.gateway}</div>
              </div>
              <div>
                <span className="text-sm mv-text-muted">Status:</span>
                <div className={diagnostic.ipfsConnectivity.accessible ? 'text-green-400' : 'text-red-400'}>
                  {diagnostic.ipfsConnectivity.accessible ? '✅ Accessible' : '❌ Failed'}
                </div>
              </div>
            </div>
          </div>

          <div className="mv-card p-6">
            <h2 className="mv-heading-md mb-4">📦 Assets Data Store</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <span className="text-sm mv-text-muted">CID:</span>
                <div className="break-all font-mono text-sm">{diagnostic.dataStore.assets.cid}</div>
              </div>
              <div>
                <span className="text-sm mv-text-muted">Accessible:</span>
                <div className={diagnostic.dataStore.assets.accessible ? 'text-green-400' : 'text-red-400'}>
                  {diagnostic.dataStore.assets.accessible ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div>
                <span className="text-sm mv-text-muted">Count:</span>
                <div>{diagnostic.dataStore.assets.count} assets</div>
              </div>
            </div>

            {diagnostic.dataStore.assets.items.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-auto">
                {diagnostic.dataStore.assets.items.map((asset: any, index: number) => (
                  <div key={index} className="bg-white/5 p-3 rounded border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="mv-text-muted">Name:</span>
                        <div>{asset.name}</div>
                      </div>
                      <div>
                        <span className="mv-text-muted">Type:</span>
                        <div>{asset.type}</div>
                      </div>
                      <div>
                        <span className="mv-text-muted">Status:</span>
                        <div className={asset.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}>
                          {asset.status}
                        </div>
                      </div>
                      <div>
                        <span className="mv-text-muted">Uploaded:</span>
                        <div>{asset.uploadedAt ? new Date(asset.uploadedAt).toLocaleString() : 'Unknown'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mv-card p-6">
            <h2 className="mv-heading-md mb-4">📅 Today's Uploads</h2>
            {diagnostic.todaysUploads.length === 0 ? (
              <div className="text-center py-8 mv-text-muted">
                No uploads found for today
              </div>
            ) : (
              <div className="space-y-2">
                {diagnostic.todaysUploads.map((upload: any, index: number) => (
                  <div key={index} className="bg-green-900/20 border border-green-400/20 rounded p-3">
                    <div>{upload.name} - {upload.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}