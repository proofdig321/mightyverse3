'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { dataManager } from '../../../utils/storage/data-store';

interface MintRequest {
  id: string;
  assetName: string;
  assetType: string;
  creator: string;
  metadata: {
    title: string;
    description: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
  status: 'pending' | 'approved' | 'rejected' | 'minted';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export default function MintQueuePage() {
  const { isAdmin } = useRBAC();
  const [requests, setRequests] = useState<MintRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await dataManager.getData('mintRequests');
      setRequests(data);
    } catch (error) {
      console.error('Failed to load mint requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await dataManager.updateItem('mintRequests', id, {
        status: 'approved',
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString()
      });
      await loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await dataManager.updateItem('mintRequests', id, {
        status: 'rejected',
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString()
      });
      await loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleMint = async (id: string) => {
    try {
      await dataManager.updateItem('mintRequests', id, { status: 'minted' });
      await loadRequests();
    } catch (error) {
      console.error('Failed to mint request:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mv-card p-8 text-center">
          <h1 className="mv-heading-lg text-red-400 mb-4">Access Denied</h1>
          <p className="mv-text-muted">Admin privileges required</p>
        </div>
      </div>
    );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-6xl">◈</div>
      </div>
    );
  }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">🎯 Mint Approval Queue</h1>
        <p className="mv-text-muted text-lg">Approve pending mint requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">{pendingCount}</div>
          <div className="mv-text-muted text-sm">Pending</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{approvedCount}</div>
          <div className="mv-text-muted text-sm">Approved</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">{requests.filter(r => r.status === 'minted').length}</div>
          <div className="mv-text-muted text-sm">Minted</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{requests.length}</div>
          <div className="mv-text-muted text-sm">Total</div>
        </div>
      </div>

      {/* Mint Requests */}
      <div className="space-y-6">
        {requests.map((request) => (
          <div key={request.id} className="mv-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
              {/* Asset Preview */}
              <div className="w-full lg:w-48 h-48 bg-gradient-to-br from-yellow-400/20 to-green-400/20 rounded-lg flex items-center justify-center">
                <div className="text-4xl">🎨</div>
              </div>

              {/* Asset Details */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-lg">{request.assetName}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm mt-2 sm:mt-0 ${
                    request.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                    request.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                    request.status === 'minted' ? 'bg-blue-400/20 text-blue-400' :
                    'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {request.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm mv-text-muted mb-1">Creator</div>
                    <div className="text-white">{request.creator}</div>
                  </div>
                  <div>
                    <div className="text-sm mv-text-muted mb-1">Type</div>
                    <div className="text-white">{request.assetType}</div>
                  </div>
                  <div>
                    <div className="text-sm mv-text-muted mb-1">Submitted</div>
                    <div className="text-white">{new Date(request.submittedAt).toLocaleDateString()}</div>
                  </div>
                  {request.reviewedAt && (
                    <div>
                      <div className="text-sm mv-text-muted mb-1">Reviewed</div>
                      <div className="text-white">{new Date(request.reviewedAt).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="mb-4">
                  <div className="text-sm mv-text-muted mb-2">Metadata</div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-white font-medium mb-1">{request.metadata.title}</div>
                    <div className="text-sm mv-text-muted mb-2">{request.metadata.description}</div>
                    <div className="flex flex-wrap gap-2">
                      {request.metadata.attributes.map((attr, idx) => (
                        <span key={idx} className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-xs">
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <button
                      onClick={() => handleMint(request.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
                    >
                      Mint NFT
                    </button>
                  )}
                  <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}