# Per-Stage Timeout Strategy

**Date**: November 9, 2025  
**Proposal**: Multi-stage timeout approach for plan generation  
**Status**: 💡 PROPOSED

---

## 🎯 The Idea

Instead of one 300s timeout for entire generation, break it into **stages** with individual timeouts:

```
Total time available: 300 seconds (Vercel Pro limit)

Stage 1: Profile Analysis     → 30s timeout
Stage 2: Plan Structure       → 30s timeout  
Stage 3: Content Generation   → 210s timeout (remaining)
Stage 4: Validation & Storage → 30s timeout
```

---

## ⚠️ The Challenge

**Problem**: Vercel's function timeout is **absolute**, not per-operation.

```typescript
export const maxDuration = 300; // This is TOTAL function execution time

// Even if we do:
await stage1(); // 30s internal timeout
await stage2(); // 30s internal timeout  
await stage3(); // 210s internal timeout

// Vercel will STILL kill the function at 300s total elapsed time!
```

**What This Means**:
- Per-stage timeouts are for **error handling** (detecting stuck operations)
- They don't extend the total 300s limit
- But they help identify WHICH stage failed!

---

## ✅ Better Solution: Progressive Timeout with Stage Tracking

### Implementation Strategy

```typescript
// Track which stage we're in
type GenerationStage = 'analyzing' | 'structuring' | 'generating' | 'validating';

// Stage-specific timeouts (for internal monitoring)
const STAGE_TIMEOUTS = {
  analyzing: 30000,    // 30s - Profile analysis
  structuring: 30000,  // 30s - Plan structure creation
  generating: 210000,  // 210s - Main content generation
  validating: 30000    // 30s - Validation and storage
};

// Total timeout remains 300s
const TOTAL_TIMEOUT = 300000;

async function generateWithStages(input) {
  const startTime = Date.now();
  let currentStage: GenerationStage = 'analyzing';
  
  try {
    // Stage 1: Profile Analysis
    currentStage = 'analyzing';
    console.log('⏱️ [STAGE 1/4] Analyzing profile (30s timeout)');
    const profile = await withStageTimeout(
      analyzeProfile(input),
      STAGE_TIMEOUTS.analyzing,
      'Profile analysis'
    );
    
    // Stage 2: Structure Planning
    currentStage = 'structuring';
    console.log('⏱️ [STAGE 2/4] Creating plan structure (30s timeout)');
    const structure = await withStageTimeout(
      createStructure(profile, input),
      STAGE_TIMEOUTS.structuring,
      'Structure planning'
    );
    
    // Stage 3: Content Generation (Main AI call)
    currentStage = 'generating';
    const elapsedSoFar = Date.now() - startTime;
    const remainingTime = TOTAL_TIMEOUT - elapsedSoFar;
    const generationTimeout = Math.min(STAGE_TIMEOUTS.generating, remainingTime - 30000); // Reserve 30s for final stage
    
    console.log(`⏱️ [STAGE 3/4] Generating content (${Math.ceil(generationTimeout/1000)}s timeout, ${Math.ceil(remainingTime/1000)}s remaining)`);
    const plan = await withStageTimeout(
      generateContent(structure, input),
      generationTimeout,
      'Content generation'
    );
    
    // Stage 4: Validation & Storage
    currentStage = 'validating';
    console.log('⏱️ [STAGE 4/4] Validating and storing (30s timeout)');
    const result = await withStageTimeout(
      validateAndStore(plan, input),
      STAGE_TIMEOUTS.validating,
      'Validation'
    );
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [COMPLETE] Plan generated in ${Math.ceil(totalTime/1000)}s`);
    
    return result;
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    throw new Error(`Generation failed at stage "${currentStage}" after ${Math.ceil(totalTime/1000)}s: ${error.message}`);
  }
}

// Helper to enforce stage timeout
async function withStageTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  stageName: string
): Promise<T> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${stageName} timed out after ${timeoutMs/1000}s`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}
```

---

## 📊 Benefits of This Approach

### 1. **Better Error Messages**

**Before**:
```
❌ Generation timeout: Request took longer than 5 minutes
```

**After**:
```
❌ Generation failed at stage "generating" after 287s: Content generation timed out after 210s

This tells you:
- Which stage failed (content generation)
- How long total elapsed (287s)
- How long that specific stage took (210s)
```

### 2. **Resource Allocation**

```typescript
// Smart time allocation based on plan size
const STAGE_TIMEOUTS = (daysCount: number) => {
  const baseAnalysis = 20000;  // 20s base
  const baseStructure = 20000;  // 20s base
  const baseValidation = 20000; // 20s base
  
  // Give most time to generation
  const totalAvailable = 300000; // 5 minutes
  const reservedForOverhead = baseAnalysis + baseStructure + baseValidation;
  const availableForGeneration = totalAvailable - reservedForOverhead - 30000; // Reserve 30s buffer
  
  // Scale generation timeout with plan size
  const generationTime = Math.min(
    60000 + (daysCount * 5000), // 60s base + 5s per day
    availableForGeneration
  );
  
  return {
    analyzing: baseAnalysis,
    structuring: baseStructure,
    generating: generationTime,
    validating: baseValidation
  };
};
```

### 3. **Progress Tracking**

Frontend can show:
```
⏱️ Stage 1/4: Analyzing profile... ✅ (12s)
⏱️ Stage 2/4: Creating structure... ✅ (18s)
⏱️ Stage 3/4: Generating content... ⏳ (145s elapsed)
⏱️ Stage 4/4: Validating... (pending)
```

---

## 🚀 Implementation Plan

### Phase 1: Add Stage Tracking (Quick Win)

**File**: `app/api/lifeengine/generate/route.ts`

```typescript
// Add at the top
type GenerationStage = 'analyzing' | 'structuring' | 'generating' | 'validating';
let currentStage: GenerationStage = 'analyzing';

// Before AI call
console.log(`⏱️ [STAGE 3/4: generating] Starting Gemini API call...`);
currentStage = 'generating';

// In catch block
catch (error) {
  console.error(`❌ [STAGE: ${currentStage}] Generation failed:`, error);
  throw new Error(`Generation failed at stage "${currentStage}": ${error.message}`);
}
```

### Phase 2: Add Stage-Specific Timeouts (Medium Effort)

```typescript
// Wrap AI call with stage timeout
const stageTimeout = 210000; // 210s for main generation

const generationPromise = model.generateContent(fullPrompt);
const stageTimeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error(`Stage "generating" exceeded ${stageTimeout/1000}s limit`));
  }, stageTimeout);
});

try {
  result = await Promise.race([generationPromise, stageTimeoutPromise]);
} catch (stageError) {
  throw new Error(`Generation stage failed: ${stageError.message}`);
}
```

### Phase 3: Full Progressive Timeout (Advanced)

Implement the complete `generateWithStages()` function shown above.

---

## 💡 Alternative: Streaming Response

**Even Better Idea**: Use Gemini's streaming API!

```typescript
const stream = await model.generateContentStream(fullPrompt);

let accumulatedContent = '';
const startTime = Date.now();

for await (const chunk of stream) {
  const chunkText = chunk.text();
  accumulatedContent += chunkText;
  
  // Check timeout on each chunk
  const elapsed = Date.now() - startTime;
  if (elapsed > 300000) {
    throw new Error('Generation timeout after receiving partial content');
  }
  
  // Optional: Send progress updates to client
  console.log(`⏳ Received ${accumulatedContent.length} characters in ${Math.ceil(elapsed/1000)}s`);
}

// Parse final accumulated content
const plan = JSON.parse(accumulatedContent);
```

**Benefits**:
- Resets timeout on each chunk received
- Can send progress updates to UI
- Fails faster if AI stops responding
- More resilient to network issues

---

## 🎯 Recommended Approach

### For NOW (Quick Win)

**Add stage logging** to identify where failures occur:

```typescript
console.log('⏱️ [STAGE 1/4] Analyzing profile...');
// ... analysis code ...

console.log('⏱️ [STAGE 2/4] Structuring plan...');
// ... structure code ...

console.log('⏱️ [STAGE 3/4] Generating content...');
// ... AI call ...

console.log('⏱️ [STAGE 4/4] Validating and storing...');
// ... validation code ...

console.log('✅ [COMPLETE] Plan generated successfully');
```

**Impact**: Better debugging, no code restructuring needed.

### For LATER (When Needed)

**Implement streaming API** if we see frequent timeouts:
- More resilient
- Better progress tracking
- Can handle longer plans
- Resets timeout naturally

---

## 📈 Expected Improvements

### Current System
```
Total timeout: 300s
- If AI takes 301s → FAILS ❌
- No idea which part was slow
- All-or-nothing approach
```

### With Stage Tracking
```
Total timeout: 300s
Stage 1: 15s ✅
Stage 2: 12s ✅
Stage 3: 285s ❌ (timed out)
Stage 4: not reached

ERROR: "Generation failed at stage 'generating' after 312s: 
        Content generation timed out after 285s"

Now we know: AI generation is the bottleneck!
```

### With Streaming (Future)
```
Total timeout: 300s (but reset per chunk)
Chunk 1: 45s ✅
Chunk 2: 52s ✅  
Chunk 3: 61s ✅
Chunk 4: 48s ✅
Chunk 5: 39s ✅

Total: 245s ✅ (even though each chunk took 45-61s)
```

---

## ✅ Summary

### Your Idea: ✅ Partially Correct

**What Works**:
- ✅ Breaking generation into stages
- ✅ Monitoring each stage individually
- ✅ Better error messages

**What Doesn't Work**:
- ❌ Can't extend total 300s Vercel limit
- ❌ Per-stage timeouts don't add up to more total time

### Better Approach: Progressive Timeout

1. **Stage tracking** for better errors
2. **Dynamic timeout allocation** based on remaining time
3. **Streaming API** (future) to reset timeout naturally

### Quick Win Implementation

Add stage logging NOW:
```typescript
console.log('⏱️ [STAGE 3/4: generating] Starting...');
```

This helps debug without major refactoring!

---

**Status**: Ready to implement stage tracking as quick improvement! 🚀
