# Step-by-Step Instructions Enhancement

## Problem
Gemini was generating plans without proper step-by-step guidance for users. Plans lacked:
- Detailed cooking instructions for meals
- Proper form instructions for exercises  
- Clear movement steps for yoga poses
- User couldn't follow along at home

## Solution Applied

### 1. **Enhanced Prompt Structure** (`lib/lifeengine/promptBuilder.ts`)

Added prominent headers and critical instructions at the TOP of prompt:

```
═══════════════════════════════════════════════════════════════
🎯 WELLNESS PLAN GENERATOR - DETAILED STEP-BY-STEP INSTRUCTIONS REQUIRED
═══════════════════════════════════════════════════════════════

⚠️  IMPORTANT: This plan will be followed by a REAL USER at home.
    You MUST provide EXTREMELY DETAILED, STEP-BY-STEP instructions for:
    - Every yoga pose (minimum 5 steps per pose)
    - Every exercise (minimum 5 steps per exercise)
    - Every meal recipe (minimum 5 cooking steps per meal)
```

### 2. **Specific Requirements for Each Activity Type**

#### **Yoga Poses:**
- **MINIMUM 5 DETAILED STEPS** per pose
- EXACT breathing pattern with counts
- 3-5 specific benefits
- EXACT duration (not just "3 min")
- 2-3 modifications for different levels
- 2-3 common mistakes to avoid
- Calories burned estimate

**Example:**
```
"Step 1: Start on hands and knees with wrists under shoulders and knees under hips"
"Step 2: Spread fingers wide and press palms firmly into mat"
"Step 3: Tuck toes under and lift hips up and back, straightening legs"
...
```

#### **Exercises:**
- **MINIMUM 5 DETAILED STEPS** for proper form
- EXACT sets & reps (e.g., '3 sets of 12 reps')
- Rest periods specified (e.g., '60 seconds rest between sets')
- 3-5 form cues
- 3-5 common mistakes
- Progression and regression options
- Calories burned
- Target muscles as array

**Example:**
```
"Step 1: Start in plank position with hands placed slightly wider than shoulder-width apart"
"Step 2: Position body in straight line from head to heels, feet hip-width apart"
"Step 3: Lower body by bending elbows at 45-degree angle, keeping close to sides"
...
```

#### **Meals (MOST CRITICAL):**
- ALL ingredients with EXACT quantities
- **MINIMUM 5 DETAILED RECIPE STEPS**
- EXACT prep time and cook time
- Portion guidance
- 1-2 healthy swaps
- Cooking tips
- Complete nutrition data (calories, protein, carbs, fat, fiber)

**Example:**
```
"Step 1: Heat 1 tablespoon olive oil in non-stick pan over medium heat for 1-2 minutes"
"Step 2: Add diced onions and bell peppers, sauté for 3-4 minutes until softened and golden"
"Step 3: Add spinach leaves and cook for 1 minute until wilted, then transfer to plate"
...
```

### 3. **Enhanced JSON Examples**

Replaced generic placeholders with REAL, DETAILED examples:

#### Before:
```json
"steps": string[], // ["Step 1: Begin in...", "Step 2: Inhale and..."]
```

#### After:
```json
"steps": [
  "Step 1: Start on hands and knees with wrists under shoulders and knees under hips",
  "Step 2: Spread fingers wide and press palms firmly into mat",
  "Step 3: Tuck toes under and lift hips up and back, straightening legs",
  "Step 4: Press chest toward thighs, keeping spine long and neutral",
  "Step 5: Relax head and neck, gaze toward feet or navel",
  "Step 6: Hold position while breathing deeply, pressing heels toward floor"
]
```

### 4. **Validation Requirements Section**

Added clear validation checklist at the END of prompt:

```
═══════════════════════════════════════════════════════════════
🚨 VALIDATION REQUIREMENTS - PLAN WILL BE REJECTED IF MISSING:
═══════════════════════════════════════════════════════════════

✅ 1. EVERY MEAL must have: calories, protein_g, carbs_g, fat_g, fiber_g
✅ 2. EVERY MEAL must have: ingredients array + recipe_steps array (minimum 5 steps)
✅ 3. EVERY YOGA POSE must have: steps array (minimum 5), breathing_instructions, calories_burned
✅ 4. EVERY EXERCISE must have: steps array (minimum 5), form_cues, calories_burned, target_muscles
✅ 5. ALL nutritional values must be REALISTIC and ACCURATE
✅ 6. ALL recipe_steps must be DETAILED enough for a beginner
✅ 7. ALL exercise/yoga steps must describe the FULL MOVEMENT from start to finish

🚨 REMEMBER: This plan is for a REAL USER who will follow these instructions AT HOME.
   They need COMPLETE, CLEAR, STEP-BY-STEP guidance. BE DETAILED!
```

## Expected Results

With these changes, Gemini should now generate plans where:

✅ **Yoga poses** have 5+ detailed steps describing the full movement
✅ **Exercises** have 5+ steps explaining proper form from start to finish
✅ **Meals** have 5+ cooking steps that a beginner can follow
✅ **All activities** include timing, cues, mistakes to avoid
✅ **All nutrition** data is present and accurate
✅ **User can follow along** at home without confusion

## Testing

To verify the fix:

1. Go to `/lifeengine/create`
2. Generate a new plan with any settings
3. Check that EVERY meal has:
   - Ingredients list with quantities
   - At least 5 detailed cooking steps
   - Complete nutrition data
4. Check that EVERY exercise has:
   - At least 5 form steps
   - Form cues and common mistakes
   - Calories and target muscles
5. Check that EVERY yoga pose has:
   - At least 5 movement steps
   - Breathing instructions
   - Calories burned

## Files Modified

- `lib/lifeengine/promptBuilder.ts` - Complete rewrite of instruction section with detailed examples and validation requirements

---

**Date:** November 8, 2025  
**Issue:** Missing step-by-step guidance in generated plans  
**Status:** ✅ Fixed - Enhanced prompt with detailed examples and validation requirements
