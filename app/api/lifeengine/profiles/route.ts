import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logging/logger";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/utils/db";
import type { Profile } from "@/lib/ai/schemas";

const logger = new Logger("system");

type EnhancedProfile = Profile & { createdAt: string };

const MORNING_SLOT = { start: "06:00", end: "09:00" };
const EVENING_SLOT = { start: "18:00", end: "21:00" };
const DEFAULT_SLOT = { start: "18:00", end: "19:00" };

function normalizeGender(input: unknown): Profile["gender"] {
  if (typeof input !== "string") return "other";
  const value = input.toLowerCase();
  if (value.startsWith("m")) return "male";
  if (value.startsWith("f")) return "female";
  return "other";
}

function normalizePreferredTime(input: unknown): Profile["preferredTime"] {
  if (typeof input !== "string") return "flexible";
  const value = input.toLowerCase();
  if (value.includes("morning")) return "morning";
  if (value.includes("evening") || value.includes("night")) return "evening";
  return "flexible";
}

function normalizeExperience(input: unknown): Profile["experience"] {
  if (typeof input !== "string") return "beginner";
  const value = input.toLowerCase();
  if (["beginner", "intermediate", "advanced"].includes(value)) {
    return value as Profile["experience"];
  }
  return "beginner";
}

function normalizeGoals(input: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(input)) {
    return input.map((goal) => String(goal).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((goal) => goal.trim())
      .filter(Boolean);
  }
  return [...fallback];
}

function slotsFromPreferredTime(input: Profile["preferredTime"]) {
  switch (input) {
    case "morning":
      return [MORNING_SLOT];
    case "evening":
      return [EVENING_SLOT];
    default:
      return [DEFAULT_SLOT];
  }
}

function toEnhancedProfile(profile: any): EnhancedProfile {
  const gender = normalizeGender(profile.gender ?? profile.demographics?.sex);
  const age = Number(profile.age ?? profile.demographics?.age ?? 30);
  const goals = normalizeGoals(
    profile.goals,
    [
      profile.lifestyle?.primaryGoal,
      ...(profile.lifestyle?.secondaryGoals ?? []),
    ].filter(Boolean)
  );
  const experience = normalizeExperience(
    profile.experience ?? profile.preferences?.level
  );
  const preferredTime = normalizePreferredTime(
    profile.preferredTime ??
      profile.schedule?.notes ??
      profile.schedule?.preferredSlots?.[0]?.start
  );

  return {
    id: profile.id,
    name: profile.name ?? "New User",
    age,
    gender,
    goals,
    healthConcerns:
      profile.healthConcerns ?? profile.health?.notes ?? profile.coachingNotes ?? "",
    experience,
    preferredTime,
    subscriptionType: profile.subscriptionType ?? "quarterly",
    createdAt: profile.createdAt ?? new Date().toISOString(),
  };
}

function prepareProfilePayload(
  incoming: any,
  existing: any | null
) {
  const now = new Date().toISOString();
  const gender = normalizeGender(
    incoming.gender ?? existing?.demographics?.sex ?? "other"
  );
  const preferredTime = normalizePreferredTime(
    incoming.preferredTime ?? existing?.preferredTime ?? "flexible"
  );
  const goals = normalizeGoals(incoming.goals, existing?.preferences?.focusAreas);

  const payload = {
    ...(existing ?? {}),
    ...incoming,
    id: incoming.id ?? existing?.id ?? `prof_${uuidv4().slice(0, 8)}`,
    name: incoming.name ?? existing?.name ?? "New User",
    demographics: {
      age: Number(incoming.age ?? existing?.demographics?.age ?? 30),
      sex: gender === "male" ? "M" : gender === "female" ? "F" : "Other",
      height: incoming.height ?? existing?.demographics?.height ?? 170,
      weight: incoming.weight ?? existing?.demographics?.weight ?? 70,
    },
    lifestyle: {
      ...(existing?.lifestyle ?? {}),
      primaryGoal: goals[0] ?? existing?.lifestyle?.primaryGoal ?? "general_wellness",
      secondaryGoals:
        goals.slice(1) ?? existing?.lifestyle?.secondaryGoals ?? [],
      timeZone: incoming.timeZone ?? existing?.lifestyle?.timeZone ?? "UTC",
      activityLevel:
        incoming.activityLevel ??
        existing?.lifestyle?.activityLevel ??
        (incoming.experience === "advanced"
          ? "intense"
          : incoming.experience === "intermediate"
          ? "moderate"
          : "light"),
    },
    preferences: {
      ...(existing?.preferences ?? {}),
      level: normalizeExperience(
        incoming.experience ?? existing?.preferences?.level
      ),
      focusAreas: goals,
      coachingNotes:
        incoming.healthConcerns ??
        existing?.preferences?.coachingNotes ??
        "",
      tone: existing?.preferences?.tone ?? "balanced",
      indoorOnly: existing?.preferences?.indoorOnly ?? false,
    },
    schedule: {
      ...(existing?.schedule ?? {}),
      preferredSlots: slotsFromPreferredTime(preferredTime),
      daysPerWeek: incoming.daysPerWeek ?? existing?.schedule?.daysPerWeek ?? 5,
      timeBudgetMin:
        incoming.timeBudget ??
        existing?.schedule?.timeBudgetMin ??
        (incoming.experience === "advanced" ? 60 : 45),
    },
    health: {
      ...(existing?.health ?? {}),
      notes:
        incoming.healthConcerns ??
        existing?.health?.notes ??
        "",
      flags: existing?.health?.flags ?? [],
      allergies: existing?.health?.allergies ?? [],
      chronicConditions: existing?.health?.chronicConditions ?? [],
      injuries: existing?.health?.injuries ?? [],
      medications: existing?.health?.medications ?? [],
    },
    nutrition: {
      ...(existing?.nutrition ?? {}),
      dietType: existing?.nutrition?.dietType ?? "veg",
      cuisinePreference: existing?.nutrition?.cuisinePreference ?? "indian",
      dislikes: existing?.nutrition?.dislikes ?? [],
      supplements: existing?.nutrition?.supplements ?? [],
    },
    equipment: incoming.equipment ?? existing?.equipment ?? [],
    contact: {
      ...(existing?.contact ?? {}),
      email: incoming.email ?? existing?.contact?.email ?? "",
      phone: incoming.phone ?? existing?.contact?.phone ?? "",
      location: incoming.location ?? existing?.contact?.location ?? "Global",
    },
    coachingNotes:
      incoming.healthConcerns ?? existing?.coachingNotes ?? "",
    createdAt: existing?.createdAt ?? incoming.createdAt ?? now,
    updatedAt: now,
  };

  return payload;
}

export async function GET() {
  try {
    logger.info("Fetching all profiles from persistent storage");

    const profiles = await db.getProfiles();
    const normalized = profiles.map(toEnhancedProfile);

    logger.info("Profiles fetched successfully", { count: normalized.length });

    return NextResponse.json({ profiles: normalized });
  } catch (error: any) {
    logger.error("Failed to fetch profiles", { error: error.message });
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profileId = body.id || uuidv4();

    const existing = body.id ? await db.getProfile(body.id) : null;
    const profile = prepareProfilePayload({ ...body, id: profileId }, existing);

    if (existing) {
      await db.updateProfile(profile);
      logger.info("Profile updated in persistent storage", {
        profileId,
        name: profile.name,
      });
    } else {
      await db.saveProfile(profile);
      logger.info("Profile created in persistent storage", {
        profileId,
        name: profile.name,
      });
    }

    return NextResponse.json(toEnhancedProfile(profile));
  } catch (error: any) {
    logger.error("Failed to create/update profile", { error: error.message });
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (err) {
        // ignore JSON parse errors – we'll handle missing id below
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Profile ID required" },
        { status: 400 }
      );
    }

    await db.deleteProfile(id);
    logger.info("Profile deleted from persistent storage", { profileId: id });
    return NextResponse.json({ message: "Profile deleted" });
  } catch (error: any) {
    logger.error("Failed to delete profile", { error: error.message });
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}
