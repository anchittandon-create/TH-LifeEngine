import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logging/logger";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@/lib/utils/db";

const logger = new Logger('system');

export async function GET() {
  try {
    logger.info('Fetching all profiles from persistent storage');
    
    const profiles = await db.getProfiles();
    
    logger.info('Profiles fetched successfully', { count: profiles.length });
    
    return NextResponse.json(profiles);
  } catch (error: any) {
    logger.error('Failed to fetch profiles', { error: error.message });
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const profileId = body.id || uuidv4();
    const profile = {
      ...body,
      id: profileId,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Use persistent database storage
    if (body.id) {
      await db.updateProfile(profile);
      logger.info('Profile updated in persistent storage', { profileId, name: profile.name });
    } else {
      await db.saveProfile(profile);
      logger.info('Profile created in persistent storage', { profileId, name: profile.name });
    }
    
    return NextResponse.json(profile);
  } catch (error: any) {
    logger.error('Failed to create/update profile', { error: error.message });
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
    }
    
    await db.deleteProfile(id);
    logger.info('Profile deleted from persistent storage', { profileId: id });
    return NextResponse.json({ message: "Profile deleted" });
  } catch (error: any) {
    logger.error('Failed to delete profile', { error: error.message });
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
