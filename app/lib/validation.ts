/**
 * Input Validation Utilities
 *
 * Provides centralized validation functions for user inputs to prevent
 * security vulnerabilities and ensure data integrity.
 */

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// Text Input Validation
// ============================================================================

/**
 * Validates and sanitizes OpenAI prompts
 * - Max length: 2000 characters
 * - Removes potentially dangerous characters
 * - Trims whitespace
 */
export function validatePrompt(prompt: string): ValidationResult {
  if (!prompt || typeof prompt !== 'string') {
    return {
      isValid: false,
      error: 'Prompt is required'
    };
  }

  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Prompt cannot be empty'
    };
  }

  if (trimmed.length > 2000) {
    return {
      isValid: false,
      error: 'Prompt must be less than 2000 characters'
    };
  }

  // Check for suspicious patterns (basic prompt injection detection)
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /ignore\s+all\s+previous/i,
    /disregard\s+all\s+previous/i,
    /\\x[0-9a-f]{2}/i, // hex escape sequences
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: 'Prompt contains invalid content'
      };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes prompt text by removing dangerous characters
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 2000); // Enforce max length
}

// ============================================================================
// Image Validation
// ============================================================================

/**
 * Allowed image MIME types for OpenAI API
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

/**
 * Maximum image file size (20MB - OpenAI limit is 20MB)
 */
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

/**
 * Maximum image dimensions for OpenAI API
 */
export const MAX_IMAGE_DIMENSION = 2048;

/**
 * Validates image file type
 */
export function validateImageType(mimeType: string): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType as any)) {
    return {
      isValid: false,
      error: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }
  return { isValid: true };
}

/**
 * Validates image file size
 */
export function validateImageSize(sizeInBytes: number): ValidationResult {
  if (sizeInBytes > MAX_IMAGE_SIZE) {
    const sizeMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `Image too large (${sizeMB}MB). Maximum size is ${maxMB}MB`
    };
  }
  return { isValid: true };
}

/**
 * Validates image dimensions
 */
export function validateImageDimensions(
  width: number,
  height: number
): ValidationResult {
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    return {
      isValid: false,
      error: `Image dimensions too large. Maximum is ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px`
    };
  }

  if (width < 1 || height < 1) {
    return {
      isValid: false,
      error: 'Invalid image dimensions'
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive image validation
 */
export interface ImageValidationInput {
  mimeType: string;
  sizeInBytes: number;
  width?: number;
  height?: number;
}

export function validateImage(input: ImageValidationInput): ValidationResult {
  // Validate type
  const typeResult = validateImageType(input.mimeType);
  if (!typeResult.isValid) return typeResult;

  // Validate size
  const sizeResult = validateImageSize(input.sizeInBytes);
  if (!sizeResult.isValid) return sizeResult;

  // Validate dimensions if provided
  if (input.width && input.height) {
    const dimensionsResult = validateImageDimensions(input.width, input.height);
    if (!dimensionsResult.isValid) return dimensionsResult;
  }

  return { isValid: true };
}

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validates email format (basic RFC 5322 validation)
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic email regex (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: 'Email is too long'
    };
  }

  return { isValid: true };
}

// ============================================================================
// Password Validation
// ============================================================================

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Password is too long (max 128 characters)'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number'
    };
  }

  return { isValid: true };
}

// ============================================================================
// Rate Limiting (Client-Side)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if an action is allowed under rate limit
   * @param key - Unique identifier for the action (e.g., "openai_api_call")
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  checkLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // No entry or expired - create new entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (entry.count >= maxAttempts) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Destroy rate limiter and clear interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validates URL format
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required'
    };
  }

  try {
    const parsedUrl = new URL(url);

    // Only allow https URLs (except localhost for development)
    if (parsedUrl.protocol !== 'https:' && !parsedUrl.hostname.includes('localhost')) {
      return {
        isValid: false,
        error: 'Only HTTPS URLs are allowed'
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}
