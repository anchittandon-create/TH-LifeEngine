# ⚡ Quick Reference: Step-by-Step Instructions

## 🎯 What Changed

**OLD**: Plans had basic activity names  
**NEW**: Plans have detailed step-by-step instructions for everything

---

## 🧘 Yoga Poses Now Include:
- ✅ Step-by-step performance instructions
- ✅ Breathing cues (when to inhale/exhale)
- ✅ Benefits of each pose
- ✅ Modifications for beginners
- ✅ Common mistakes to avoid

---

## 🏋️ Exercises Now Include:
- ✅ Exact sets & reps (e.g., "3 sets of 12 reps")
- ✅ Rest periods ("60 seconds rest")
- ✅ Form cues ("Keep back straight, core engaged")
- ✅ Common mistakes to avoid
- ✅ Progressions (make it harder)
- ✅ Regressions (make it easier)

---

## 🥗 Meals Now Include:
- ✅ Complete ingredients list with quantities
- ✅ Step-by-step recipe instructions
- ✅ Preparation time & cooking time
- ✅ Portion guidance
- ✅ Healthy swap suggestions

---

## 🎨 UI Improvements

### Accordion Days (NEW)
```
Click day header → Expands to show content
Click again → Collapses to hide content
```

### Tab Navigation (NEW)
```
🧘‍♀️ Yoga → All yoga poses for the day
🏋️ Exercises → All workouts for the day
🥗 Meals → Breakfast, lunch, dinner, snacks
🌟 Wellness → Mindfulness, affirmations, sleep
```

### Color Coding
- **Purple** = Yoga section
- **Orange** = Exercises section
- **Green** = Meals/Diet section
- **Blue** = Wellness section

---

## 📝 Example: Yoga Pose

```
Mountain Pose (Tadasana) - 3 min

✨ Benefits:
Improves posture, strengthens thighs, knees, ankles

📋 How to Perform:
Step 1: Stand with feet hip-width apart
Step 2: Ground through all four corners of feet
Step 3: Engage thighs and lift kneecaps
Step 4: Lengthen spine and relax shoulders
Step 5: Gaze softly forward

🌬️ Breathing:
Inhale deeply for 4 counts, exhale slowly for 6 counts

💡 Modifications:
Stand with feet wider if balance is difficult

⚠️ Avoid:
• Don't lock your knees
• Avoid arching lower back
• Don't tense shoulders
```

---

## 📝 Example: Exercise

```
Push-ups - 8 min
STRENGTH

🔢 3 sets  ⚡ 12 reps  ⏸️ Rest: 60 seconds

📋 Movement Instructions:
Step 1: Start in plank position, hands shoulder-width
Step 2: Lower body by bending elbows
Step 3: Push through hands to return
Step 4: Keep core engaged throughout

✅ Form Cues:
• Keep body in straight line
• Engage core to prevent sagging
• Elbows at 45° angle

⚠️ Common Mistakes:
• Don't let hips sag or pike up
• Avoid flaring elbows out
• Don't hold your breath

⬆️ Progress: Try decline push-ups
⬇️ Regress: Perform on knees or against wall
```

---

## 📝 Example: Meal

```
🌅 Breakfast
Prep: 5 min | Cook: 8 min

Protein-Packed Veggie Omelette

🛒 Ingredients:
• 2 large eggs
• 1/4 cup bell peppers, diced
• 1/4 cup spinach, chopped
• 1 tbsp olive oil
• Salt and pepper to taste

👨‍🍳 Preparation Steps:
Step 1: Heat olive oil in pan
Step 2: Whisk eggs with salt/pepper
Step 3: Sauté peppers for 2 minutes
Step 4: Add spinach, cook until wilted
Step 5: Pour eggs over vegetables
Step 6: Cook 3-4 minutes until set
Step 7: Fold in half and serve

💡 High in protein and vitamins A & K

📏 Portion: 1 omelette (~300 calories)

🔄 Healthy Swap: Use egg whites or tofu scramble
```

---

## 🚀 How to Use

1. **Generate Plan**: Use-Custom-GPT page
2. **View Dashboard**: See all your plans
3. **Click "View"**: Open any plan
4. **Expand Day**: Click day header (e.g., "Monday")
5. **Use Tabs**: Switch between Yoga/Exercises/Meals
6. **Follow Steps**: Read numbered instructions
7. **Download PDF**: Save for offline use

---

## ✨ Key Benefits

✅ **Actionable** - Know exactly what to do  
✅ **Safe** - Avoid common mistakes  
✅ **Effective** - Proper form = better results  
✅ **Easy** - Step-by-step = no confusion  
✅ **Professional** - Like having a personal trainer  
✅ **Organized** - Clean accordion interface  

---

## 📊 Quality Assurance

Plans are automatically validated for completeness:
- **85-100%**: Excellent (all details included)
- **70-84%**: Good (minor gaps)
- **Below 70%**: Needs improvement

Check console logs to see validation scores!

---

## 🔍 Where to Find Things

### Files:
- **Prompt logic**: `lib/lifeengine/promptBuilder.ts`
- **Types**: `app/types/lifeengine.ts`
- **UI component**: `app/components/PlanPreview.tsx`
- **Validation**: `lib/lifeengine/customGptService.ts`

### Documentation:
- **Technical**: `STEP_BY_STEP_INSTRUCTIONS_COMPLETE.md`
- **Visual guide**: `VISUAL_GUIDE_STEP_BY_STEP.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **This card**: `QUICK_REFERENCE_STEP_BY_STEP.md`

---

## ⚡ Quick Commands

```bash
# Run dev server
npm run dev

# Check for errors
npm run type-check

# Build for production
npm run build
```

---

## 💡 Pro Tips

1. **Expand one day at a time** - Keeps interface clean
2. **Use tabs to focus** - Yoga, Exercises, Meals separately
3. **Follow steps in order** - They're numbered for a reason
4. **Read warnings** - Red badges prevent injuries
5. **Try modifications** - Start easier if needed

---

**Status**: ✅ Production Ready  
**Date**: November 8, 2025  
**Version**: 1.0.0
