'use client';

import React, { useState, useEffect } from 'react';
import { enhancedDataManager } from '../../utils/storage/enhanced-data-store';

interface ContentItem {
  id: string;
  name?: string;
  title?: string;
  status: string;
  quality_score?: number;
  created_at: string;
  file_cid?: string;
}

interface ProcessingJob {
  id: string;
  job_type: string;
  status: string;
  progress: number;
  content_id?: string;
  content_type?: string;
}

export default function ContentCurationPanel() {
  const [assets, setAssets] = useState<ContentItem[]>([]);
  const [murals, setMurals] = useState<ContentItem[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'murals' | 'jobs'>('assets');

  useEffect(() => {
    loadData();
    
    // Set up real-time subscriptions
    const unsubscribeAssets = enhancedDataManager.subscribe('assets', () => loadAssets());
    const unsubscribeMurals = enhancedDataManager.subscribe('murals', () => loadMurals());
    const unsubscribeJobs = enhancedDataManager.subscribe('processing_jobs', () => loadJobs());
    
    return () => {
      unsubscribeAssets();
      unsubscribeMurals();
      unsubscribeJobs();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAssets(), loadMurals(), loadJobs()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    const data = await enhancedDataManager.getData('assets');
    setAssets(data as ContentItem[]);
  };

  const loadMurals = async () => {
    const data = await enhancedDataManager.getData('murals');
    setMurals(data as ContentItem[]);
  };

  const loadJobs = async () => {
    const data = await enhancedDataManager.getData('processing_jobs');
    setJobs(data as ProcessingJob[]);
  };

  const handleCurationAction = async (contentId: string, contentType: string, action: string) => {
    try {
      const response = await fetch('/api/agents/content-curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          action
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh data
        await loadData();
        alert(`${action} completed successfully!`);
      } else {
        alert(`${action} failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Curation action failed:', error);
      alert('Action failed. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500',
      processing: 'bg-blue-500',
      submitted: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      published: 'bg-purple-500',
      queued: 'bg-orange-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const renderContentList = (items: ContentItem[], type: string) => (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="mv-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-white">
                {item.name || item.title || 'Untitled'}
              </h4>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                {item.quality_score && (
                  <span className="text-sm text-gray-300">
                    Quality: {Math.round(item.quality_score * 100)}%
                  </span>
                )}
                {item.file_cid && (
                  <span className="text-xs text-gray-400">
                    CID: {item.file_cid.substring(0, 12)}...
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCurationAction(item.id, type, 'analyze')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Analyze
              </button>
              {item.status === 'submitted' && (
                <>
                  <button
                    onClick={() => handleCurationAction(item.id, type, 'approve')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleCurationAction(item.id, type, 'reject')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => handleCurationAction(item.id, type, 'enhance')}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Enhance
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="mv-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-white">{job.job_type}</h4>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
                {job.content_type && (
                  <span className="text-sm text-gray-300">
                    {job.content_type}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-300">{job.progress}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mv-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="mv-heading-md">🎨 Content Curation</h2>
        <button
          onClick={loadData}
          className="mv-button-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'assets', label: 'Assets', count: assets.length },
          { key: 'murals', label: 'Murals', count: murals.length },
          { key: 'jobs', label: 'Jobs', count: jobs.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'assets' && renderContentList(assets, 'asset')}
        {activeTab === 'murals' && renderContentList(murals, 'mural')}
        {activeTab === 'jobs' && renderJobs()}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            {assets.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-400">Approved Assets</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400">
            {assets.filter(a => a.status === 'submitted').length + murals.filter(m => m.status === 'submitted').length}
          </div>
          <div className="text-sm text-gray-400">Pending Review</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">
            {jobs.filter(j => j.status === 'processing').length}
          </div>
          <div className="text-sm text-gray-400">Active Jobs</div>
        </div>
      </div>
    </div>
  );
}