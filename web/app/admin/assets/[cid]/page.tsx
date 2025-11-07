'use client';

/**
 * Asset Detail Review Page
 * Comprehensive asset review with AI analysis and approval workflow
 */

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../auth/rbac-provider';
import { useParams, useRouter } from 'next/navigation';
import AssetPreview from './components/AssetPreview';
import QCReport from './components/QCReport';
import AdAnchorEditor from './components/AdAnchorEditor';

interface AssetDetail {
  id: string;
  title: string;
  animator: string;
  submittedAt: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  metadata: {
    confidence: number;
    issues: string[];
    tags: string[];
    duration: number;
    dimensions: { width: number; height: number };
  };
  qcReport: {
    depthMapQuality: number;
    segmentationAccuracy: number;
    audioQuality: number;
    overallScore: number;
    recommendations: string[];
  };
  files: {
    bgLayer: string;
    mgLayer?: string;
    fgLayer?: string;
    audioFile?: string;
    depthMap?: string;
  };
  suggestedAnchors: Array<{
    id: string;
    x: number;
    y: number;
    z: number;
    confidence: number;
    reason: string;
  }>;
}

const mockAssetDetail: AssetDetail = {
  id: 'asset_001',
  title: 'Super Hero Ego - Verse 1',
  animator: '0x1234...5678',
  submittedAt: '2025-01-27T10:30:00Z',
  status: 'pending',
  metadata: {
    confidence: 0.92,
    issues: [],
    tags: ['hiphop', 'animated', 'verse', 'superhero'],
    duration: 45,
    dimensions: { width: 1920, height: 1080 }
  },
  qcReport: {
    depthMapQuality: 0.88,
    segmentationAccuracy: 0.94,
    audioQuality: 0.91,
    overallScore: 0.92,
    recommendations: [
      'Depth map quality is good but could be enhanced in background areas',
      'Audio levels are well balanced',
      'Segmentation accuracy is excellent'
    ]
  },
  files: {
    bgLayer: '/api/assets/asset_001/bg.png',
    mgLayer: '/api/assets/asset_001/mg.png', 
    fgLayer: '/api/assets/asset_001/fg.png',
    audioFile: '/api/assets/asset_001/audio.mp3',
    depthMap: '/api/assets/asset_001/depth.png'
  },
  suggestedAnchors: [
    {
      id: 'anchor_1',
      x: 0.2,
      y: 0.3,
      z: 0.1,
      confidence: 0.85,
      reason: 'Empty background space, good visibility'
    },
    {
      id: 'anchor_2', 
      x: 0.7,
      y: 0.8,
      z: 0.05,
      confidence: 0.72,
      reason: 'Lower third area, minimal motion overlap'
    }
  ]
};

export default function AssetDetailPage() {
  const { isAdmin, isCurator } = useRBAC();
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<AssetDetail>(mockAssetDetail);
  const [activeTab, setActiveTab] = useState<'preview' | 'qc' | 'anchors'>('preview');
  const [loading, setLoading] = useState(false);

  const canReview = isAdmin || isCurator;
  const assetId = params.cid as string;

  useEffect(() => {
    // Load asset details
    // In production, fetch from API using assetId
    setAsset(prev => ({ ...prev, id: assetId }));
  }, [assetId]);

  const handleApproval = async (approved: boolean, notes?: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAsset(prev => ({
        ...prev,
        status: approved ? 'approved' : 'rejected'
      }));
      
      // Redirect back to assets list
      router.push('/admin/assets');
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canReview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Curator or Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <nav className="flex mb-2" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <button 
                      onClick={() => router.push('/admin')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      Admin
                    </button>
                  </li>
                  <li><span className="text-gray-400">/</span></li>
                  <li>
                    <button 
                      onClick={() => router.push('/admin/assets')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      Assets
                    </button>
                  </li>
                  <li><span className="text-gray-400">/</span></li>
                  <li><span className="text-gray-900 font-medium">{asset.title}</span></li>
                </ol>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">{asset.title}</h1>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <span>By {asset.animator}</span>
                <span className="mx-2">•</span>
                <span>{new Date(asset.submittedAt).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span className={`font-medium ${asset.metadata.confidence >= 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {Math.round(asset.metadata.confidence * 100)}% AI Confidence
                </span>
              </div>
            </div>
            
            {asset.status === 'pending' && (
              <div className="flex space-x-3">
                <button
                  onClick={() => handleApproval(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApproval(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'preview', label: 'Preview', icon: '👁️' },
              { key: 'qc', label: 'QC Report', icon: '📊' },
              { key: 'anchors', label: 'Ad Anchors', icon: '🎯' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'preview' && (
            <AssetPreview asset={asset} />
          )}
          
          {activeTab === 'qc' && (
            <QCReport 
              report={asset.qcReport}
              metadata={asset.metadata}
              files={asset.files}
            />
          )}
          
          {activeTab === 'anchors' && (
            <AdAnchorEditor
              assetId={asset.id}
              suggestedAnchors={asset.suggestedAnchors}
              previewUrl={asset.files.bgLayer}
            />
          )}
        </div>
      </div>
    </div>
  );
}