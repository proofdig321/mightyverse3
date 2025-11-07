'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { dataManager } from '../../../utils/storage/data-store';

interface Sponsor {
  id: string;
  name: string;
  email: string;
  wallet?: string;
  website?: string;
  budget: number;
  status: 'active' | 'inactive' | 'pending';
  campaigns: number;
  totalSpent: number;
  createdAt: string;
}

export default function SponsorsPage() {
  const { isAdmin } = useRBAC();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    wallet: '',
    website: '',
    budget: 0,
    status: 'pending' as Sponsor['status']
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      const data = await dataManager.getData('sponsors');
      setSponsors(data);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataManager.addItem('sponsors', {
        ...formData,
        campaigns: 0,
        totalSpent: 0
      });
      await loadSponsors();
      setFormData({ name: '', email: '', wallet: '', website: '', budget: 0, status: 'pending' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to save sponsor:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dataManager.deleteItem('sponsors', id);
      await loadSponsors();
    } catch (error) {
      console.error('Failed to delete sponsor:', error);
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
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-6xl">◈</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">💼 Sponsor Management</h1>
        <p className="mv-text-muted text-lg">Manage platform sponsors and partnerships</p>
      </div>

      <div className="mv-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="mv-heading-md">Sponsors ({sponsors.length})</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mv-button"
          >
            {showCreateForm ? 'Cancel' : '+ Add Sponsor'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white/5 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Sponsor Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
              />
            </div>
            <button type="submit" className="mv-button">Create Sponsor</button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {sponsors.length === 0 ? (
          <div className="mv-card p-12 text-center">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="mv-heading-md mb-2">No Sponsors Yet</h3>
            <p className="mv-text-muted mb-6">This is a new platform - add your first sponsor</p>
            <button onClick={() => setShowCreateForm(true)} className="mv-button">
              Add First Sponsor
            </button>
          </div>
        ) : (
          sponsors.map((sponsor) => (
            <div key={sponsor.id} className="mv-card p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white text-lg">{sponsor.name}</h3>
                  <div className="text-sm mv-text-muted">{sponsor.email}</div>
                </div>
                <button
                  onClick={() => handleDelete(sponsor.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}