import { db } from './lib/utils/db';

async function testPersistence() {
  console.log('Testing data persistence...');

  // Get initial profiles
  const initialProfiles = await db.getProfiles();
  console.log('Initial profiles:', initialProfiles.length);

  // Create a test profile
  const testProfile = {
    id: 'test_profile_123',
    name: 'Test User',
    demographics: { age: 25, sex: 'M' },
    contact: { location: 'Test City' },
    health: { chronicConditions: ['None'] },
    createdAt: new Date().toISOString(),
  };

  await db.saveProfile(testProfile);
  console.log('Saved test profile');

  // Get profiles again
  const updatedProfiles = await db.getProfiles();
  console.log('Updated profiles:', updatedProfiles.length);

  // Check if our profile is there
  const found = updatedProfiles.find(p => p.id === 'test_profile_123');
  console.log('Test profile found:', !!found);

  if (found) {
    console.log('✅ Data persistence is working!');
  } else {
    console.log('❌ Data persistence is NOT working!');
  }
}

testPersistence().catch(console.error);