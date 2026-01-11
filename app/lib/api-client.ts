/**
 * API Client with Retry Logic
 *
 * Provides a wrapper around fetch with:
 * - Automatic retry with exponential backoff
 * - Timeout handling
 * - Error classification
 * - Structured logging
 */

import { apiLogger } from './logger';

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// API error class
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryable(statusCode?: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  if (!statusCode) return false;
  return config.retryableStatuses.includes(statusCode);
}

/**
 * Calculate delay for exponential backoff
 */
function getRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  // Add jitter (random ±25%) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout', 408, true, error);
    }
    throw error;
  }
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeout?: number; retryConfig?: Partial<RetryConfig> } = {}
): Promise<Response> {
  const { retryConfig, ...fetchOptions } = options;
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  let lastError: APIError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      apiLogger.debug(`API request attempt ${attempt + 1}/${config.maxRetries + 1}`, {
        url,
        method: fetchOptions.method || 'GET',
      });

      const response = await fetchWithTimeout(url, fetchOptions);

      // Check if response is successful
      if (response.ok) {
        apiLogger.info('API request successful', {
          url,
          status: response.status,
          attempts: attempt + 1,
        });
        return response;
      }

      // Non-successful response
      const statusCode = response.status;
      const retryable = isRetryable(statusCode, config);

      apiLogger.warn('API request failed', {
        url,
        status: statusCode,
        retryable,
        attempt: attempt + 1,
      });

      lastError = new APIError(
        `HTTP ${statusCode}: ${response.statusText}`,
        statusCode,
        retryable,
        response
      );

      // Don't retry if not retryable or if this was the last attempt
      if (!retryable || attempt === config.maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      const delay = getRetryDelay(attempt, config);
      apiLogger.debug(`Retrying after ${delay}ms`, { attempt: attempt + 1 });
      await sleep(delay);

    } catch (error: any) {
      // If it's already an APIError, use it
      if (error instanceof APIError) {
        lastError = error;

        // Don't retry if not retryable or if this was the last attempt
        if (!error.retryable || attempt === config.maxRetries) {
          throw error;
        }
      } else {
        // Network error or other exception
        lastError = new APIError(
          error.message || 'Network error',
          undefined,
          true, // Network errors are usually retryable
          error
        );

        // Don't retry on last attempt
        if (attempt === config.maxRetries) {
          throw lastError;
        }
      }

      // Wait before retrying
      const delay = getRetryDelay(attempt, config);
      apiLogger.debug(`Retrying after ${delay}ms due to error`, {
        error: error.message,
        attempt: attempt + 1,
      });
      await sleep(delay);
    }
  }

  // This shouldn't be reached, but just in case
  throw lastError || new APIError('Max retries exceeded');
}

/**
 * Helper for JSON API requests with retry
 */
export async function fetchJSON<T = any>(
  url: string,
  options: RequestInit & { timeout?: number; retryConfig?: Partial<RetryConfig> } = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  return data as T;
}

/**
 * Helper for OpenAI API requests
 */
export async function fetchOpenAI(
  endpoint: string,
  apiKey: string,
  options: RequestInit & { timeout?: number; retryConfig?: Partial<RetryConfig> } = {}
): Promise<Response> {
  const baseUrl = process.env.EXPO_PUBLIC_OPENAI_API_URL || 'https://api.openai.com';
  const url = `${baseUrl}${endpoint}`;

  return fetchWithRetry(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      ...options.headers,
    },
    // OpenAI-specific retry config (more aggressive for rate limits)
    retryConfig: {
      maxRetries: 3,
      initialDelay: 2000, // 2 seconds
      retryableStatuses: [429, 500, 502, 503, 504], // Include 429 rate limit
      ...options.retryConfig,
    },
  });
}
