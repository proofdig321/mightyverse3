'use client';

import React, { useState } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { dataManager } from '../../../utils/storage/data-store';
import { ipfsClient } from '../../../utils/storage/ipfs-client';
import NavigationHeader from '../../../components/shared/navigation-header';
import UploadSuccess from '../../../components/shared/upload-success';

interface UploadForm {
  name: string;
  description: string;
  type: 'animation' | '3d-model' | 'audio' | 'texture';
  category: string;
  tags: string[];
  file: File | null;
  thumbnail: File | null;
  metadata: {
    duration?: number;
    dimensions?: string;
    frameRate?: number;
    format: string;
  };
}

export default function UploadPage() {
  const { isAnimator, isAdmin, wallet } = useRBAC();
  const [form, setForm] = useState<UploadForm>({
    name: '',
    description: '',
    type: 'animation',
    category: '',
    tags: [],
    file: null,
    thumbnail: null,
    metadata: {
      format: ''
    }
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedAsset, setUploadedAsset] = useState<{name: string; type: string} | null>(null);

  const categories = {
    animation: ['Character Animation', 'Environment', 'Effects', 'UI Animation'],
    '3d-model': ['Characters', 'Props', 'Environments', 'Vehicles'],
    audio: ['Music', 'Sound Effects', 'Voice', 'Ambient'],
    texture: ['Materials', 'Patterns', 'Overlays', 'Backgrounds']
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file || !form.name) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload actual file to IPFS
      setUploadProgress(10);
      const fileCid = await ipfsClient.pinFile(
        form.file,
        `${form.name}-${Date.now()}`,
        (progress) => setUploadProgress(Math.round(progress * 0.6))
      );
      
      setUploadProgress(70);
      
      // Upload thumbnail if provided
      let thumbnailCid;
      if (form.thumbnail) {
        thumbnailCid = await ipfsClient.pinFile(
          form.thumbnail,
          `${form.name}-thumb-${Date.now()}`,
          (progress) => setUploadProgress(70 + Math.round(progress * 0.2))
        );
      }
      
      setUploadProgress(90);
      
      // Create asset record with enhanced metadata
      await dataManager.addItem('assets', {
        name: form.name,
        description: form.description,
        type: form.type,
        category: form.category,
        tags: form.tags,
        fileCid,
        thumbnailCid,
        fileName: form.file.name,
        fileSize: form.file.size,
        mimeType: form.file.type,
        metadata: form.metadata,
        status: 'pending', // Animator uploads need approval
        creator: wallet,
        submittedBy: wallet,
        submittedAt: new Date().toISOString()
      });
      
      setUploadProgress(100);
      setUploadedAsset({ name: form.name, type: form.type });
      setUploadSuccess(true);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
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
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <NavigationHeader 
        title="📤 Upload Asset"
        subtitle="Upload your holographic creations to The Mighty Verse"
        backLink="/animator"
      />
      
      {uploadSuccess && uploadedAsset ? (
        <UploadSuccess
          assetName={uploadedAsset.name}
          assetType={uploadedAsset.type}
          isAdmin={false}
          onUploadAnother={() => {
            setUploadSuccess(false);
            setUploadedAsset(null);
            setForm({
              name: '',
              description: '',
              type: 'animation',
              category: '',
              tags: [],
              file: null,
              thumbnail: null,
              metadata: { format: '' }
            });
          }}
        />
      ) : (

      <form onSubmit={handleSubmit} className="mv-card p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="mv-heading-md mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Asset Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter asset name"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Asset Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  type: e.target.value as UploadForm['type'],
                  category: '' 
                }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
              >
                <option value="animation">Animation</option>
                <option value="3d-model">3D Model</option>
                <option value="audio">Audio</option>
                <option value="texture">Texture</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your asset..."
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select category</option>
                {categories[form.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <input
                type="text"
                value={form.metadata.format}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  metadata: { ...prev.metadata, format: e.target.value }
                }))}
                placeholder="e.g., MP4, FBX, WAV"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h2 className="mv-heading-md mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm flex items-center space-x-2"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-yellow-400 hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add tags..."
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500"
            >
              Add
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <h2 className="mv-heading-md mb-4">Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Main File *</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const maxSize = 100 * 1024 * 1024; // 100MB
                      if (file.size > maxSize) {
                        alert(`File too large. Maximum size is 100MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB. Please compress your file.`);
                        return;
                      }
                      setForm(prev => ({ ...prev, file }));
                    }
                  }}
                  accept=".mp4,.mov,.avi,.webm,.gif,.mp3,.wav,.flac,.ogg,.jpg,.jpeg,.png,.webp,.svg,.fbx,.obj,.glb,.gltf,.blend"
                  className="hidden"
                  id="main-file"
                  required
                />
                <label htmlFor="main-file" className="cursor-pointer">
                  <div className="text-4xl mb-2">📁</div>
                  <div className="text-white mb-1">
                    {form.file ? form.file.name : 'Click to upload main file'}
                  </div>
                  <div className="text-sm mv-text-muted">
                    {form.file ? `${(form.file.size / 1024 / 1024).toFixed(1)} MB` : 'Max 100MB'}
                  </div>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail (Optional)</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={(e) => setForm(prev => ({ ...prev, thumbnail: e.target.files?.[0] || null }))}
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  id="thumbnail-file"
                />
                <label htmlFor="thumbnail-file" className="cursor-pointer">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-white mb-1">
                    {form.thumbnail ? form.thumbnail.name : 'Click to upload thumbnail'}
                  </div>
                  <div className="text-sm mv-text-muted">
                    {form.thumbnail ? `${(form.thumbnail.size / 1024 / 1024).toFixed(1)} MB` : 'JPG, PNG (Max 5MB)'}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metadata */}
        {form.type === 'animation' && (
          <div>
            <h2 className="mv-heading-md mb-4">Animation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={form.metadata.duration || ''}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, duration: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Frame Rate (fps)</label>
                <input
                  type="number"
                  value={form.metadata.frameRate || ''}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, frameRate: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dimensions</label>
                <input
                  type="text"
                  value={form.metadata.dimensions || ''}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, dimensions: e.target.value }
                  }))}
                  placeholder="1920x1080"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm mv-text-muted">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            type="submit"
            disabled={uploading || !form.file || !form.name}
            className="mv-button flex-1"
          >
            {uploading ? 'Uploading...' : 'Upload Asset'}
          </button>
          <button
            type="button"
            className="mv-button-secondary flex-1"
            onClick={() => setForm({
              name: '',
              description: '',
              type: 'animation',
              category: '',
              tags: [],
              file: null,
              thumbnail: null,
              metadata: { format: '' }
            })}
          >
            Clear Form
          </button>
        </div>
      </form>
      )}
    </div>
  );
}