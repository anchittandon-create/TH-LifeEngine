#!/usr/bin/env tsx

/**
 * Migration Script: Split Single Blob into Separate Files
 * 
 * This script:
 * 1. Reads the old lifeengine.state.json (single blob)
 * 2. Splits it into:
 *    - th-lifeengine-profiles.json
 *    - th-lifeengine-plans.json
 * 3. Verifies the migration
 * 4. Backs up the old blob
 * 
 * Usage:
 *   npx tsx scripts/migrate-blob-storage.ts [--dry-run]
 */

import { put, head } from "@vercel/blob";
import { promises as fs } from 'fs';
import path from 'path';

const OLD_BLOB_KEY = "lifeengine.state.json";
const PROFILES_BLOB_KEY = "th-lifeengine-profiles.json";
const PLANS_BLOB_KEY = "th-lifeengine-plans.json";
const BACKUP_BLOB_KEY = "lifeengine.state.backup.json";

const isDryRun = process.argv.includes('--dry-run');

type OldMemoryState = {
  profiles: any[];
  plans: any[];
};

async function migrate() {
  console.log('🚀 Starting blob storage migration...\n');
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Step 1: Check if we're using blob storage
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!hasBlob) {
    console.log('📂 No BLOB_READ_WRITE_TOKEN found, migrating local files...\n');
    await migrateLocalFiles();
    return;
  }

  console.log('☁️  Using Vercel Blob Storage\n');

  // Step 2: Check if old blob exists
  let oldBlob;
  try {
    oldBlob = await head(OLD_BLOB_KEY);
    console.log('✅ Found old blob:', OLD_BLOB_KEY);
  } catch (error) {
    console.log('❌ Old blob not found:', OLD_BLOB_KEY);
    console.log('Checking if new blobs already exist...\n');
    await checkNewBlobs();
    return;
  }

  // Step 3: Read old blob data
  console.log('📥 Fetching old blob data...');
  const response = await fetch(oldBlob.url);
  const oldData = await response.json() as OldMemoryState;
  
  console.log('📊 Old blob contains:');
  console.log(`   - ${oldData.profiles?.length || 0} profiles`);
  console.log(`   - ${oldData.plans?.length || 0} plans\n`);

  // Step 4: Backup old blob
  if (!isDryRun) {
    console.log('💾 Creating backup of old blob...');
    await put(BACKUP_BLOB_KEY, JSON.stringify(oldData, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
    console.log('✅ Backup created:', BACKUP_BLOB_KEY, '\n');
  } else {
    console.log('💾 [DRY RUN] Would create backup:', BACKUP_BLOB_KEY, '\n');
  }

  // Step 5: Create new blobs
  if (!isDryRun) {
    console.log('📤 Creating profiles blob...');
    await put(PROFILES_BLOB_KEY, JSON.stringify(oldData.profiles || [], null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
    console.log('✅ Profiles blob created:', PROFILES_BLOB_KEY);

    console.log('📤 Creating plans blob...');
    await put(PLANS_BLOB_KEY, JSON.stringify(oldData.plans || [], null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
    console.log('✅ Plans blob created:', PLANS_BLOB_KEY, '\n');
  } else {
    console.log('📤 [DRY RUN] Would create profiles blob:', PROFILES_BLOB_KEY);
    console.log('📤 [DRY RUN] Would create plans blob:', PLANS_BLOB_KEY, '\n');
  }

  // Step 6: Verify migration
  if (!isDryRun) {
    console.log('🔍 Verifying migration...');
    await verifyMigration(oldData);
  } else {
    console.log('🔍 [DRY RUN] Would verify migration\n');
  }

  // Step 7: Summary
  console.log('✨ Migration complete!\n');
  console.log('📝 Summary:');
  console.log(`   ✅ Backup created: ${BACKUP_BLOB_KEY}`);
  console.log(`   ✅ Profiles migrated: ${oldData.profiles?.length || 0} profiles`);
  console.log(`   ✅ Plans migrated: ${oldData.plans?.length || 0} plans`);
  console.log(`   ✅ New blobs created: ${PROFILES_BLOB_KEY}, ${PLANS_BLOB_KEY}\n`);
  
  if (!isDryRun) {
    console.log('⚠️  Old blob still exists:', OLD_BLOB_KEY);
    console.log('   You can safely delete it after verifying the migration.\n');
  }
}

async function migrateLocalFiles() {
  const OLD_PATH = path.join(process.cwd(), 'lifeengine.state.json');
  const PROFILES_PATH = path.join(process.cwd(), 'profiles.json');
  const PLANS_PATH = path.join(process.cwd(), 'plans.json');
  const BACKUP_PATH = path.join(process.cwd(), 'lifeengine.state.backup.json');

  // Check if old file exists
  try {
    await fs.access(OLD_PATH);
    console.log('✅ Found old file:', OLD_PATH);
  } catch (error) {
    console.log('❌ Old file not found:', OLD_PATH);
    console.log('Nothing to migrate.\n');
    return;
  }

  // Read old file
  console.log('📥 Reading old file...');
  const data = await fs.readFile(OLD_PATH, 'utf-8');
  const oldData = JSON.parse(data) as OldMemoryState;
  
  console.log('📊 Old file contains:');
  console.log(`   - ${oldData.profiles?.length || 0} profiles`);
  console.log(`   - ${oldData.plans?.length || 0} plans\n`);

  if (!isDryRun) {
    // Backup
    console.log('💾 Creating backup...');
    await fs.copyFile(OLD_PATH, BACKUP_PATH);
    console.log('✅ Backup created:', BACKUP_PATH, '\n');

    // Create new files
    console.log('📤 Creating profiles file...');
    await fs.writeFile(PROFILES_PATH, JSON.stringify(oldData.profiles || [], null, 2));
    console.log('✅ Profiles file created:', PROFILES_PATH);

    console.log('📤 Creating plans file...');
    await fs.writeFile(PLANS_PATH, JSON.stringify(oldData.plans || [], null, 2));
    console.log('✅ Plans file created:', PLANS_PATH, '\n');

    // Verify
    console.log('🔍 Verifying migration...');
    const profilesData = await fs.readFile(PROFILES_PATH, 'utf-8');
    const plansData = await fs.readFile(PLANS_PATH, 'utf-8');
    const profiles = JSON.parse(profilesData);
    const plans = JSON.parse(plansData);
    
    console.log(`✅ Verified: ${profiles.length} profiles`);
    console.log(`✅ Verified: ${plans.length} plans\n`);
  } else {
    console.log('💾 [DRY RUN] Would create backup:', BACKUP_PATH);
    console.log('📤 [DRY RUN] Would create:', PROFILES_PATH);
    console.log('📤 [DRY RUN] Would create:', PLANS_PATH, '\n');
  }

  console.log('✨ Migration complete!\n');
  console.log('📝 Summary:');
  console.log(`   ✅ Backup created: ${BACKUP_PATH}`);
  console.log(`   ✅ Profiles migrated: ${oldData.profiles?.length || 0} profiles`);
  console.log(`   ✅ Plans migrated: ${oldData.plans?.length || 0} plans\n`);
}

async function checkNewBlobs() {
  try {
    const profilesBlob = await head(PROFILES_BLOB_KEY);
    const plansBlob = await head(PLANS_BLOB_KEY);
    
    console.log('✅ New blobs already exist:');
    console.log(`   - ${PROFILES_BLOB_KEY}`);
    console.log(`   - ${PLANS_BLOB_KEY}`);
    
    // Fetch and show counts
    const profilesResponse = await fetch(profilesBlob.url);
    const plansResponse = await fetch(plansBlob.url);
    const profiles = await profilesResponse.json();
    const plans = await plansResponse.json();
    
    console.log('\n📊 Current data:');
    console.log(`   - ${profiles.length} profiles`);
    console.log(`   - ${plans.length} plans\n`);
    
    console.log('✨ No migration needed!\n');
  } catch (error) {
    console.log('❌ New blobs not found either');
    console.log('This might be a fresh installation.\n');
  }
}

async function verifyMigration(oldData: OldMemoryState) {
  try {
    // Read new blobs
    const profilesBlob = await head(PROFILES_BLOB_KEY);
    const plansBlob = await head(PLANS_BLOB_KEY);
    
    const profilesResponse = await fetch(profilesBlob.url);
    const plansResponse = await fetch(plansBlob.url);
    
    const newProfiles = await profilesResponse.json();
    const newPlans = await plansResponse.json();
    
    // Verify counts
    const profilesMatch = newProfiles.length === (oldData.profiles?.length || 0);
    const plansMatch = newPlans.length === (oldData.plans?.length || 0);
    
    if (profilesMatch && plansMatch) {
      console.log('✅ Verification successful!');
      console.log(`   - Profiles: ${newProfiles.length} ✓`);
      console.log(`   - Plans: ${newPlans.length} ✓\n`);
    } else {
      console.log('⚠️  Verification warning:');
      if (!profilesMatch) {
        console.log(`   - Profiles: expected ${oldData.profiles?.length || 0}, got ${newProfiles.length}`);
      }
      if (!plansMatch) {
        console.log(`   - Plans: expected ${oldData.plans?.length || 0}, got ${newPlans.length}`);
      }
      console.log();
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run migration
migrate().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
