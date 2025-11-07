'use client';

interface FileCompressionHelperProps {
  fileSize: number;
  maxSize: number;
}

export default function FileCompressionHelper({ fileSize, maxSize }: FileCompressionHelperProps) {
  const fileSizeMB = fileSize / 1024 / 1024;
  const maxSizeMB = maxSize / 1024 / 1024;
  
  if (fileSize <= maxSize) return null;

  return (
    <div className="mv-card p-4 border-yellow-400/30 bg-yellow-400/10 mt-4">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">⚠️</div>
        <div>
          <h3 className="text-yellow-400 font-medium mb-2">File Too Large</h3>
          <p className="text-sm mv-text-muted mb-3">
            Your file is {fileSizeMB.toFixed(1)}MB but the maximum allowed is {maxSizeMB}MB due to hosting limitations.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-white font-medium">Compression Options:</p>
            <ul className="space-y-1 mv-text-muted ml-4">
              <li>• <strong>Video:</strong> Use H.264 codec, reduce bitrate to 5-10 Mbps</li>
              <li>• <strong>Audio:</strong> Use MP3 320kbps or AAC compression</li>
              <li>• <strong>Images:</strong> Use JPEG with 80-90% quality</li>
              <li>• <strong>3D Models:</strong> Reduce polygon count or use compressed formats</li>
            </ul>
            <p className="text-yellow-400 text-xs mt-2">
              💡 For larger files, contact admin about upgrading hosting plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}