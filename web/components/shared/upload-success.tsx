'use client';

import Link from 'next/link';

interface UploadSuccessProps {
  assetName: string;
  assetType: string;
  isAdmin?: boolean;
  onUploadAnother: () => void;
}

export default function UploadSuccess({ 
  assetName, 
  assetType, 
  isAdmin = false,
  onUploadAnother 
}: UploadSuccessProps) {
  return (
    <div className="mv-card p-8 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="mv-heading-lg mb-4 text-green-400">Upload Successful!</h2>
      <p className="mv-text-muted mb-6">
        <strong className="text-white">{assetName}</strong> ({assetType}) has been uploaded to IPFS
        {isAdmin ? ' and approved automatically.' : ' and submitted for review.'}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onUploadAnother}
          className="mv-button"
        >
          Upload Another Asset
        </button>
        
        <Link 
          href={isAdmin ? '/admin/assets' : '/animator/submissions'}
          className="mv-button-secondary"
        >
          {isAdmin ? 'View All Assets' : 'View Submissions'}
        </Link>
        
        <Link 
          href={isAdmin ? '/admin' : '/animator'}
          className="mv-button-secondary"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}