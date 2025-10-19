import { NextRequest, NextResponse } from 'next/server';
import { getProfiles, saveProfile } from '@/lib/utils/store';
import { createId } from '@/lib/utils/ids';
import type { Profile } from '@/lib/domain/profile';

export async function GET() {
  const profiles = getProfiles();
  return NextResponse.json(profiles);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const profile: Profile = {
    id: createId(),
    name: data.name,
    age: data.age,
    gender: data.gender === 'male' ? 'M' : data.gender === 'female' ? 'F' : 'Other',
    region: data.region,
    medical_flags: data.medicalConditions ? data.medicalConditions.split(',').map((s: string) => s.trim()) : [],
  };
  saveProfile(profile);
  return NextResponse.json(profile);
}