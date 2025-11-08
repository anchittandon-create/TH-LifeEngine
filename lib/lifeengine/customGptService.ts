/**
 * CustomGPT Service
 * Handles integration with TH_LifeEngine Companion GPT
 * GPT ID: g-690630c1dfe48191b63fc09f8f024ccb
 */

import type { PlanFormState } from "./planConfig";

export type CustomGPTRequest = {
  prompt: string;
  model: string;
  profileId: string;
  profileName?: string;
};

export type CustomGPTResponse = {
  plan: string; // Raw GPT response text
  formatted: boolean;
  metadata?: {
    model: string;
    tokens?: {
      input: number;
      output: number;
      total: number;
    };
    generatedAt: string;
  };
};

export type CustomGPTError = {
  message: string;
  details?: string;
  statusCode?: number;
};

/**
 * Get the CustomGPT URL from environment
 */
export function getCustomGPTUrl(): string {
  const url = process.env.NEXT_PUBLIC_LIFEENGINE_GPT_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_LIFEENGINE_GPT_URL not configured in environment");
  }
  return url;
}

/**
 * Get the CustomGPT ID from environment
 */
export function getCustomGPTId(): string {
  const id = process.env.NEXT_PUBLIC_LIFEENGINE_GPT_ID;
  if (!id) {
    throw new Error("NEXT_PUBLIC_LIFEENGINE_GPT_ID not configured in environment");
  }
  return id;
}

/**
 * Build a comprehensive prompt for CustomGPT from form data
 */
export function buildCustomGPTPrompt(
  formData: PlanFormState,
  profileData?: {
    name?: string;
    age?: number;
    gender?: string;
    profileId?: string;
  }
): string {
  const {
    planTypes,
    duration,
    intensity,
    format,
    focusAreas,
    goals,
    dietType,
    activityLevel,
    sleepHours,
    stressLevel,
    chronicConditions,
    includeDailyRoutine,
  } = formData;

  const profile = profileData || {};
  
  // Build comprehensive prompt
  const prompt = `
# Generate Personalized Wellness Plan

## User Profile
- Name: ${profile.name || "User"}
- Age: ${profile.age || "Not specified"}
- Gender: ${profile.gender || "Not specified"}
- Profile ID: ${profile.profileId || "custom"}

## Plan Requirements

### Plan Types
${planTypes.length > 0 ? planTypes.map(type => `- ${type}`).join('\n') : '- General Wellness'}

### Duration & Intensity
- Duration: ${duration}
- Intensity Level: ${intensity}
- Output Format: ${format}
- Daily Routine Guidance: ${includeDailyRoutine}

### Focus Areas
${focusAreas.length > 0 ? focusAreas.map(area => `- ${area}`).join('\n') : '- Overall wellness'}

### Primary Goals
${goals.length > 0 ? goals.map(goal => `- ${goal}`).join('\n') : '- Improve overall health'}

### Lifestyle Information
- Diet Type: ${dietType}
- Activity Level: ${activityLevel}
- Sleep Hours: ${sleepHours} hours per night
- Stress Level: ${stressLevel}

${chronicConditions.length > 0 ? `### Health Considerations\n${chronicConditions.map(condition => `- ${condition}`).join('\n')}` : ''}

## Output Requirements

Please generate a comprehensive 28-day (4-week) wellness plan with the following structure:

1. **Plan Summary**
   - Overview of the plan
   - Key objectives
   - Expected outcomes

2. **Weekly Structure** (28 days total)
   For each day, include:
   - **Activities**: Specific exercises, yoga poses, or physical activities with:
     * Activity name
     * Duration (in minutes)
     * Detailed instructions
     * Safety tips and modifications
   
   - **Meals**: Nutritious meal plans with:
     * Meal type (breakfast, lunch, dinner, snacks)
     * Meal name
     * Approximate calories
     * Key ingredients
     * Preparation notes (if applicable)
   
   - **Daily Theme**: A wellness focus for the day
   - **Motivation**: Inspirational message or quote

3. **Recommendations**
   - Equipment needed (if any)
   - Tips for success
   - Progress tracking suggestions
   - When to modify or advance

4. **Safety & Precautions**
   - Important health notes
   - When to consult professionals
   - Modification guidelines

Please ensure the plan is:
- Culturally sensitive and adaptable
- Progressive in difficulty (if applicable)
- Realistic and sustainable
- Aligned with the specified focus areas and goals
- Formatted clearly with proper sections and markdown

Generate the complete 28-day plan now.
  `.trim();

  return prompt;
}

/**
 * Send prompt to CustomGPT and get response
 * This calls our internal API which then communicates with Gemini AI
 */
export async function callCustomGPT(
  prompt: string,
  profileId: string
): Promise<CustomGPTResponse> {
  try {
    console.log("🤖 [CustomGPT] Sending request to CustomGPT API...");
    console.log("📝 [CustomGPT] Prompt length:", prompt.length, "characters");
    console.log("👤 [CustomGPT] Profile ID:", profileId);

    const response = await fetch("/api/lifeengine/custom-gpt-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model: getCustomGPTId(),
        profileId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || "CustomGPT request failed",
        details: errorData.details || response.statusText,
        statusCode: response.status,
      } as CustomGPTError;
    }

    const data: CustomGPTResponse = await response.json();
    
    console.log("✅ [CustomGPT] Response received");
    console.log("📊 [CustomGPT] Response length:", data.plan?.length || 0, "characters");
    
    return data;
  } catch (error: any) {
    console.error("❌ [CustomGPT] Error:", error);
    
    if (error.message && error.statusCode !== undefined) {
      throw error as CustomGPTError;
    }
    
    throw {
      message: "Failed to communicate with CustomGPT",
      details: error.message || "Network error or service unavailable",
      statusCode: 0,
    } as CustomGPTError;
  }
}

/**
 * Validate CustomGPT response format
 */
export function validateCustomGPTResponse(response: CustomGPTResponse): boolean {
  if (!response || !response.plan) {
    console.error("❌ [CustomGPT] Invalid response: missing plan");
    return false;
  }

  if (typeof response.plan !== "string") {
    console.error("❌ [CustomGPT] Invalid response: plan is not a string");
    return false;
  }

  if (response.plan.length < 100) {
    console.error("❌ [CustomGPT] Invalid response: plan too short");
    return false;
  }

  console.log("✅ [CustomGPT] Response validation passed");
  return true;
}

/**
 * Parse CustomGPT response into structured format
 * Attempts to extract structured data from the GPT response
 */
export function parseCustomGPTResponse(response: CustomGPTResponse): any {
  try {
    const plan = response.plan;
    
    // Try to extract structured sections
    const sections = {
      summary: extractSection(plan, "Plan Summary", "Weekly Structure"),
      recommendations: extractSection(plan, "Recommendations", "Safety & Precautions"),
      safety: extractSection(plan, "Safety & Precautions", "---END---"),
      fullText: plan,
    };

    return {
      id: `gpt_${Date.now()}`,
      generatedBy: "CustomGPT",
      generatedAt: response.metadata?.generatedAt || new Date().toISOString(),
      content: sections,
      metadata: response.metadata,
    };
  } catch (error) {
    console.error("⚠️ [CustomGPT] Failed to parse response, returning raw:", error);
    return {
      id: `gpt_${Date.now()}`,
      generatedBy: "CustomGPT",
      generatedAt: new Date().toISOString(),
      content: {
        fullText: response.plan,
      },
      metadata: response.metadata,
    };
  }
}

/**
 * Helper to extract section from text
 */
function extractSection(text: string, startMarker: string, endMarker: string): string {
  try {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return "";

    const endIndex = endMarker === "---END---" 
      ? text.length 
      : text.indexOf(endMarker, startIndex);
    
    if (endIndex === -1 || endIndex <= startIndex) {
      return text.substring(startIndex + startMarker.length).trim();
    }

    return text.substring(startIndex + startMarker.length, endIndex).trim();
  } catch (error) {
    return "";
  }
}

/**
 * Open CustomGPT in new window with instructions
 */
export function openCustomGPTWindow(prompt?: string): void {
  const url = getCustomGPTUrl();
  
  if (prompt && typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(prompt).then(() => {
      console.log("📋 [CustomGPT] Prompt copied to clipboard");
    }).catch((err) => {
      console.warn("⚠️ [CustomGPT] Failed to copy prompt:", err);
    });
  }
  
  window.open(url, "_blank", "noopener,noreferrer");
}
