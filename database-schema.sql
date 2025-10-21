-- TH_LifeEngine Database Schema

-- Create profiles table
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  goals TEXT[] NOT NULL DEFAULT '{}',
  healthConcerns TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL CHECK (experience IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  preferredTime TEXT NOT NULL CHECK (preferredTime IN ('morning', 'evening', 'flexible')) DEFAULT 'flexible',
  subscriptionType TEXT NOT NULL CHECK (subscriptionType IN ('quarterly', 'annual', 'custom')) DEFAULT 'quarterly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  profileId TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  intakeId TEXT NOT NULL,
  planJson JSONB NOT NULL,
  planType TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_plans_profile_id ON plans(profileId);
CREATE INDEX idx_plans_created_at ON plans(createdAt);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations (you may want to restrict this)
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on plans" ON plans FOR ALL USING (true);