/**
 * Media Tagging Utility
 * Handles audio and video metadata extraction and tagging
 */

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
}

interface VideoMetadata {
  title?: string;
  duration?: number;
  width?: number;
  height?: number;
  frameRate?: number;
  bitrate?: number;
  codec?: string;
  format?: string;
}

class MediaTagger {
  /**
   * Extract metadata from audio file using Web APIs
   */
  async extractAudioMetadata(file: File): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        const metadata: AudioMetadata = {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          duration: audio.duration,
          format: file.type,
        };
        
        URL.revokeObjectURL(url);
        resolve(metadata);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      });
      
      audio.src = url;
    });
  }

  /**
   * Extract metadata from video file using Web APIs
   */
  async extractVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.addEventListener('loadedmetadata', () => {
        const metadata: VideoMetadata = {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          format: file.type,
        };
        
        URL.revokeObjectURL(url);
        resolve(metadata);
      });
      
      video.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      });
      
      video.src = url;
    });
  }

  /**
   * Generate automatic tags based on file content and metadata
   */
  generateAutoTags(file: File, metadata?: AudioMetadata | VideoMetadata): string[] {
    const tags: string[] = [];
    
    // File type tags
    if (file.type.startsWith('audio/')) {
      tags.push('audio');
      
      // Audio format tags
      if (file.type.includes('mp3')) tags.push('mp3');
      if (file.type.includes('wav')) tags.push('wav', 'lossless');
      if (file.type.includes('flac')) tags.push('flac', 'lossless');
      if (file.type.includes('ogg')) tags.push('ogg');
      
      // Duration-based tags
      if (metadata?.duration) {
        if (metadata.duration < 30) tags.push('short', 'clip');
        else if (metadata.duration < 180) tags.push('medium');
        else if (metadata.duration < 600) tags.push('long');
        else tags.push('extended');
      }
      
      // Quality tags
      const audioMeta = metadata as AudioMetadata;
      if (audioMeta?.bitrate) {
        if (audioMeta.bitrate >= 320) tags.push('high-quality');
        else if (audioMeta.bitrate >= 192) tags.push('good-quality');
        else tags.push('standard-quality');
      }
    }
    
    if (file.type.startsWith('video/')) {
      tags.push('video');
      
      // Video format tags
      if (file.type.includes('mp4')) tags.push('mp4');
      if (file.type.includes('webm')) tags.push('webm');
      if (file.type.includes('mov')) tags.push('mov');
      
      // Resolution tags
      const videoMeta = metadata as VideoMetadata;
      if (videoMeta?.width && videoMeta?.height) {
        const resolution = videoMeta.width * videoMeta.height;
        if (resolution >= 3840 * 2160) tags.push('4k', 'ultra-hd');
        else if (resolution >= 1920 * 1080) tags.push('1080p', 'full-hd');
        else if (resolution >= 1280 * 720) tags.push('720p', 'hd');
        else tags.push('sd');
        
        // Aspect ratio tags
        const aspectRatio = videoMeta.width / videoMeta.height;
        if (Math.abs(aspectRatio - 16/9) < 0.1) tags.push('widescreen');
        else if (Math.abs(aspectRatio - 4/3) < 0.1) tags.push('standard');
        else if (aspectRatio > 2) tags.push('cinematic');
        else if (aspectRatio < 1) tags.push('portrait');
      }
      
      // Duration-based tags
      if (metadata?.duration) {
        if (metadata.duration < 60) tags.push('short', 'clip');
        else if (metadata.duration < 300) tags.push('medium');
        else if (metadata.duration < 1800) tags.push('long');
        else tags.push('feature-length');
      }
    }
    
    // File size tags
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB < 10) tags.push('small-file');
    else if (sizeMB < 100) tags.push('medium-file');
    else tags.push('large-file');
    
    // Content analysis based on filename
    const fileName = file.name.toLowerCase();
    
    // Music genres (basic detection)
    if (fileName.includes('rock')) tags.push('rock');
    if (fileName.includes('pop')) tags.push('pop');
    if (fileName.includes('jazz')) tags.push('jazz');
    if (fileName.includes('classical')) tags.push('classical');
    if (fileName.includes('electronic')) tags.push('electronic');
    if (fileName.includes('ambient')) tags.push('ambient');
    
    // Content type detection
    if (fileName.includes('intro') || fileName.includes('opening')) tags.push('intro');
    if (fileName.includes('outro') || fileName.includes('ending')) tags.push('outro');
    if (fileName.includes('loop')) tags.push('loop', 'seamless');
    if (fileName.includes('sfx') || fileName.includes('sound-effect')) tags.push('sound-effect');
    if (fileName.includes('voice') || fileName.includes('vocal')) tags.push('vocal');
    if (fileName.includes('instrumental')) tags.push('instrumental');
    if (fileName.includes('demo') || fileName.includes('preview')) tags.push('demo');
    
    return Array.from(new Set(tags)); // Remove duplicates
  }

  /**
   * Validate and enhance ISRC code
   */
  validateISRC(isrc: string): { valid: boolean; formatted?: string; errors?: string[] } {
    const errors: string[] = [];
    
    // Remove any spaces or hyphens for validation
    const cleanISRC = isrc.replace(/[\s-]/g, '');
    
    if (cleanISRC.length !== 12) {
      errors.push('ISRC must be exactly 12 characters');
    }
    
    if (!/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(cleanISRC)) {
      errors.push('Invalid ISRC format. Should be: CC-XXX-YY-NNNNN');
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    // Format with hyphens
    const formatted = `${cleanISRC.slice(0, 2)}-${cleanISRC.slice(2, 5)}-${cleanISRC.slice(5, 7)}-${cleanISRC.slice(7)}`;
    
    return { valid: true, formatted };
  }

  /**
   * Generate thumbnail from video file
   */
  async generateVideoThumbnail(file: File, timeOffset: number = 1): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = Math.min(timeOffset, video.duration * 0.1);
      });
      
      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      });
      
      video.addEventListener('error', () => {
        reject(new Error('Failed to load video for thumbnail'));
      });
      
      video.src = URL.createObjectURL(file);
    });
  }
}

export const mediaTagger = new MediaTagger();