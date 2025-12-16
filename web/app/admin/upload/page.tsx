'use client';

import React, { useState } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';
import { ipfsClient } from '../../../utils/storage/ipfs-client';
import { isrcGenerator } from '../../../utils/metadata/isrc-generator';
import { mediaTagger } from '../../../utils/metadata/media-tagger';
import NavigationHeader from '../../../components/shared/navigation-header';
import UploadSuccess from '../../../components/shared/upload-success';

interface UploadForm {
  name: string;
  description: string;
  type: 'animation' | '3d-model' | 'audio' | 'video' | 'image' | 'texture' | 'holographic';
  category: string;
  tags: string[];
  file: File | null;
  thumbnail: File | null;
  // 2.5D Layer files
  backgroundLayer: File | null;
  midgroundLayer: File | null;
  foregroundLayer: File | null;
  depthMap: File | null;
  metadata: {
    duration?: number;
    dimensions?: string;
    frameRate?: number;
    bitrate?: number;
    sampleRate?: number;
    format: string;
    isrc?: string;
    holographicType?: '2.5d' | 'layered' | 'single';
  };
}

// TUS-based Livepeer upload using proper SDK
async function uploadToLivepeer(file: File, name: string, thumbnail: File | null, metadata: any, onProgress?: (progress: number) => void): Promise<any> {
  const { Upload } = await import('tus-js-client');
  
  // Step 1: Request TUS endpoint
  const response = await fetch('/api/livepeer/tus-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, enableIPFS: true })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload request failed: ${response.status} - ${errorText}`);
  }
  
  const { success, assetId, tusEndpoint, error, details } = await response.json();
  
  if (!success || !tusEndpoint) {
    const errorMsg = details || error || 'Failed to get TUS endpoint from Livepeer';
    console.error('TUS endpoint request failed:', errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log('TUS endpoint received:', tusEndpoint);
  
  // Step 2: Upload using TUS
  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: tusEndpoint,
      retryDelays: [0, 3000, 5000, 10000],
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onError: (error) => {
        console.error('TUS upload failed:', error);
        reject(error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const progress = Math.round((bytesUploaded / bytesTotal) * 100);
        console.log(`Upload progress: ${progress}%`);
        if (onProgress) onProgress(progress);
      },
      onSuccess: async () => {
        try {
          console.log('TUS upload completed, creating database record...');
          // Step 3: Create database record
          await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              creator_wallet: metadata.creatorWallet,
              asset_type: metadata.assetType,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
              category: metadata.category,
              tags: metadata.tags,
              status: 'approved',
              livepeer_asset_id: assetId,
              livepeer_status: 'processing',
              export_status: 'pending',
              metadata: {
                ...metadata.metadata,
                description: metadata.description,
                upload_method: 'livepeer_tus',
                original_filename: file.name
              }
            })
          });
          
          resolve({
            success: true,
            assetId,
            message: 'TUS upload successful'
          });
        } catch (dbError) {
          console.warn('Database record creation failed, but upload succeeded');
          resolve({
            success: true,
            assetId,
            message: 'Upload successful, database update failed'
          });
        }
      },
    });
    
    upload.start();
  });
}

export default function AdminUploadPage() {
  const { isAdmin, wallet } = useRBAC();
  const [form, setForm] = useState<UploadForm>({
    name: '',
    description: '',
    type: 'image',
    category: '',
    tags: [],
    file: null,
    thumbnail: null,
    backgroundLayer: null,
    midgroundLayer: null,
    foregroundLayer: null,
    depthMap: null,
    metadata: { format: '' }
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedAsset, setUploadedAsset] = useState<{name: string; type: string} | null>(null);

  const categories = {
    animation: ['Character Animation', 'Environment', 'Effects', 'UI Animation'],
    '3d-model': ['Characters', 'Props', 'Environments', 'Vehicles'],
    audio: ['Music', 'Sound Effects', 'Voice', 'Ambient', 'Podcast'],
    video: ['Animation', 'Live Action', 'Tutorial', 'Promotional'],
    image: ['Artwork', 'Photography', 'Concept Art', 'UI Design'],
    texture: ['Materials', 'Patterns', 'Overlays', 'Backgrounds'],
    holographic: ['2.5D Scene', 'Layered Animation', 'Depth Video', 'Parallax Art']
  };

  const handleFileSelect = async (file: File) => {
    // Enhanced validation using new utilities
    const validation = await import('../../../utils/upload/validation').then(m => m.validateFile(file));
    
    if (!validation.valid) {
      alert(`Upload failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Upload warnings:', validation.warnings);
    }
    
    // Validate Livepeer-compatible formats for video/audio
    if (file.type.startsWith('video/')) {
      const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
      if (!supportedVideoTypes.includes(file.type)) {
        console.warn(`Video format ${file.type} may not be compatible with Livepeer. Supported: MP4, WebM, MOV, AVI`);
      }
    } else if (file.type.startsWith('audio/')) {
      const supportedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac'];
      if (!supportedAudioTypes.includes(file.type)) {
        console.warn(`Audio format ${file.type} may not be compatible with Livepeer. Supported: MP3, WAV, FLAC, OGG, AAC`);
      }
    }
    
    setForm(prev => ({ ...prev, file }));
    
    // Auto-generate ISRC and extract metadata for audio/video
    if (file.type.startsWith('audio/')) {
      const isrc = isrcGenerator.generateISRC('audio');
      try {
        const audioMeta = await mediaTagger.extractAudioMetadata(file);
        const autoTags = mediaTagger.generateAutoTags(file, audioMeta);
        setForm(prev => ({
          ...prev,
          type: 'audio',
          tags: Array.from(new Set([...prev.tags, ...autoTags])),
          metadata: { 
            ...prev.metadata, 
            isrc, 
            format: file.type,
            duration: audioMeta.duration,
            bitrate: audioMeta.bitrate,
            sampleRate: audioMeta.sampleRate
          }
        }));
      } catch (error) {
        console.error('Audio metadata extraction failed:', error);
        setForm(prev => ({
          ...prev,
          type: 'audio',
          metadata: { ...prev.metadata, isrc, format: file.type }
        }));
      }
    } else if (file.type.startsWith('video/')) {
      const isrc = isrcGenerator.generateISRC('video');
      try {
        const videoMeta = await mediaTagger.extractVideoMetadata(file);
        const autoTags = mediaTagger.generateAutoTags(file, videoMeta);
        
        // Generate thumbnail
        try {
          const thumbnailBlob = await mediaTagger.generateVideoThumbnail(file);
          const thumbnailFile = new File([thumbnailBlob], `${file.name}-thumb.jpg`, { type: 'image/jpeg' });
          setForm(prev => ({ ...prev, thumbnail: thumbnailFile }));
        } catch (thumbError) {
          console.error('Thumbnail generation failed:', thumbError);
        }
        
        setForm(prev => ({
          ...prev,
          type: 'video',
          tags: Array.from(new Set([...prev.tags, ...autoTags])),
          metadata: { 
            ...prev.metadata, 
            isrc, 
            format: file.type,
            duration: videoMeta.duration,
            frameRate: videoMeta.frameRate,
            dimensions: videoMeta.width && videoMeta.height ? `${videoMeta.width}x${videoMeta.height}` : undefined
          }
        }));
      } catch (error) {
        console.error('Video metadata extraction failed:', error);
        setForm(prev => ({
          ...prev,
          type: 'video',
          metadata: { ...prev.metadata, isrc, format: file.type }
        }));
      }
    } else {
      // For other file types, generate basic auto-tags
      const autoTags = mediaTagger.generateAutoTags(file);
      setForm(prev => ({
        ...prev,
        tags: Array.from(new Set([...prev.tags, ...autoTags])),
        metadata: { ...prev.metadata, format: file.type }
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (form.type === 'holographic') {
      if (!form.backgroundLayer || !form.name) {
        alert('Background layer and name are required for holographic content');
        return;
      }
    } else if (!form.file || !form.name) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Handle 2.5D Holographic Upload
      if (form.type === 'holographic') {
        console.log('Uploading 2.5D holographic layers...');
        
        const layerCids: any = {};
        let progress = 0;
        
        // Upload background layer (required)
        if (form.backgroundLayer) {
          layerCids.background = await ipfsClient.pinFile(
            form.backgroundLayer,
            `${form.name}-bg-${Date.now()}`,
            (p) => setUploadProgress(Math.round(progress + p * 0.4))
          );
          progress = 40;
        }
        
        // Upload midground layer (optional)
        if (form.midgroundLayer) {
          layerCids.midground = await ipfsClient.pinFile(
            form.midgroundLayer,
            `${form.name}-mg-${Date.now()}`,
            (p) => setUploadProgress(Math.round(progress + p * 0.25))
          );
          progress = 65;
        }
        
        // Upload foreground layer (optional)
        if (form.foregroundLayer) {
          layerCids.foreground = await ipfsClient.pinFile(
            form.foregroundLayer,
            `${form.name}-fg-${Date.now()}`,
            (p) => setUploadProgress(Math.round(progress + p * 0.25))
          );
          progress = 90;
        }
        
        // Upload depth map (optional)
        if (form.depthMap) {
          layerCids.depthMapCid = await ipfsClient.pinFile(
            form.depthMap,
            `${form.name}-depth-${Date.now()}`,
            (p) => setUploadProgress(Math.round(progress + p * 0.1))
          );
        }
        
        // Create holographic asset record
        await enhancedDataManager.createItem('assets', {
          name: form.name,
          creator_wallet: wallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          asset_type: 'holographic',
          file_name: form.backgroundLayer?.name || 'holographic-asset',
          file_size: (form.backgroundLayer?.size || 0) + (form.midgroundLayer?.size || 0) + (form.foregroundLayer?.size || 0),
          mime_type: form.backgroundLayer?.type || 'video/mp4',
          category: form.category,
          tags: [...form.tags, '2.5d', 'holographic'],
          status: 'approved',
          metadata: {
            ...form.metadata,
            description: form.description,
            holographicType: '2.5d',
            layers: layerCids,
            upload_method: 'holographic_layers'
          }
        });
        
        setUploadProgress(100);
        setUploadedAsset({ name: form.name, type: form.type });
        setUploadSuccess(true);
        return;
      }
      
      let fileCid: string;
      let uploadMethod = 'ipfs';

      // Use Livepeer for video/audio, IPFS for other types
      if (form.type === 'video' || form.type === 'audio') {
        console.log('Uploading to Livepeer via TUS...', {
          fileName: form.file?.name,
          fileSize: `${((form.file?.size || 0) / 1024 / 1024).toFixed(1)} MB`,
          fileType: form.file?.type
        });
        
        const result = await uploadToLivepeer(
          form.file!, 
          form.name, 
          form.thumbnail, 
          {
            assetType: form.type,
            creatorWallet: wallet || '',
            category: form.category,
            description: form.description,
            tags: form.tags,
            metadata: form.metadata
          },
          (progress) => setUploadProgress(progress)
        );
        
        console.log('Livepeer upload successful:', result);
        setUploadProgress(100);
        setUploadedAsset({ name: form.name, type: form.type });
        setUploadSuccess(true);
        return;
      }

      // Fallback to existing IPFS flow
      console.log('Using IPFS upload flow...');
      fileCid = await ipfsClient.pinFile(
        form.file!,
        `${form.name}-${Date.now()}`,
        (progress) => setUploadProgress(Math.round(progress * 0.7))
      );
      uploadMethod = 'ipfs';

      setUploadProgress(75);

      // Upload thumbnail if provided
      let thumbnailCid;
      if (form.thumbnail) {
        thumbnailCid = await ipfsClient.pinFile(
          form.thumbnail,
          `${form.name}-thumb-${Date.now()}`,
          (progress) => setUploadProgress(75 + Math.round(progress * 0.15))
        );
      }

      setUploadProgress(90);

      // Only proceed with IPFS flow if we got here (Livepeer didn't work)
      if (uploadMethod === 'ipfs') {
        // Check for duplicates by file CID
        const existingAssets = await enhancedDataManager.getData('assets');
        const duplicate = existingAssets.find(asset => asset.file_cid === fileCid);
        if (duplicate) {
          throw new Error(`File already uploaded as "${duplicate.name}".`);
        }

        // Create asset record with enhanced metadata
        await enhancedDataManager.createItem('assets', {
          name: form.name,
          creator_wallet: wallet || '0x860Ec697167Ba865DdE1eC9e172004100613e970',
          asset_type: form.type,
          file_cid: fileCid,
          thumbnail_cid: thumbnailCid,
          file_name: form.file?.name || 'unknown',
          file_size: form.file?.size || 0,
          mime_type: form.file?.type || 'application/octet-stream',
          category: form.category,
          tags: form.tags,
          status: 'approved', // Admin uploads are auto-approved
          metadata: {
            ...form.metadata,
            description: form.description,
            dimensions: form.metadata.dimensions,
            duration: form.metadata.duration,
            frameRate: form.metadata.frameRate,
            bitrate: form.metadata.bitrate,
            sampleRate: form.metadata.sampleRate,
            upload_method: 'ipfs_direct'
          }
        });
      }

      setUploadProgress(100);
      setUploadedAsset({ name: form.name, type: form.type });
      setUploadSuccess(true);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <NavigationHeader 
        title="⬆️ Admin Upload"
        subtitle="Upload media assets to The Mighty Verse"
        backLink="/admin"
      />
      
      {uploadSuccess && uploadedAsset ? (
        <UploadSuccess
          assetName={uploadedAsset.name}
          assetType={uploadedAsset.type}
          isAdmin={true}
          onUploadAnother={() => {
            setUploadSuccess(false);
            setUploadedAsset(null);
            setForm({
              name: '',
              description: '',
              type: 'image',
              category: '',
              tags: [],
              file: null,
              thumbnail: null,
              backgroundLayer: null,
              midgroundLayer: null,
              foregroundLayer: null,
              depthMap: null,
              metadata: { format: '' }
            });
          }}
        />
      ) : (

      <form onSubmit={handleSubmit} className="mv-card p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="mv-heading-md mb-4">Asset Information</h2>
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
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="animation">Animation</option>
                <option value="3d-model">3D Model</option>
                <option value="texture">Texture</option>
                <option value="holographic">2.5D Holographic</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the asset..."
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
                placeholder="e.g., MP4, MP3, PNG"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
              />
            </div>
          </div>
        </div>

        {/* ISRC for Audio/Video */}
        {(form.type === 'audio' || form.type === 'video') && (
          <div>
            <h2 className="mv-heading-md mb-4">ISRC Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ISRC Code</label>
                <input
                  type="text"
                  value={form.metadata.isrc || ''}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, isrc: e.target.value }
                  }))}
                  placeholder="Auto-generated on file upload"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                  readOnly
                />
              </div>
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
            </div>
          </div>
        )}

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
                  onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
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
          
          {form.type === 'holographic' ? (
            /* 2.5D Layer Upload */
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-blue-400 font-medium mb-2">2.5D Holographic Layers</h3>
                <p className="text-sm text-blue-300/80">Upload separate layer files for true 2.5D depth effect</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Background Layer */}
                <div>
                  <label className="block text-sm font-medium mb-2">Background Layer *</label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      onChange={(e) => setForm(prev => ({ ...prev, backgroundLayer: e.target.files?.[0] || null }))}
                      accept=".mp4,.mov,.avi,.webm,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      id="bg-layer"
                      required
                    />
                    <label htmlFor="bg-layer" className="cursor-pointer">
                      <div className="text-2xl mb-1">🌄</div>
                      <div className="text-sm text-white">
                        {form.backgroundLayer ? form.backgroundLayer.name : 'Background'}
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Midground Layer */}
                <div>
                  <label className="block text-sm font-medium mb-2">Midground Layer</label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      onChange={(e) => setForm(prev => ({ ...prev, midgroundLayer: e.target.files?.[0] || null }))}
                      accept=".mp4,.mov,.avi,.webm,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      id="mg-layer"
                    />
                    <label htmlFor="mg-layer" className="cursor-pointer">
                      <div className="text-2xl mb-1">🏢</div>
                      <div className="text-sm text-white">
                        {form.midgroundLayer ? form.midgroundLayer.name : 'Midground'}
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Foreground Layer */}
                <div>
                  <label className="block text-sm font-medium mb-2">Foreground Layer</label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      onChange={(e) => setForm(prev => ({ ...prev, foregroundLayer: e.target.files?.[0] || null }))}
                      accept=".mp4,.mov,.avi,.webm,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      id="fg-layer"
                    />
                    <label htmlFor="fg-layer" className="cursor-pointer">
                      <div className="text-2xl mb-1">👤</div>
                      <div className="text-sm text-white">
                        {form.foregroundLayer ? form.foregroundLayer.name : 'Foreground'}
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Depth Map */}
                <div>
                  <label className="block text-sm font-medium mb-2">Depth Map (Optional)</label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      onChange={(e) => setForm(prev => ({ ...prev, depthMap: e.target.files?.[0] || null }))}
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      id="depth-map"
                    />
                    <label htmlFor="depth-map" className="cursor-pointer">
                      <div className="text-2xl mb-1">🗺️</div>
                      <div className="text-sm text-white">
                        {form.depthMap ? form.depthMap.name : 'Depth Map'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Upload */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Main File *</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    accept=".mp4,.mov,.avi,.webm,.gif,.mp3,.wav,.flac,.ogg,.jpg,.jpeg,.png,.webp,.svg,.fbx,.obj,.glb,.gltf,.blend"
                    className="hidden"
                    id="main-file"
                    required
                  />
                  <label htmlFor="main-file" className="cursor-pointer mv-touch-target">
                    <div className="text-4xl mb-2">📁</div>
                    <div className="text-white mb-1">
                      {form.file ? form.file.name : 'Click to upload file'}
                    </div>
                    <div className="text-sm mv-text-muted">
                      {form.file ? `${(form.file.size / 1024 / 1024).toFixed(1)} MB` : 'Max 100MB'}
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      Tap to select • Drag & drop supported
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
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {form.type === 'video' || form.type === 'audio' ? 'Uploading to Livepeer...' : 
                 form.type === 'holographic' ? 'Uploading holographic layers...' : 'Uploading to IPFS...'}
              </span>
              <span className="text-sm mv-text-muted">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {form.type === 'video' || form.type === 'audio' ? (
              <div className="text-xs text-blue-400 mt-1">
                Using TUS protocol for reliable upload to Livepeer
              </div>
            ) : null}
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
              type: 'image',
              category: '',
              tags: [],
              file: null,
              thumbnail: null,
              backgroundLayer: null,
              midgroundLayer: null,
              foregroundLayer: null,
              depthMap: null,
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