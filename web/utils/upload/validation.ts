// File upload validation utilities

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: any;
}

export const MIME_TYPES = {
  video: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
  audio: ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  model: ['model/gltf+json', 'model/gltf-binary', 'application/octet-stream']
};

export const MAX_SIZES = {
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024,  // 50MB
  image: 10 * 1024 * 1024,  // 10MB
  model: 50 * 1024 * 1024   // 50MB
};

export function validateFile(file: File, expectedType?: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Basic checks
  if (!file) {
    result.valid = false;
    result.errors.push('No file provided');
    return result;
  }

  // File size validation
  const fileType = getFileType(file);
  const maxSize = MAX_SIZES[fileType] || MAX_SIZES.image;
  
  if (file.size > maxSize) {
    result.valid = false;
    result.errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: ${(maxSize / 1024 / 1024)}MB)`);
  }

  // MIME type validation
  const allowedMimes = MIME_TYPES[fileType] || [];
  if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
    result.warnings.push(`Unexpected MIME type: ${file.type}. Expected: ${allowedMimes.join(', ')}`);
  }

  // File extension validation
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    result.warnings.push('File has no extension');
  }

  // Magic bytes validation (basic)
  if (file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|avi)$/i)) {
    result.warnings.push('Video file extension does not match MIME type');
  }

  return result;
}

export function getFileType(file: File): keyof typeof MIME_TYPES {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.includes('model') || file.name.match(/\.(fbx|obj|glb|gltf)$/i)) return 'model';
  return 'image'; // default
}