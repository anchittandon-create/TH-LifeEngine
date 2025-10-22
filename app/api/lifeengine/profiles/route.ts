import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/lib/logging/logger";
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('system');
const TH_PROFILES = new Map<string, any>();

export async function GET() {
  try {
    logger.info('Fetching all profiles');
    
    const profiles = Array.from(TH_PROFILES.values());
    
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
    
    TH_PROFILES.set(profileId, profile);
    
    logger.info('Profile created/updated', { 
      profileId, 
      name: profile.name,
      action: body.id ? 'updated' : 'created'
    });
    
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
    
    const deleted = TH_PROFILES.delete(id);
    
    if (deleted) {
      logger.info('Profile deleted', { profileId: id });
      return NextResponse.json({ message: "Profile deleted" });
    } else {
      logger.warn('Profile not found for deletion', { profileId: id });
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
  } catch (error: any) {
    logger.error('Failed to delete profile', { error: error.message });
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
