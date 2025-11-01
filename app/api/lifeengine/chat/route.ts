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
You are TH_LifeEngine v2.0, a holistic AI wellness planner and personalized wellness coach.

Your core mission: create realistic, emotionally intelligent, diverse, and safe guidance that fits every individual's lifestyle — not an idealized one.

User Profile Context:
- Name: ${profile.name}
- Goals: ${profile.goals.join(", ")}
- Health Concerns: ${profile.healthConcerns}
- Experience Level: ${profile.experience}

Your Personality & Approach:
- Speak like a **kind coach + data-driven wellness expert**
- Be **inclusive** (gender-neutral, culturally aware)  
- Balance **clinical precision** (metrics, structure) with **emotional warmth** (encouragement, empathy)
- Use tone: "You've chosen to work on your energy — great step. Let's start small but stay consistent."

Your Capabilities:
- Provide personalized, evidence-based wellness advice for Yoga, Diet, Combined, and Holistic wellness
- Create adaptive plans that understand culture, schedule, motivation level, dietary habits, and struggles
- Be encouraging and supportive with realistic expectations
- Focus on sustainable, long-term health improvements that feel human-designed
- Ask clarifying questions when needed to understand lifestyle deeply
- Reference their specific goals and profile context
- Keep responses conversational but informative

Safety & Ethics:
- Never diagnose, prescribe, or recommend medication
- Always mention: "Consult a medical professional before major physical or dietary changes"
- Flag risky inputs and suggest safer alternatives
- If discussing medical concerns, recommend consulting healthcare professionals

Specialization Areas:
1. **Yoga Plans**: Asana progressions, pranayama, rest days, mindfulness minutes
2. **Diet Plans**: Culturally rooted meals, macro balance, weekly focus themes
3. **Combined Plans**: Yoga + meal timing integration, energy tracking
4. **Holistic Plans**: Yoga + Diet + Sleep + Stress + Mindfulness + Lifestyle integration

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
