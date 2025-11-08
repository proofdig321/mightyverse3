'use client';

import { useState } from 'react';
import { validateCID } from '../../../utils/storage/cid-validator';

interface Asset {
  id: string;
  name: string;
  file_cid: string;
  thumbnail_cid?: string;
}

interface ValidationIssue {
  asset: Asset;
  field: 'file_cid' | 'thumbnail_cid';
  issue: string;
  suggestion?: string;
}

export default function CIDCleanupPage() {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const scanDatabase = async () => {
    setScanning(true);
    setIssues([]);

    try {
      const response = await fetch('/api/assets');
      const result = await response.json();
      const assets: Asset[] = result.data || result;
      
      const foundIssues: ValidationIssue[] = [];

      assets.forEach(asset => {
        // Check file_cid
        if (asset.file_cid) {
          const validation = validateCID(asset.file_cid);
          if (!validation.isValid) {
            foundIssues.push({
              asset,
              field: 'file_cid',
              issue: validation.error || 'Invalid CID',
              suggestion: validation.suggestion
            });
          }
        }

        // Check thumbnail_cid
        if (asset.thumbnail_cid) {
          const validation = validateCID(asset.thumbnail_cid);
          if (!validation.isValid) {
            foundIssues.push({
              asset,
              field: 'thumbnail_cid',
              issue: validation.error || 'Invalid CID',
              suggestion: validation.suggestion
            });
          }
        }
      });

      setIssues(foundIssues);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const fixIssue = async (issue: ValidationIssue, newCid: string) => {
    setLoading(true);
    try {
      const validation = validateCID(newCid);
      if (!validation.isValid) {
        alert(`Invalid replacement CID: ${validation.error}`);
        return;
      }

      const response = await fetch(`/api/assets/${issue.asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [issue.field]: newCid
        })
      });

      if (response.ok) {
        setIssues(prev => prev.filter(i => 
          !(i.asset.id === issue.asset.id && i.field === issue.field)
        ));
        alert('CID fixed successfully!');
      } else {
        alert('Failed to fix CID');
      }
    } catch (error) {
      console.error('Fix failed:', error);
      alert('Failed to fix CID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CID Cleanup Tool</h1>
        
        <div className="mb-8">
          <button
            onClick={scanDatabase}
            disabled={scanning}
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Scan Database for CID Issues'}
          </button>
        </div>

        {issues.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Found {issues.length} CID Issues
            </h2>
            
            {issues.map((issue, index) => (
              <div key={`${issue.asset.id}-${issue.field}`} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{issue.asset.name}</h3>
                    <p className="text-sm text-gray-400">Asset ID: {issue.asset.id}</p>
                  </div>
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm">
                    {issue.field}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-red-400 mb-2">Issue: {issue.issue}</p>
                  {issue.suggestion && (
                    <p className="text-yellow-400 mb-2">Suggestion: {issue.suggestion}</p>
                  )}
                  <p className="text-sm text-gray-400 font-mono break-all">
                    Current CID: {issue.asset[issue.field]}
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter corrected CID"
                    className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          fixIssue(issue, input.value.trim());
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                      if (input?.value.trim()) {
                        fixIssue(issue, input.value.trim());
                      }
                    }}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm disabled:opacity-50"
                  >
                    Fix
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {issues.length === 0 && !scanning && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl">No CID issues found!</p>
          </div>
        )}
      </div>
    </div>
  );
}