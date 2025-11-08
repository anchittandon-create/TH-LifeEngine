import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt, profileId, model } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY not configured in environment" },
        { status: 500 }
      );
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelToUse = model || process.env.GEMINI_MODEL || "gemini-1.5-flash-8b";
    const geminiModel = genAI.getGenerativeModel({ model: modelToUse });

    // Configure generation settings for detailed plans
    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 6000, // Reduced from 8192 for cost optimization
    };

    // Generate content
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const planText = response.text().trim();

    if (!planText) {
      return NextResponse.json(
        { error: "AI returned an empty response" },
        { status: 502 }
      );
    }

    // Extract JSON from markdown code blocks if present
    let cleanedPlanText = planText;
    const jsonMatch = planText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleanedPlanText = jsonMatch[1].trim();
    }

    return NextResponse.json({
      plan: cleanedPlanText,
      formatted: true,
      metadata: {
        model: modelToUse,
        profileId,
        tokens: {
          input: 0, // Gemini doesn't provide detailed token counts in response
          output: 0,
          total: 0,
        },
        generatedAt: new Date().toISOString(),
        provider: "google-gemini",
      },
    });
  } catch (error: any) {
    console.error("❌ [CustomGPT API] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate plan with AI",
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
