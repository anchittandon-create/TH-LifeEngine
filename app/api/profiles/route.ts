import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createId } from '@/lib/utils/ids';
import type { Profile } from '@/lib/domain/profile';

export async function GET() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const profile: Profile = {
    id: createId(),
    name: data.name,
    age: data.age,
    gender: data.gender === 'male' ? 'M' : data.gender === 'female' ? 'F' : 'Other',
    height_cm: data.height || 170,
    weight_kg: data.weight || 70,
    region: data.region || 'Global',
    medical_flags: data.medicalConditions ? data.medicalConditions.split(',').map((s: string) => s.trim()) : [],
    activity_level: data.activityLevel || 'moderate',
    dietary: {
      type: data.dietaryType || 'veg',
      allergies: data.allergies || [],
      avoid_items: data.avoidItems || [],
      cuisine_pref: data.cuisinePref || [],
    },
    preferences: {
      tone: data.tone || 'balanced',
      indoor_only: data.indoorOnly || false,
      notes: data.notes,
    },
    availability: {
      days_per_week: data.daysPerWeek || 5,
      preferred_slots: data.preferredSlots || [],
    },
    plan_type: {
      primary: data.primaryPlan || 'weight_loss',
      secondary: data.secondaryPlans || [],
    },
  };

  const { data: insertedData, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(insertedData[0]);
}