/**
 * API Utilities for Plan Generation
 */

export interface ApiError {
  message: string;
  details?: string;
  statusCode?: number;
}

export interface PlanGenerationResponse {
  planId: string;
  profileId: string;
  createdAt: string;
  plan: any;
  warnings?: string[];
  analytics?: any;
}

export interface CustomGPTResponse {
  plan: string;
  formatted: boolean;
  metadata?: any;
}

/**
 * Fetches with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 60000 // 60 seconds default
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Keep connection alive for background requests
      keepalive: true,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw {
        message: 'Request timeout',
        details: `The request took longer than ${timeout / 1000} seconds`,
        statusCode: 408,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Retry logic for failed requests
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 4xx client errors (except timeout)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 408) {
        throw error;
      }
      
      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
}

/**
 * Generates a plan using the regular rule-based API
 */
export async function generatePlan(payload: any): Promise<PlanGenerationResponse> {
  return withRetry(async () => {
    try {
      const response = await fetchWithTimeout("/api/lifeengine/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }, 90000); // 90 second timeout for plan generation

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.error || errorData.message || "Plan generation failed",
          details: errorData.details || response.statusText,
          statusCode: response.status,
        } as ApiError;
      }

      return await response.json();
    } catch (error: any) {
      if (error.message && error.statusCode) {
        throw error; // Already formatted
      }
      throw {
        message: "Network error occurred",
        details: error.message || "Could not connect to server",
        statusCode: 0,
      } as ApiError;
    }
  });
}

/**
 * Generates a plan using CustomGPT with AI-generated content
 */
export async function generatePlanWithGPT(prompt: string): Promise<CustomGPTResponse> {
  return withRetry(async () => {
    try {
      const response = await fetchWithTimeout("/api/lifeengine/custom-gpt-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      }, 120000); // 120 second timeout for GPT generation

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.error || errorData.message || "GPT generation failed",
          details: errorData.details || response.statusText,
          statusCode: response.status,
        } as ApiError;
      }

      return await response.json();
    } catch (error: any) {
      if (error.message && error.statusCode) {
        throw error;
      }
      throw {
        message: "GPT generation error",
        details: error.message || "Could not generate plan with GPT",
        statusCode: 0,
      } as ApiError;
    }
  });
}

/**
 * Fetches the latest plan for a profile
 */
export async function getLatestPlan(profileId: string): Promise<any> {
  try {
    const response = await fetch(`/api/v1/plans/latest?profile_id=${encodeURIComponent(profileId)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || "Could not fetch plan",
        details: errorData.details || response.statusText,
        statusCode: response.status,
      } as ApiError;
    }

    return await response.json();
  } catch (error: any) {
    if (error.message && error.statusCode) {
      throw error;
    }
    throw {
      message: "Failed to fetch plan",
      details: error.message || "Network error",
      statusCode: 0,
    } as ApiError;
  }
}

/**
 * Formats an error for display
 */
export function formatErrorMessage(error: ApiError | Error | any): string {
  if ('message' in error && 'details' in error) {
    const apiError = error as ApiError;
    return apiError.details 
      ? `${apiError.message}: ${apiError.details}` 
      : apiError.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Helper to check if error is a specific HTTP status
 */
export function isErrorStatus(error: any, status: number): boolean {
  return error?.statusCode === status;
}
