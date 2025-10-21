import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GOOGLE_API_KEY } from "@/lib/utils/env";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

export async function POST(request: Request) {
  try {
    const { profileId, message, conversationHistory = [] } = await request.json() as {
      profileId: string;
      message: string;
      conversationHistory?: any[];
    };

    if (!profileId || !message) {
      return NextResponse.json({ error: "Missing profileId or message" }, { status: 400 });
    }

    let profile = null;
    if (supabase) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError || !data) {
        // Profile not found, but continue without profile context
        profile = null;
      } else {
        profile = data;
      }
    }

    // Build context from profile and conversation history
    const contextPrompt = `You are TH_LifeEngine AI, a wellness assistant specializing in personalized health plans.

${profile ? `PROFILE CONTEXT:
- Name: ${profile.name}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Goals: ${profile.goals?.join(", ") || "General wellness"}
- Experience Level: ${profile.experience || "Beginner"}
- Health Concerns: ${profile.healthConcerns || "None specified"}
- Preferred Time: ${profile.preferredTime || "Flexible"}` : 'No profile context available - provide general wellness advice.'}

CONVERSATION HISTORY:
${conversationHistory.slice(-5).map(msg =>
  `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
).join('\n')}

INSTRUCTIONS:
- Provide personalized, evidence-based wellness advice
- Reference the user's profile information when relevant
- Be encouraging and supportive
- Keep responses concise but informative
- If asked about medical conditions, recommend consulting healthcare professionals
- Focus on yoga, diet, fitness, sleep, and holistic wellness

User's question: ${message}

Respond as a knowledgeable wellness coach:`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      response: text.trim(),
      profileId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      error: "Failed to process chat request",
      response: "I'm sorry, I encountered an error. Please try again."
    }, { status: 500 });
  }
}