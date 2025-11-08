# ✨ TH-LifeEngine v2.0 System Prompt - Deployed

**Date**: November 9, 2025  
**Status**: ✅ DEPLOYED TO PRODUCTION  
**Version**: 2.0 - Complete Plan Generation System

---

## 🎯 What's New in v2.0

### Enhanced System Prompt
Upgraded from basic wellness coach to **comprehensive AI wellness architect** with:

1. **Structured Output Requirements**
   - Mandatory header with user profile summary
   - Complete morning, midday, and evening routines
   - Optional add-ons for recovery, tracking, and motivation

2. **Zero Vagueness Policy**
   - Every instruction must be step-by-step
   - Every recipe must have exact measurements and cooking steps
   - Every exercise must have posture cues, duration, and safety notes

3. **JSON Output Structure**
   - Defined precise JSON schema for consistent parsing
   - Includes all meal macros, exercise details, and mindfulness activities
   - Weekly guidance with rest days and progress checkpoints

4. **Complete Daily Flow**
   ```
   🌅 Morning Routine
   ├── Wake-up time + hydration
   ├── Affirmations/gratitude
   ├── Yoga/stretch flow (detailed poses)
   └── Breakfast (full recipe)
   
   ☀️ Midday Routine
   ├── Workout (warm-up, main, cool-down)
   ├── Lunch (full recipe)
   └── Mindfulness practice
   
   🌇 Evening Routine
   ├── Evening snack
   ├── Mobility/stretching
   ├── Dinner (full recipe)
   ├── Night reflection
   └── Sleep hygiene protocol
   ```

---

## 📋 Key Improvements

### 1. Recipe Completeness
**Before v2.0**:
```
Breakfast: Oats with banana
```

**After v2.0**:
```
Breakfast: Banana Oats with Chia Seeds — 320 kcal

Ingredients:
- Rolled oats: 40g
- Low-fat milk: 200ml
- Banana (medium): 100g (1 whole)
- Chia seeds: 1 tsp (5g)
- Honey: 1 tsp (7g)

Steps:
1. Heat milk in a saucepan over medium heat (2 min)
2. Add oats and cook for 5 minutes, stirring occasionally
3. Slice banana and mix into oats
4. Sprinkle chia seeds on top
5. Drizzle honey before serving
6. Serve warm

Macros: Protein 10g | Carbs 55g | Fats 8g
Serving: 1 bowl (350ml)
```

### 2. Yoga/Exercise Detail
**Before v2.0**:
```
Do Surya Namaskar
```

**After v2.0**:
```
Surya Namaskar (Sun Salutation) — 3 rounds × 12 poses

1. Pranamasana (Prayer Pose)
   Steps:
   - Stand at the front of your mat, feet together
   - Bring palms together at heart center
   - Close eyes, take 3 deep breaths
   Breathing: Inhale deeply, exhale slowly
   Duration: 10 seconds
   Benefits: Centers mind, activates core
   Cautions: None

2. Hasta Uttanasana (Raised Arms Pose)
   Steps:
   - Inhale, raise arms overhead
   - Slight backbend, gaze up
   - Engage core, don't compress lower back
   Breathing: Deep inhale while raising arms
   Duration: 5 seconds
   Benefits: Opens chest, stretches abdomen
   Cautions: Avoid deep backbend if you have lower back pain

[Continues for all 12 poses with same detail level]
```

### 3. Mindfulness Integration
**Before v2.0**:
```
Do some meditation
```

**After v2.0**:
```
Midday Mindfulness: 4-7-8 Breathing Technique — 10 minutes

Activity: Stress Release Breathwork
Duration: 10 minutes
Environment: Quiet space, sit or lie down

Steps:
1. Find a comfortable seated position
2. Close your eyes and relax shoulders
3. Place one hand on chest, one on belly
4. Inhale through nose for 4 seconds (belly should rise)
5. Hold breath for 7 seconds (no tension)
6. Exhale through mouth for 8 seconds (complete release)
7. Repeat cycle 6-8 times
8. Notice sensations: warmth, tingling, calm

Expected Outcome: Reduced anxiety, mental clarity, lowered heart rate
```

---

## 🧘‍♀️ Core Principles

### 1. Explain Every "How" and "Why"
- ❌ "Do breathing exercises"
- ✅ "Practice 4-7-8 breathing: inhale for 4s, hold for 7s, exhale for 8s; repeat 6 rounds to activate parasympathetic nervous system"

### 2. Complete Recipes Always
Every meal includes:
- Recipe name with calorie count
- Ingredients with exact quantities (grams/ml/tsp)
- Numbered cooking steps with time
- Serving size
- Complete macro breakdown

### 3. Safety First
Every physical activity includes:
- Exact execution steps
- Breathing patterns
- Duration/reps/sets
- Benefits (what it targets)
- Cautions (who should avoid or modify)

### 4. Personalization
Adapts to:
- Dietary preferences (veg, vegan, keto, etc.)
- Medical conditions (PCOS, diabetes, thyroid, etc.)
- Work schedules (9-5, night shift, student, etc.)
- Intensity levels (beginner, intermediate, advanced)
- Goals (weight loss, strength, stress relief, etc.)

---

## 📊 System Prompt Structure

### Input Processing
The prompt builder receives form data:
```typescript
{
  fullName: string,
  age: number,
  gender: string,
  duration: string,
  planTypes: string[],
  goals: string[],
  dietType: string,
  activityLevel: string,
  chronicConditions: string[],
  sleepHours: string,
  stressLevel: string,
  workSchedule: string,
  preferredTime: string,
  intensity: string,
  focusAreas: string[]
}
```

### System Message (2000+ tokens)
Comprehensive instructions covering:
- Core objective and mission
- Required output structure (5 sections)
- Style and depth requirements
- Communication tone
- Input variable handling
- Output rules
- JSON schema definition
- Example sections
- Final instructions

### User Prompt (1500+ tokens)
Personalized request with:
- Complete user profile
- Plan generation requirements
- Daily flow structure
- Nutrition guidelines
- Wellness components
- Output format template
- Important rules

---

## 💰 Token Economics

### Prompt Size
- **System Message**: ~2000 tokens
- **User Prompt**: ~1500 tokens
- **Total Input**: ~3500 tokens

### Response Size (Estimated)
- **7-day plan**: ~8,000-12,000 tokens
- **14-day plan**: ~15,000-20,000 tokens
- **30-day plan**: ~30,000-40,000 tokens

### Cost per Plan (with gpt-4o-mini)
- **Input**: 3,500 tokens × $0.15/1M = $0.000525
- **Output**: 12,000 tokens × $0.60/1M = $0.0072
- **Total**: ~$0.0077 per 7-day plan (~0.77 cents)

---

## 🔧 Technical Implementation

### File Updated
`lib/openai/promptBuilder.ts`

### Functions
1. **`buildSystemMessage()`**: Returns v2.0 system prompt (2000+ tokens)
2. **`buildCustomGPTPrompt(form)`**: Generates personalized user prompt
3. **`validateFormData(form)`**: Ensures required fields are present
4. **`estimateTokenCount(text)`**: Rough token estimation

### Integration
System message is used in:
- `app/api/lifeengine/custom-gpt-generate/route.ts`
- Sent as `role: "system"` in OpenAI Chat Completions

```typescript
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: buildSystemMessage() },  // v2.0 prompt
    { role: "user", content: buildCustomGPTPrompt(form) }
  ],
  response_format: { type: "json_object" }
});
```

---

## 🎨 Output Quality

### Completeness Score
v2.0 aims for **95%+ completeness** on:
- ✅ Every yoga pose has full instructions
- ✅ Every exercise has step-by-step form cues
- ✅ Every meal has complete recipe with macros
- ✅ Every mindfulness activity has guided steps
- ✅ Daily totals (calories, water, movement)
- ✅ Weekly guidance (rest days, checkpoints)

### Validation
The system includes validation function that checks:
- Yoga sequences have steps, breathing, benefits
- Exercises have steps, form cues, sets/reps
- Meals have ingredients and recipe steps
- Returns completeness score (0-100%)

---

## 🚀 Deployment

**Status**: ✅ **LIVE IN PRODUCTION**

**Deployment URL**: https://th-life-engine-1q6fecw1a-anchittandon-3589s-projects.vercel.app

**Inspection**: https://vercel.com/anchittandon-3589s-projects/th-life-engine/8EXhLUue2VZ63ZHicBpcuMnhLKuE

**Test URL**: https://th-life-engine.vercel.app/use-custom-gpt

---

## 📝 Usage Guide

### For Users
1. Go to `/use-custom-gpt`
2. Select profile and fill form
3. Click "Generate with Custom GPT"
4. Receive comprehensive, detailed plan
5. Download as PDF or view in notebook format

### Expected Output
- Complete daily routines from wake-up to bedtime
- Every recipe fully specified with ingredients and steps
- Every exercise/pose with detailed execution instructions
- Personalized to dietary preferences and health conditions
- Formatted as clean, readable markdown

---

## 🎯 Success Criteria

### Quality Benchmarks
- ✅ No vague suggestions ("do some yoga" → full pose instructions)
- ✅ All recipes actionable (ingredients + quantities + steps)
- ✅ All exercises safe (form cues + cautions)
- ✅ Complete daily structure (morning to night)
- ✅ Personalized to user profile
- ✅ Professional coach quality

### User Feedback Goals
- Can follow plan without additional research
- Feels like human coach, not AI
- Safe and appropriate for their conditions
- Motivating and achievable
- Clear measurements and progress tracking

---

## 🔍 Monitoring

### Cost Tracking
Every API call logs:
```
[COST TRACKING] Tokens - Input: 3500, Output: 12000, Total: 15500
[COST TRACKING] Estimated cost: $0.007725
```

### Quality Validation
Validation function reports:
```
📊 [CustomGPT] Step-by-step validation score: 92%
⚠️ [CustomGPT] Validation warnings (3): [list of missing details]
```

---

## 🎉 Summary

**v2.0 Transformation**:
- From basic wellness suggestions → comprehensive expert plans
- From vague instructions → step-by-step execution guides
- From incomplete recipes → full ingredients + cooking steps
- From generic routines → personalized daily structures

**User Experience**:
- Plans feel like they were written by a real coach
- Zero additional research needed
- Safe, actionable, and motivating
- Professional quality at AI speed

**Cost Efficiency**:
- ~$0.008 per 7-day plan with gpt-4o-mini
- ~$10/month = 1,250 plans
- Affordable for hobby project

---

*TH-LifeEngine v2.0 deployed by GitHub Copilot on November 9, 2025*
