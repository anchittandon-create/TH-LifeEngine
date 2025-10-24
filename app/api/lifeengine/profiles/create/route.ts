import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/utils/db";
import { v4 as uuidv4 } from 'uuid';
import { Logger } from "@/lib/logging/logger";

const logger = new Logger('system');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Create a complete profile with all necessary fields
    const profileId = `prof_${uuidv4().slice(0, 8)}`;
    const profile = {
      id: profileId,
      name: body.name || 'New User',
      demographics: {
        age: body.age || 25,
        sex: body.gender || body.sex || 'M',
        height: body.height_cm || body.height || 170,
        weight: body.weight_kg || body.weight || 70,
      },
      contact: {
        email: body.email || '',
        phone: body.phone || '',
        location: body.location || 'Global',
      },
      lifestyle: {
        occupation: body.occupation || 'Professional',
        timeZone: body.timeZone || 'UTC',
        activityLevel: body.activity_level || body.activityLevel || 'moderate',
        primaryGoal: body.primaryGoal || 'weight_loss',
        secondaryGoals: body.secondaryGoals || [],
      },
      health: {
        flags: body.medical_flags || body.healthFlags || [],
        allergies: body.allergies || [],
        chronicConditions: body.chronicConditions || [],
        injuries: body.injuries || [],
        medications: body.medications || [],
        notes: body.healthNotes || '',
      },
      nutrition: {
        dietType: body.dietary?.type || body.dietType || 'veg',
        cuisinePreference: body.dietary?.cuisine_pref || body.cuisinePreference || 'indian',
        dislikes: body.dietary?.avoid_items || body.dislikes || [],
        supplements: body.supplements || [],
        hydrationTargetMl: body.hydrationTarget || 2500,
        fastingWindow: body.fastingWindow || '12:12',
      },
      schedule: {
        timeBudgetMin: body.time_budget_min_per_day || body.timeBudget || 30,
        daysPerWeek: body.availability?.days_per_week || body.daysPerWeek || 5,
        preferredSlots: body.availability?.preferred_slots || body.preferredSlots || [
          { start: '18:00', end: '19:00' }
        ],
        notes: body.scheduleNotes || '',
      },
      equipment: body.equipment || ['mat'],
      preferences: {
        modules: body.modules || ['fitness', 'nutrition'],
        tone: body.preferences?.tone || body.tone || 'balanced',
        indoorOnly: body.preferences?.indoor_only || body.indoorOnly || false,
        level: body.experience_level || body.level || 'beginner',
        coachingNotes: body.coachingNotes || '',
        focusAreas: body.focusAreas || [],
      },
      coachingNotes: body.coachingNotes || '',
      createdAt: new Date().toISOString(),
    };
    
    // Save to persistent storage
    await db.saveProfile(profile);
    
    logger.info('Complete profile created successfully', { 
      profileId, 
      name: profile.name,
      goal: profile.lifestyle.primaryGoal
    });
    
    return NextResponse.json({ 
      ok: true, 
      id: profileId,
      profile: profile,
      message: 'Profile created successfully with persistent storage'
    });
  } catch (error: any) {
    logger.error('Failed to create profile', { error: error.message });
    return NextResponse.json({ 
      ok: false, 
      error: "Failed to create profile",
      details: error.message 
    }, { status: 500 });
  }
}
