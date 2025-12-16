'use client';

import React, { useState } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { LayerValidator } from '../../../utils/validation/layer-validator';

interface LayerFiles {
  background?: File;
  midground?: File;
  foreground?: File;
  depthMap?: File;
}

export default function UploadLayersPage() {
  const { wallet, isAnimator, isAdmin } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  
  const [muralData, setMuralData] = useState({
    title: '',
    description: '',
    duration: 180,
    animatorVersion: 'futuristic' as const
  });
  
  const [layers, setLayers] = useState<LayerFiles>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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

  const handleFileChange = (layerType: keyof LayerFiles, file: File | null) => {
    setLayers(prev => ({ ...prev, [layerType]: file }));
    setErrors([]);
  };

  const validateForm = (): boolean => {
    const muralValidation = LayerValidator.validateMuralData({
      ...muralData,
      creatorWallet: wallet || ''
    });
    
    const fileValidation = LayerValidator.validateLayerFiles(layers);
    
    const allErrors = [...muralValidation.errors, ...fileValidation.errors];
    setErrors(allErrors);
    
    return allErrors.length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      
      // Add mural data
      formData.append('title', muralData.title);
      formData.append('description', muralData.description);
      formData.append('duration', muralData.duration.toString());
      formData.append('animatorVersion', muralData.animatorVersion);
      formData.append('creatorWallet', wallet || '');
      
      // Add layer files
      Object.entries(layers).forEach(([layerType, file]) => {
        if (file) {
          formData.append(layerType, file);
        }
      });
      
      const response = await fetch('/api/layers', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setMuralData({ title: '', description: '', duration: 180, animatorVersion: 'futuristic' });
        setLayers({});
        setErrors([]);
      } else {
        setErrors(result.errors || [result.error || 'Upload failed']);
      }
      
    } catch (error) {
      setErrors(['Network error occurred']);
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const layerTypes = [
    { key: 'background' as const, label: 'Background Layer', required: true, description: 'Far background elements' },
    { key: 'midground' as const, label: 'Midground Layer', required: false, description: 'Middle depth elements' },
    { key: 'foreground' as const, label: 'Foreground Layer', required: false, description: 'Close foreground elements' },
    { key: 'depthMap' as const, label: 'Depth Map', required: false, description: 'Grayscale depth information' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">◈ Upload Holographic Layers ◈</h1>
        <p className="mv-text-muted">Create 2.5D holographic murals by uploading separate layer files</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mv-card bg-green-900/20 border-green-400/20 p-4 mb-6">
          <div className="text-green-400 font-semibold">✓ Holographic mural uploaded successfully!</div>
          <p className="text-sm mt-1 mv-text-muted">Your layers have been processed and are ready for 2.5D playback.</p>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mv-card bg-red-900/20 border-red-400/20 p-4 mb-6">
          <div className="text-red-400 font-semibold mb-2">Please fix the following errors:</div>
          <ul className="text-sm space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-red-300">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mural Information */}
      <div className="mv-card p-6 mb-6">
        <h2 className="mv-heading-md mb-4">Mural Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input 
              type="text"
              placeholder="Enter mural title"
              value={muralData.title}
              onChange={(e) => setMuralData(prev => ({...prev, title: e.target.value}))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
              maxLength={255}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Animator Version</label>
            <select 
              value={muralData.animatorVersion}
              onChange={(e) => setMuralData(prev => ({...prev, animatorVersion: e.target.value as any}))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="futuristic">Futuristic</option>
              <option value="gritty">Gritty</option>
              <option value="cultural">Cultural</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
            <input 
              type="number"
              min="5"
              max="600"
              value={muralData.duration}
              onChange={(e) => setMuralData(prev => ({...prev, duration: parseInt(e.target.value) || 180}))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Creator</label>
            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm">
              {wallet ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : 'Not connected'}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea 
            placeholder="Describe your holographic mural..."
            value={muralData.description}
            onChange={(e) => setMuralData(prev => ({...prev, description: e.target.value}))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 h-20 resize-none"
            maxLength={500}
          />
        </div>
      </div>

      {/* Layer Upload */}
      <div className="mv-card p-6 mb-6">
        <h2 className="mv-heading-md mb-4">Layer Files</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layerTypes.map(({ key, label, required, description }) => (
            <div key={key} className="border border-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {label} {required && <span className="text-red-400">*</span>}
                </label>
                {layers[key] && (
                  <button
                    onClick={() => handleFileChange(key, null)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <p className="text-xs mv-text-muted mb-3">{description}</p>
              
              <input
                type="file"
                accept="video/*,image/*"
                onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-400 file:text-black file:cursor-pointer cursor-pointer"
              />
              
              {layers[key] && (
                <div className="mt-2 text-sm">
                  <div className="text-green-400">✓ {layers[key]!.name}</div>
                  <div className="text-xs mv-text-muted">
                    {(layers[key]!.size / 1024 / 1024).toFixed(1)} MB • {layers[key]!.type}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-400/20 rounded-lg">
          <div className="text-sm text-blue-300 font-medium mb-1">💡 Layer Upload Tips</div>
          <ul className="text-xs text-blue-200 space-y-1">
            <li>• Background layer is required for holographic effect</li>
            <li>• Use MP4 or WebM for video layers, PNG/JPG for static layers</li>
            <li>• Depth map should be grayscale (white = close, black = far)</li>
            <li>• Maximum file size: 100MB per layer</li>
          </ul>
        </div>
      </div>

      {/* Upload Button */}
      <div className="text-center">
        <button 
          onClick={handleUpload}
          disabled={loading || !muralData.title || !layers.background}
          className="mv-button px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></div>
              <span>Uploading Layers...</span>
            </span>
          ) : (
            'Upload Holographic Mural'
          )}
        </button>
        
        <p className="text-xs mv-text-muted mt-2">
          Files will be stored on IPFS and processed for 2.5D holographic playback
        </p>
      </div>
    </div>
  );
}