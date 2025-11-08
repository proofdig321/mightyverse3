/**
 * CID Validator - Validates and fixes IPFS Content Identifiers
 */

export interface CIDValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export class CIDValidator {
  private static readonly VALID_CID_PREFIXES = ['Qm', 'bafy', 'bafk', 'bafz'];
  private static readonly MIN_CID_LENGTH = 46;
  private static readonly MAX_CID_LENGTH = 100;

  static validate(cid: string): CIDValidationResult {
    if (!cid || typeof cid !== 'string') {
      return { isValid: false, error: 'CID is required and must be a string' };
    }

    const trimmedCid = cid.trim();
    
    if (trimmedCid.length < this.MIN_CID_LENGTH) {
      return { 
        isValid: false, 
        error: `CID too short (${trimmedCid.length} chars, minimum ${this.MIN_CID_LENGTH})`,
        suggestion: 'CID appears to be truncated'
      };
    }

    if (trimmedCid.length > this.MAX_CID_LENGTH) {
      return { 
        isValid: false, 
        error: `CID too long (${trimmedCid.length} chars, maximum ${this.MAX_CID_LENGTH})`
      };
    }

    const hasValidPrefix = this.VALID_CID_PREFIXES.some(prefix => 
      trimmedCid.startsWith(prefix)
    );

    if (!hasValidPrefix) {
      return { 
        isValid: false, 
        error: `Invalid CID prefix. Must start with: ${this.VALID_CID_PREFIXES.join(', ')}`,
        suggestion: 'Check if CID is complete and properly formatted'
      };
    }

    // Check for common truncation patterns
    if (trimmedCid.startsWith('Qm') && trimmedCid.length < 46) {
      return {
        isValid: false,
        error: 'CID appears to be truncated',
        suggestion: 'Standard IPFS v0 CIDs should be 46+ characters'
      };
    }

    // Basic character validation (base58 for Qm, base32 for bafy)
    if (trimmedCid.startsWith('Qm')) {
      const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      if (!base58Regex.test(trimmedCid)) {
        return {
          isValid: false,
          error: 'Invalid characters in CID (must be base58 for Qm prefix)'
        };
      }
    } else if (trimmedCid.startsWith('bafy')) {
      const base32Regex = /^[a-z2-7]+$/;
      if (!base32Regex.test(trimmedCid)) {
        return {
          isValid: false,
          error: 'Invalid characters in CID (must be base32 for bafy prefix)'
        };
      }
    }

    return { isValid: true };
  }

  static sanitize(cid: string): string {
    if (!cid) return '';
    return cid.trim().replace(/[^a-zA-Z0-9]/g, '');
  }

  static detectTruncation(cid: string): boolean {
    if (!cid) return false;
    const validation = this.validate(cid);
    return !validation.isValid && validation.suggestion?.includes('truncated');
  }
}

export const validateCID = CIDValidator.validate;
export const sanitizeCID = CIDValidator.sanitize;