/**
 * ISRC Generator - International Standard Recording Code
 * Generates unique ISRC codes for audio and video content
 */

interface ISRCConfig {
  baseCode: string;
  registrant: string;
  audioCode: string;
  videoCode: string;
}

class ISRCGenerator {
  private config: ISRCConfig;
  private counter: number = 1;

  constructor() {
    this.config = {
      baseCode: process.env.ISRC_BASE_CODE || 'ZA-80G-16-00096',
      registrant: process.env.ISRC_REGISTRANT || 'RISA',
      audioCode: process.env.ISRC_AUDIO_CODE || '80G',
      videoCode: process.env.ISRC_VIDEO_CODE || '80H'
    };
  }

  generateISRC(type: 'audio' | 'video', year?: number): string {
    const currentYear = year || new Date().getFullYear();
    const yearCode = currentYear.toString().slice(-2);
    const typeCode = type === 'audio' ? this.config.audioCode : this.config.videoCode;
    
    // Generate unique designation (5 digits, padded with zeros)
    const designation = this.counter.toString().padStart(5, '0');
    this.counter++;
    
    // Format: CC-XXX-YY-NNNNN (Country-Registrant-Year-Designation)
    return `ZA-${typeCode}-${yearCode}-${designation}`;
  }

  validateISRC(isrc: string): boolean {
    const isrcPattern = /^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/;
    return isrcPattern.test(isrc);
  }

  parseISRC(isrc: string) {
    if (!this.validateISRC(isrc)) {
      throw new Error('Invalid ISRC format');
    }

    const parts = isrc.split('-');
    return {
      country: parts[0],
      registrant: parts[1],
      year: `20${parts[2]}`,
      designation: parts[3],
      type: parts[1] === this.config.audioCode ? 'audio' : 'video'
    };
  }
}

export const isrcGenerator = new ISRCGenerator();