/**
 * Layer Upload Validation & Sanitization
 */

export interface LayerUploadData {
  title: string;
  description?: string;
  duration: number;
  animatorVersion: 'futuristic' | 'gritty' | 'cultural';
  creatorWallet: string;
}

export interface LayerFiles {
  background?: File;
  midground?: File;
  foreground?: File;
  depthMap?: File;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

const ALLOWED_MIME_TYPES = [
  'video/mp4', 'video/webm', 'video/mov', 'video/avi',
  'image/jpeg', 'image/png', 'image/webp'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MIN_DURATION = 5; // 5 seconds
const MAX_DURATION = 600; // 10 minutes

export class LayerValidator {
  static validateMuralData(data: Partial<LayerUploadData>): ValidationResult {
    const errors: string[] = [];
    
    // Title validation
    if (!data.title?.trim()) {
      errors.push('Title is required');
    } else if (data.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }
    
    // Duration validation
    if (!data.duration || data.duration < MIN_DURATION) {
      errors.push(`Duration must be at least ${MIN_DURATION} seconds`);
    } else if (data.duration > MAX_DURATION) {
      errors.push(`Duration must be less than ${MAX_DURATION} seconds`);
    }
    
    // Animator version validation
    const validVersions = ['futuristic', 'gritty', 'cultural'];
    if (!data.animatorVersion || !validVersions.includes(data.animatorVersion)) {
      errors.push('Invalid animator version');
    }
    
    // Wallet validation
    if (!data.creatorWallet || !this.isValidWallet(data.creatorWallet)) {
      errors.push('Invalid wallet address');
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    
    return {
      isValid: true,
      errors: [],
      sanitized: {
        title: data.title!.trim(),
        description: data.description?.trim() || '',
        duration: Math.round(data.duration!),
        animatorVersion: data.animatorVersion,
        creatorWallet: data.creatorWallet!.toLowerCase()
      }
    };
  }
  
  static validateLayerFiles(files: LayerFiles): ValidationResult {
    const errors: string[] = [];
    
    // At least background layer required
    if (!files.background) {
      errors.push('Background layer is required');
    }
    
    // Validate each file
    Object.entries(files).forEach(([layerType, file]) => {
      if (file) {
        const fileErrors = this.validateSingleFile(file, layerType);
        errors.push(...fileErrors);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private static validateSingleFile(file: File, layerType: string): string[] {
    const errors: string[] = [];
    
    // File size check
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${layerType} file too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }
    
    // MIME type check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`${layerType} file type not supported (${file.type})`);
    }
    
    // File name sanitization check
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push(`${layerType} filename contains invalid characters`);
    }
    
    return errors;
  }
  
  static isValidWallet(wallet: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(wallet);
  }
  
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }
}