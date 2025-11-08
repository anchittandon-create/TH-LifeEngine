// API Route: Generate wellness plan using OpenAI GPT-4
// POST /api/openai/generate-plan

import { NextRequest, NextResponse } from "next/server";
import { callOpenAI, extractContent, getTokenUsage, calculateCost } from "@/lib/openai/client";
import { buildCustomGPTPrompt, buildSystemMessage, validateFormData, estimateTokenCount } from "@/lib/openai/promptBuilder";
import type { CustomGPTFormData } from "@/lib/openai/promptBuilder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GeneratePlanRequest {
  formData: CustomGPTFormData;
  model?: string;
}

interface GeneratePlanResponse {
  success: boolean;
  planId: string;
  plan: {
    raw: string;
    pages: DayPage[];
    metadata: {
      generatedAt: string;
      model: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost: number;
      duration: number; // milliseconds
    };
  };
  formData: CustomGPTFormData;
}

interface DayPage {
  dayNumber: number;
  title: string;
  content: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = (await request.json()) as GeneratePlanRequest;
    const { formData, model = "gpt-4o" } = body;

    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid form data",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Build prompt
    const systemMessage = buildSystemMessage();
    const userPrompt = buildCustomGPTPrompt(formData);

    console.log("📝 Generating Custom GPT plan...");
    console.log(`   Model: ${model}`);
    console.log(`   User: ${formData.fullName}`);
    console.log(`   Duration: ${formData.duration}`);
    console.log(`   Plan Types: ${formData.planTypes.join(", ")}`);
    console.log(`   Estimated prompt tokens: ${estimateTokenCount(systemMessage + userPrompt)}`);

    // Call OpenAI API
    const response = await callOpenAI(
      [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt },
      ],
      {
        model,
        temperature: 0.7,
        max_tokens: 4000,
      }
    );

    // Extract content
    const planContent = extractContent(response);
    
    if (!planContent || planContent.trim().length === 0) {
      throw new Error("GPT-4 returned empty response");
    }

    // Parse into daily pages
    const pages = parsePlanIntoDays(planContent);

    // Get usage statistics
    const usage = getTokenUsage(response);
    const cost = calculateCost(
      { promptTokens: usage.promptTokens, completionTokens: usage.completionTokens },
      model
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("✅ Plan generated successfully!");
    console.log(`   Pages: ${pages.length}`);
    console.log(`   Tokens: ${usage.totalTokens} (${usage.promptTokens} prompt + ${usage.completionTokens} completion)`);
    console.log(`   Cost: $${cost.toFixed(4)}`);
    console.log(`   Duration: ${duration}ms`);

    // Generate unique plan ID
    const planId = `gpt_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare response
    const responseData: GeneratePlanResponse = {
      success: true,
      planId,
      plan: {
        raw: planContent,
        pages,
        metadata: {
          generatedAt: new Date().toISOString(),
          model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          estimatedCost: cost,
          duration,
        },
      },
      formData,
    };

    // Store plan in localStorage (via client) or database
    // For now, return the full plan to be stored client-side

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error generating Custom GPT plan:", error);

    // Handle specific error types
    if (error.message?.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to .env file.",
        },
        { status: 500 }
      );
    }

    if (error.message?.includes("rate_limit")) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API rate limit exceeded. Please try again in a few moments.",
        },
        { status: 429 }
      );
    }

    if (error.message?.includes("insufficient_quota")) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API quota exceeded. Please check your billing settings.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate plan",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Parse GPT-4 response into daily pages
 */
function parsePlanIntoDays(content: string): DayPage[] {
  const pages: DayPage[] = [];
  
  // Split by "Day [number]:" pattern
  const dayRegex = /Day\s+(\d+):/gi;
  const matches = [...content.matchAll(dayRegex)];
  
  if (matches.length === 0) {
    // If no "Day X:" pattern found, return entire content as single page
    return [
      {
        dayNumber: 1,
        title: "Complete Plan",
        content: content.trim(),
      },
    ];
  }

  // Extract content between day markers
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const dayNumber = parseInt(match[1], 10);
    const startIndex = match.index! + match[0].length;
    const endIndex = matches[i + 1]?.index || content.length;
    
    const dayContent = content.substring(startIndex, endIndex).trim();
    
    pages.push({
      dayNumber,
      title: `Day ${dayNumber}`,
      content: dayContent,
    });
  }

  return pages.sort((a, b) => a.dayNumber - b.dayNumber);
}

/**
 * Format error message for user display
 */
function formatErrorMessage(error: any): string {
  if (error.message?.includes("API key")) {
    return "OpenAI API key is not configured. Please contact support.";
  }
  
  if (error.message?.includes("rate_limit")) {
    return "Too many requests. Please try again in a few moments.";
  }
  
  if (error.message?.includes("insufficient_quota")) {
    return "API quota exceeded. Please try again later.";
  }
  
  if (error.message?.includes("invalid_request")) {
    return "Invalid request. Please check your input and try again.";
  }
  
  return "Failed to generate plan. Please try again.";
}
