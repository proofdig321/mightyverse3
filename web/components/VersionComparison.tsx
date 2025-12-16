'use client';

import React, { useState, useEffect } from 'react';
import HolographicVideoPlayer from './HolographicVideoPlayer';

interface VersionComparisonProps {
  groupId: string;
  onVersionSelect?: (versionId: string) => void;
}

export default function VersionComparison({ groupId, onVersionSelect }: VersionComparisonProps) {
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  
  useEffect(() => {
    fetch(`/api/content-groups?id=${groupId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGroup(data.group);
          // Auto-select first official version or first version
          const officialVersion = data.group.versions.find((v: any) => v.is_official);
          const defaultVersion = officialVersion || data.group.versions[0];
          if (defaultVersion) {
            setSelectedVersion(defaultVersion.id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [groupId]);
  
  if (loading) return <div className="animate-pulse">Loading versions...</div>;
  if (!group) return <div>Group not found</div>;
  
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersion(versionId);
    onVersionSelect?.(versionId);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{group.title}</h2>
        <div className="text-sm text-gray-400">
          {group.total_versions} Official Version{group.total_versions !== 1 ? 's' : ''} • {group.genre}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {group.versions
          .filter((version: any) => version.is_official) // Only show admin-approved versions
          .map((version: any) => (
          <div 
            key={version.id} 
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedVersion === version.id 
                ? 'border-yellow-400 bg-yellow-400/10' 
                : 'border-white/20 hover:border-white/40'
            }`}
            onClick={() => handleVersionSelect(version.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-white capitalize">
                  {version.animator_style} Style
                </h3>
                <div className="text-xs text-gray-400">
                  Version {version.version_number}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-medium">
                  OFFICIAL
                </span>
                {selectedVersion === version.id && (
                  <span className="bg-yellow-400 text-black px-2 py-1 rounded text-xs">
                    SELECTED
                  </span>
                )}
              </div>
            </div>
            
            <HolographicVideoPlayer
              fileCid={version.asset?.file_cid}
              thumbnailCid={version.asset?.thumbnail_cid}
              mimeType={version.asset?.mime_type}
              title=""
              className="w-full aspect-video mb-3"
            />
            
            <div className="text-sm text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Animator:</span>
                <span className="font-mono text-xs">
                  {version.animator_wallet.slice(0, 6)}...{version.animator_wallet.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Quality:</span>
                <span>{(version.quality_score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>File Size:</span>
                <span>{((version.asset?.file_size || 0) / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {group.versions.filter((v: any) => !v.is_official).length > 0 && (
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Pending Approval</h3>
          <div className="text-sm text-gray-400">
            {group.versions.filter((v: any) => !v.is_official).length} version(s) awaiting admin approval
          </div>
        </div>
      )}
    </div>
  );
}