'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { dataManager } from '../../../utils/storage/data-store';

interface Submission {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'revision-requested';
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: string;
  feedback?: string;
  version: number;
  fileSize: string;
}

export default function SubmissionsPage() {
  const { isAnimator, isAdmin } = useRBAC();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await dataManager.getData('submissions');
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'name'>('date');

  const filteredSubmissions = submissions
    .filter(sub => selectedStatus === 'all' || sub.status === selectedStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleResubmit = async (id: string) => {
    try {
      const submission = submissions.find(s => s.id === id);
      if (submission) {
        await dataManager.updateItem('submissions', id, {
          status: 'pending',
          version: submission.version + 1,
          submittedAt: new Date().toISOString()
        });
        await loadSubmissions();
      }
    } catch (error) {
      console.error('Failed to resubmit:', error);
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await dataManager.deleteItem('submissions', id);
      await loadSubmissions();
    } catch (error) {
      console.error('Failed to withdraw submission:', error);
    }
  };

  if (!isAnimator && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mv-card p-8 text-center">
          <h1 className="mv-heading-lg text-red-400 mb-4">Access Denied</h1>
          <p className="mv-text-muted">Animator privileges required</p>
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

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    underReview: submissions.filter(s => s.status === 'under-review').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    revisionRequested: submissions.filter(s => s.status === 'revision-requested').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">📋 Submissions</h1>
        <p className="mv-text-muted text-lg">Track your asset submission status and feedback</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="mv-card p-4 text-center">
          <div className="text-xl font-bold text-white mb-1">{stats.total}</div>
          <div className="mv-text-muted text-xs">Total</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-xl font-bold text-gray-400 mb-1">{stats.pending}</div>
          <div className="mv-text-muted text-xs">Pending</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-xl font-bold text-blue-400 mb-1">{stats.underReview}</div>
          <div className="mv-text-muted text-xs">Review</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-xl font-bold text-green-400 mb-1">{stats.approved}</div>
          <div className="mv-text-muted text-xs">Approved</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-xl font-bold text-yellow-400 mb-1">{stats.revisionRequested}</div>
          <div className="mv-text-muted text-xs">Revision</div>
        </div>
        <div className="mv-card p-4 text-center">
          <div className="text-xl font-bold text-red-400 mb-1">{stats.rejected}</div>
          <div className="mv-text-muted text-xs">Rejected</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mv-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="mv-heading-md">Submissions ({filteredSubmissions.length})</h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under-review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="revision-requested">Revision Requested</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'name')}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="status">Sort by Status</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-6">
        {filteredSubmissions.length === 0 ? (
          <div className="mv-card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="mv-heading-md mb-2">No Submissions Found</h3>
            <p className="mv-text-muted mb-6">
              {selectedStatus === 'all' 
                ? "You haven't submitted any assets yet" 
                : `No submissions with status: ${selectedStatus}`}
            </p>
            <button
              onClick={() => setSelectedStatus('all')}
              className="mv-button-secondary"
            >
              View All Submissions
            </button>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div key={submission.id} className="mv-card p-6">
              <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                {/* Asset Preview */}
                <div className="w-full lg:w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-green-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">
                    {submission.type === 'animation' ? '🎬' : 
                     submission.type === '3d-model' ? '🎯' :
                     submission.type === 'audio' ? '🎵' : '🖼️'}
                  </span>
                </div>

                {/* Submission Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg mb-1">{submission.name}</h3>
                      <div className="text-sm mv-text-muted">Version {submission.version}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm mt-2 sm:mt-0 ${
                      submission.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                      submission.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                      submission.status === 'under-review' ? 'bg-blue-400/20 text-blue-400' :
                      submission.status === 'revision-requested' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {submission.status.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <div className="mv-text-muted mb-1">Type</div>
                      <div className="text-white">{submission.type}</div>
                    </div>
                    <div>
                      <div className="mv-text-muted mb-1">File Size</div>
                      <div className="text-white">{submission.fileSize}</div>
                    </div>
                    <div>
                      <div className="mv-text-muted mb-1">Submitted</div>
                      <div className="text-white">{new Date(submission.submittedAt).toLocaleDateString()}</div>
                    </div>
                    {submission.reviewedAt && (
                      <div>
                        <div className="mv-text-muted mb-1">Reviewed</div>
                        <div className="text-white">{new Date(submission.reviewedAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {submission.feedback && (
                    <div className="mb-4">
                      <div className="text-sm mv-text-muted mb-2">Reviewer Feedback</div>
                      <div className="p-3 bg-white/5 rounded-lg border-l-4 border-yellow-400">
                        <div className="text-white text-sm">{submission.feedback}</div>
                        {submission.reviewer && (
                          <div className="text-xs mv-text-muted mt-2">- {submission.reviewer}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {submission.status === 'revision-requested' && (
                      <button
                        onClick={() => handleResubmit(submission.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                      >
                        Resubmit
                      </button>
                    )}
                    {(submission.status === 'pending' || submission.status === 'revision-requested') && (
                      <button
                        onClick={() => handleWithdraw(submission.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                      >
                        Withdraw
                      </button>
                    )}
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}