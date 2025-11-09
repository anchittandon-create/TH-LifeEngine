# Blob Storage Architecture

**Current Setup**: Single blob file for everything  
**Your Setup**: Two separate blob tokens  
**Goal**: Use separate blobs for profiles and plans

---

## 🎯 Current Implementation (Single Blob)

**File**: `lib/utils/db.ts`

```typescript
const BLOB_KEY = "lifeengine.state.json";  // Single file for everything

type MemoryState = {
  profiles: ProfileRow[];
  plans: PlanRow[];
};
```

**Problem**: Everything in one blob means:
- Larger file size
- Slower reads/writes
- All or nothing approach
- No way to use separate tokens for profiles vs plans

---

## ✅ Recommended: Separate Blobs

### Option 1: Environment Variable Approach

```typescript
// lib/utils/env.ts
export const BLOB_TOKEN_PROFILES = process.env.TH_LIFEENGINE_BLOB_TOKEN;
export const BLOB_TOKEN_PLANS = process.env.BLOB_READ_WRITE_TOKEN;
export const hasProfileBlob = !!BLOB_TOKEN_PROFILES;
export const hasPlansBlob = !!BLOB_TOKEN_PLANS;
```

```typescript
// lib/utils/db.ts
import { put, list, head, del } from "@vercel/blob";

const PROFILES_BLOB_KEY = "profiles.json";
const PLANS_BLOB_KEY = "plans.json";

async function readProfiles(): Promise<ProfileRow[]> {
  if (!hasProfileBlob) return loadFromLocalFile('profiles.json');
  
  const blob = await head(PROFILES_BLOB_KEY, {
    token: BLOB_TOKEN_PROFILES
  });
  
  if (!blob) return [];
  
  const response = await fetch(blob.url);
  return await response.json();
}

async function writeProfiles(profiles: ProfileRow[]) {
  if (hasProfileBlob) {
    await put(PROFILES_BLOB_KEY, JSON.stringify(profiles, null, 2), {
      access: "public",
      addRandomSuffix: false,
      token: BLOB_TOKEN_PROFILES,
    });
  } else {
    await writeLocalFile('profiles.json', profiles);
  }
}
```

### Option 2: Single Token, Separate Files (Simpler)

**This is what I recommend implementing NOW**:

```typescript
// Keep using BLOB_READ_WRITE_TOKEN but split into separate files
const PROFILES_BLOB_KEY = "profiles.json";
const PLANS_BLOB_KEY = "plans.json";

// Instead of one "lifeengine.state.json" with {profiles, plans}
// Use "profiles.json" and "plans.json" separately
```

**Benefits**:
- ✅ No need to manage two tokens
- ✅ Faster reads (only load what you need)
- ✅ Smaller payloads
- ✅ Can add more blob files later (settings, cache, etc.)

---

## 🚀 Implementation Plan

### Step 1: Update db.ts to use separate files

```typescript
// lib/utils/db.ts

const PROFILES_BLOB_KEY = "th-lifeengine-profiles.json";
const PLANS_BLOB_KEY = "th-lifeengine-plans.json";

// Separate read/write functions
async function readProfiles(): Promise<ProfileRow[]> { ... }
async function writeProfiles(profiles: ProfileRow[]): Promise<void> { ... }
async function readPlans(): Promise<PlanRow[]> { ... }
async function writePlans(plans: PlanRow[]): Promise<void> { ... }

// Update db object
export const db = {
  async getProfiles() {
    return await readProfiles();
  },
  
  async saveProfile(profile: ProfileRow) {
    const profiles = await readProfiles();
    const filtered = profiles.filter(p => p.id !== profile.id);
    await writeProfiles([profile, ...filtered]);
  },
  
  async getPlans() {
    return await readPlans();
  },
  
  async savePlan(plan: PlanRow) {
    const plans = await readPlans();
    const filtered = plans.filter(p => p.id !== plan.id);
    await writePlans([plan, ...filtered]);
  },
};
```

### Step 2: Migrate existing data

```typescript
// scripts/migrate-blob-storage.ts

import { readState, writeProfiles, writePlans } from '@/lib/utils/db';

async function migrate() {
  // Read old combined state
  const oldState = await readState(); // {profiles, plans}
  
  // Write to separate blobs
  await writeProfiles(oldState.profiles);
  await writePlans(oldState.plans);
  
  console.log('✅ Migration complete!');
  console.log(`Profiles: ${oldState.profiles.length}`);
  console.log(`Plans: ${oldState.plans.length}`);
}

migrate();
```

### Step 3: Update API endpoints (if needed)

Most API endpoints already call `db.getProfiles()` and `db.getPlans()`, so they'll automatically use the new implementation!

---

## 🔍 Current Status Check

Let me verify what's actually in your blob storage:

1. **Local Development**: Uses `lifeengine.state.json` file
2. **Production (Vercel)**: Should use blob storage if `BLOB_READ_WRITE_TOKEN` is set

**To check if blob storage is working**:

```typescript
// app/api/debug-blob/route.ts
import { list } from '@vercel/blob';

export async function GET() {
  try {
    const { blobs } = await list();
    
    return Response.json({
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobCount: blobs.length,
      blobs: blobs.map(b => ({
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      })),
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Then visit: `https://your-app.vercel.app/api/debug-blob`

---

## 📊 Your Two Tokens

You mentioned:
1. `TH_LifeEngine_BLOB_READ_WRITE_TOKEN`
2. `BLOB_READ_WRITE_TOKEN`

**Question**: Are these both set in Vercel environment variables?

**Recommendation**: 
- If you have two tokens, I can implement Option 1 (separate tokens for profiles vs plans)
- If you just have one token, I'll implement Option 2 (one token, separate files)

**Which do you prefer?**

---

## 🎯 Quick Fix (What I'll implement now)

**Minimal changes to ensure blob storage works**:

1. ✅ Keep single token `BLOB_READ_WRITE_TOKEN`
2. ✅ Split into separate files: `profiles.json` and `plans.json`
3. ✅ Cache profiles and plans separately
4. ✅ Add logging to confirm blob reads/writes

**Benefits**:
- Dashboard loads faster (only fetches what it needs)
- Profile edits don't reload all plans
- Plan creation doesn't reload all profiles
- Better scalability

**Want me to implement this now?** 🚀
