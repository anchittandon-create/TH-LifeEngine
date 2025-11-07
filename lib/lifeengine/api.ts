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
 * Generates a plan using the regular rule-based API
 */
export async function generatePlan(payload: any): Promise<PlanGenerationResponse> {
  try {
    const response = await fetch("/api/lifeengine/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

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
}

/**
 * Generates a plan using CustomGPT with AI-generated content
 */
export async function generatePlanWithGPT(prompt: string): Promise<CustomGPTResponse> {
  try {
    const response = await fetch("/api/lifeengine/custom-gpt-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

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
