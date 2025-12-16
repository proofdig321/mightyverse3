'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import VersionComparison from '../../../components/VersionComparison';
import HolographicVideoPlayer from '../../../components/HolographicVideoPlayer';

export default function ContentGroupPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);

  useEffect(() => {
    if (groupId) {
      fetch(`/api/content-groups?id=${groupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setGroup(data.group);
            const officialVersions = data.group.versions.filter((v: any) => v.is_official);
            if (officialVersions.length > 0) {
              setSelectedVersion(officialVersions[0].id);
              setSelectedAsset(officialVersions[0].asset);
            }
          }
        });
    }
  }, [groupId]);

  const handleVersionSelect = (versionId: string) => {
    const version = group?.versions.find((v: any) => v.id === versionId);
    if (version) {
      setSelectedVersion(versionId);
      setSelectedAsset(version.asset);
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }

  const officialVersions = group.versions.filter((v: any) => v.is_official);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {selectedAsset && (
          <div className="mb-8">
            <div className="max-w-4xl mx-auto">
              <HolographicVideoPlayer
                fileCid={selectedAsset.file_cid}
                thumbnailCid={selectedAsset.thumbnail_cid}
                mimeType={selectedAsset.mime_type}
                title={group.title}
                className="w-full aspect-video"
              />
            </div>
          </div>
        )}

        {officialVersions.length > 1 ? (
          <VersionComparison 
            groupId={groupId} 
            onVersionSelect={handleVersionSelect}
          />
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{group.title}</h1>
            <div className="text-gray-400 mb-8">
              Single official version • {group.genre}
            </div>
            {officialVersions.length === 0 && (
              <div className="bg-yellow-900/20 border border-yellow-400/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                  No Official Versions
                </h3>
                <p className="text-gray-300">
                  This content is pending admin approval. Check back later.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold mb-4">About This Content</h3>
            <div className="space-y-3 text-gray-300">
              <div><strong>Original Artist:</strong> {group.original_artist}</div>
              <div><strong>Genre:</strong> {group.genre}</div>
              <div><strong>Duration:</strong> {Math.floor(group.duration / 60)}:{(group.duration % 60).toString().padStart(2, '0')}</div>
              <div><strong>Total Versions:</strong> {group.total_versions}</div>
              <div><strong>Official Versions:</strong> {officialVersions.length}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Version History</h3>
            <div className="space-y-2">
              {group.versions
                .sort((a: any, b: any) => a.version_number - b.version_number)
                .map((version: any) => (
                <div 
                  key={version.id}
                  className={`p-3 rounded border ${
                    version.is_official 
                      ? 'border-green-400/20 bg-green-900/10' 
                      : 'border-gray-600/20 bg-gray-800/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Version {version.version_number}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      version.is_official 
                        ? 'bg-green-500 text-black' 
                        : 'bg-gray-600 text-white'
                    }`}>
                      {version.is_official ? 'OFFICIAL' : 'PENDING'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {version.animator_style} • {version.animator_wallet.slice(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}