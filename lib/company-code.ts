/**
 * Company Invitation Code Utilities
 * 
 * Generates and validates invitation codes for team members to join companies.
 * Code format: XXXX-XXXX-XXXX-XXXX (16 characters in 4 segments)
 */

// Characters used for code generation (excludes confusing chars: 0, O, 1, I, L)
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SEGMENT_LENGTH = 4;
const SEGMENT_COUNT = 4;

/**
 * Generate a cryptographically secure company invitation code
 * Format: XXXX-XXXX-XXXX-XXXX
 * 
 * @returns {string} Generated code in format XXXX-XXXX-XXXX-XXXX
 */
export function generateCompanyCode(): string {
  const segments: string[] = [];
  
  for (let s = 0; s < SEGMENT_COUNT; s++) {
    let segment = '';
    for (let c = 0; c < SEGMENT_LENGTH; c++) {
      // Use crypto for secure random generation
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);
      const randomIndex = randomBytes[0] % CODE_CHARS.length;
      segment += CODE_CHARS[randomIndex];
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

/**
 * Validate that a code matches the expected format
 * 
 * @param code - Code to validate
 * @returns {boolean} True if code format is valid
 */
export function isValidCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  // Normalize first
  const normalized = normalizeCode(code);
  
  // Check pattern: XXXX-XXXX-XXXX-XXXX (only allowed characters)
  const pattern = new RegExp(
    `^[${CODE_CHARS}]{${SEGMENT_LENGTH}}-[${CODE_CHARS}]{${SEGMENT_LENGTH}}-[${CODE_CHARS}]{${SEGMENT_LENGTH}}-[${CODE_CHARS}]{${SEGMENT_LENGTH}}$`,
    'i'
  );
  
  return pattern.test(normalized);
}

/**
 * Normalize a code for comparison
 * - Converts to uppercase
 * - Removes whitespace
 * - Adds dashes if missing but length is correct
 * 
 * @param code - Code to normalize
 * @returns {string} Normalized code
 */
export function normalizeCode(code: string): string {
  if (!code || typeof code !== 'string') return '';
  
  // Remove all whitespace and convert to uppercase
  let normalized = code.replace(/\s/g, '').toUpperCase();
  
  // If no dashes but correct length, add them
  if (!normalized.includes('-') && normalized.length === SEGMENT_LENGTH * SEGMENT_COUNT) {
    const parts: string[] = [];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      parts.push(normalized.slice(i * SEGMENT_LENGTH, (i + 1) * SEGMENT_LENGTH));
    }
    normalized = parts.join('-');
  }
  
  return normalized;
}

/**
 * Format a code for display (with dashes)
 * 
 * @param code - Code to format
 * @returns {string} Formatted code or empty string if invalid
 */
export function formatCodeForDisplay(code: string): string {
  const normalized = normalizeCode(code);
  if (!isValidCodeFormat(normalized)) return '';
  return normalized;
}

/**
 * Mask a code for security (show only last segment)
 * Format: ****-****-****-XXXX
 * 
 * @param code - Code to mask
 * @returns {string} Masked code
 */
export function maskCode(code: string): string {
  const normalized = normalizeCode(code);
  if (!isValidCodeFormat(normalized)) return '****-****-****-****';
  
  const parts = normalized.split('-');
  return `****-****-****-${parts[3]}`;
}

/**
 * Check if a code has expired
 * 
 * @param expiresAt - Expiration date or null if no expiration
 * @returns {boolean} True if code has expired
 */
export function isCodeExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/**
 * Calculate time remaining until code expires
 * 
 * @param expiresAt - Expiration date
 * @returns {string} Human readable time remaining or null if no expiration
 */
export function getTimeUntilExpiry(expiresAt: Date | null): string | null {
  if (!expiresAt) return null;
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
}
