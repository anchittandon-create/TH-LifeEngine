import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Initialize Gemini AI conditionally
let genAI: GoogleGenerativeAI | null = null;
if (process.env.GOOGLE_AI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
}

const chatRequestSchema = z.object({
  profileId: z.string().min(1, "Profile ID is required"),
  message: z.string().min(1, "Message is required"),
  conversationHistory: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.date().or(z.string()),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { profileId, message, conversationHistory } = chatRequestSchema.parse(body);

    // Get profile data (in a real app, this would come from database)
    // For now, we'll use a mock profile or fetch from our in-memory store
    const profile = {
      id: profileId,
      name: "User",
      goals: ["weight loss", "fitness"],
      healthConcerns: "none",
      experience: "beginner",
    };

    // Build conversation context
    const context = `
You are TH_LifeEngine CustomGPT, a personalized wellness AI assistant.

User Profile Context:
- Name: ${profile.name}
- Goals: ${profile.goals.join(", ")}
- Health Concerns: ${profile.healthConcerns}
- Experience Level: ${profile.experience}

Guidelines:
- Provide personalized, evidence-based wellness advice
- Be encouraging and supportive
- Focus on sustainable, long-term health improvements
- Ask clarifying questions when needed
- Reference their specific goals and profile
- Keep responses conversational but informative
- If discussing medical concerns, recommend consulting healthcare professionals

${conversationHistory && conversationHistory.length > 0 ?
  `Recent Conversation:\n${conversationHistory.slice(-5).map(msg =>
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n')}\n\n` : ''
}Current User Message: ${message}

Respond as a helpful wellness coach who knows their profile and goals.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(context);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      response: text,
      profileId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
