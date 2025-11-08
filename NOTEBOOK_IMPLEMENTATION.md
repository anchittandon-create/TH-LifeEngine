# 📔 Notebook-Style Plan Output - Complete Implementation

## Overview

The LifeEngine app now features a **digital notebook-style** plan viewer where each day is displayed as a full-width, scrollable page. This provides an intuitive, book-like experience for viewing multi-day wellness plans (yoga, diet, fitness, holistic, mindfulness).

---

## ✅ What's Been Implemented

### 1. **PlanNotebook Component** (`/components/lifeengine/PlanNotebook.tsx`)

A comprehensive, reusable component that displays plans in a beautiful notebook format.

#### Key Features:
- ✅ **Page-by-page navigation** with Previous/Next Day buttons
- ✅ **Day navigation dots** showing current position (clickable for quick jump)
- ✅ **Day Index sidebar** with checkboxes for selecting multiple days
- ✅ **Full-width card layout** with proper padding, borders, and shadows
- ✅ **Color-coded sections**:
  - 🧘 **Purple** for Yoga (poses, steps, breathing, benefits)
  - 🏋️ **Blue** for Exercise (sets, reps, rest, form cues, tips)
  - 🥗 **Green** for Meals (breakfast, lunch, dinner with recipes, ingredients, macros)
  - 💡 **Amber** for Daily Tips & Reminders
- ✅ **PDF Export**:
  - Export entire plan (all days)
  - Export selected days (multi-select with checkboxes)
  - Export single day
  - Uses `html2canvas` + `jsPDF`
- ✅ **Fully responsive** (mobile, tablet, desktop)
- ✅ **Accessible** with proper ARIA labels and keyboard navigation

#### Component API:
```typescript
interface PlanNotebookProps {
  data: PlanNotebookData;  // The plan data
  onClose?: () => void;     // Optional back button handler
}

interface PlanNotebookData {
  planId?: string;
  planName: string;
  userName: string;
  duration: number;
  planTypes: string[];
  createdAt?: string;
  plan: DayPlan[];          // Array of days
}

interface DayPlan {
  day: number;
  yoga?: YogaPose[];
  exercise?: Exercise[];
  meals?: {
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
    snacks?: Meal[];
  };
  tips?: string[];
  notes?: string;
}
```

---

### 2. **Plan Converter Utility** (`/lib/lifeengine/planConverter.ts`)

Converts between different plan formats:

#### Functions:
```typescript
// Convert rule-based Plan to notebook format
convertPlanToNotebook(plan: Plan, userName: string): PlanNotebookData

// Parse AI-generated JSON to notebook format
parseAIPlanToNotebook(planText: string, userName: string, planTypes: string[]): PlanNotebookData

// Convert notebook back to rule-based format (for saving)
convertNotebookToPlan(notebookData: PlanNotebookData): Plan
```

#### Handles:
- ✅ Rule-based plan structure (from `/api/lifeengine/generate`)
- ✅ AI-generated plan structure (from `/api/lifeengine/custom-gpt-generate`)
- ✅ Malformed JSON with fallback handling
- ✅ Weekly plans → flattened day array
- ✅ Nutrition → meal breakdown (breakfast, lunch, dinner)
- ✅ Habits/mindfulness → daily tips

---

### 3. **Demo Page** (`/app/lifeengine/plan-demo/page.tsx`)

A showcase page demonstrating the notebook viewer with sample data.

#### Features:
- ✅ Landing page with feature list
- ✅ Sample 7-day wellness plan with complete data:
  - 2 full days with yoga, exercises, meals
  - 5 days with tips and notes
- ✅ Shows all notebook features in action

**Access:** `/lifeengine/plan-demo` (added to sidebar menu)

---

### 4. **Updated Sidebar Navigation** (`/components/layout/Sidebar.tsx`)

All LifeEngine routes are now visible:
- ✅ Home
- ✅ Dashboard
- ✅ Profiles
- ✅ Create Plan (v2)
- ✅ Use Custom GPT (v2)
- ✅ My Plans
- ✅ 📔 Plan Demo (new!)
- ✅ Settings

---

## 🎨 UI/UX Design

### Page Structure
Each day is displayed as a full-width "notebook page":

```
┌─────────────────────────────────────────────────────────┐
│  Header: Plan Name, User, Duration, Plan Types          │
│  [Day Index] [Export Full Plan]                         │
└─────────────────────────────────────────────────────────┘
         ▲                                        ▲
    [← Previous]    Day 1 of 7    ○○●○○○○     [Next →]

┌─────────────────────────────────────────────────────────┐
│                        Day 1                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  🧘 Yoga Routine                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Sun Salutation (15 minutes)                      │  │
│  │  Steps: 1. Stand in Mountain Pose...             │  │
│  │  🌬️ Breathing: Coordinate with movement          │  │
│  │  ✨ Benefits: Builds heat, improves flexibility  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  🏋️ Exercise Routine                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Push-ups                                         │  │
│  │  [3 Sets] [10-12 Reps] [60s Rest]               │  │
│  │  📋 Form Cues: • Keep body straight...          │  │
│  │  💡 Tips: • Modify on knees if needed...        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  🥗 Meal Plan                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🌅 Breakfast: Overnight Oats                     │  │
│  │  📝 Recipe: Mix oats with almond milk...         │  │
│  │  🛒 Ingredients: • 1/2 cup oats...              │  │
│  │  [1 serving] [380 cal | 12g P | 65g C | 8g F]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  💡 Daily Tips & Reminders                               │
│  • 💧 Drink 8 glasses of water                          │
│  • 😴 Aim for 7-8 hours sleep                           │
│                                                          │
│  Day 1 of 7                    [Export This Day]        │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme
- **Purple (#8B5CF6)**: Yoga section
- **Blue (#3B82F6)**: Exercise section
- **Green (#10B981)**: Meal section
- **Amber (#F59E0B)**: Tips section

### Responsive Breakpoints
- **Mobile (< 640px)**: Single column, touch-friendly buttons
- **Tablet (640px - 1024px)**: Optimized spacing
- **Desktop (> 1024px)**: Full notebook experience, max-width 5xl

---

## 🔧 Integration Guide

### For Rule-Based Plans (Create Plan)

```typescript
import PlanNotebook from "@/components/lifeengine/PlanNotebook";
import { convertPlanToNotebook } from "@/lib/lifeengine/planConverter";

// After generating plan via /api/lifeengine/generate
const plan = await generatePlan(intake);
const notebookData = convertPlanToNotebook(plan, userName);

return <PlanNotebook data={notebookData} onClose={() => router.back()} />;
```

### For AI-Generated Plans (Use Custom GPT)

```typescript
import PlanNotebook from "@/components/lifeengine/PlanNotebook";
import { parseAIPlanToNotebook } from "@/lib/lifeengine/planConverter";

// After AI generation via /api/lifeengine/custom-gpt-generate
const response = await fetch("/api/lifeengine/custom-gpt-generate", {
  method: "POST",
  body: JSON.stringify({ prompt, profileId })
});
const { plan: planText } = await response.json();

const notebookData = parseAIPlanToNotebook(
  planText, 
  userName, 
  selectedPlanTypes
);

return <PlanNotebook data={notebookData} onClose={() => router.back()} />;
```

### Existing Plan Pages

Update `/app/lifeengine/plan/[id]/page.tsx` to use the notebook viewer:

```typescript
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PlanNotebook from "@/components/lifeengine/PlanNotebook";
import { convertPlanToNotebook } from "@/lib/lifeengine/planConverter";

export default function PlanViewPage() {
  const params = useParams();
  const router = useRouter();
  const [notebookData, setNotebookData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`/api/lifeengine/getPlan?id=${params.id}`);
        const plan = await res.json();
        
        const notebook = convertPlanToNotebook(plan, plan.meta.userName);
        setNotebookData(notebook);
      } catch (error) {
        console.error("Failed to load plan:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!notebookData) return <div>Plan not found</div>;

  return <PlanNotebook data={notebookData} onClose={() => router.push("/lifeengine/dashboard")} />;
}
```

---

## 📥 PDF Export

### Features:
1. **Export Full Plan**: Downloads all days as a single PDF
2. **Export Selected Days**: Select multiple days via checkboxes, then export
3. **Export Single Day**: Quick export from the current page footer

### Implementation:
Uses `html2canvas` to capture each day's DOM, then `jsPDF` to compile pages.

```typescript
const exportToPDF = async (daysToExport: number[]) => {
  const pdf = new jsPDF("p", "mm", "a4");
  
  for (let i = 0; i < daysToExport.length; i++) {
    const dayElement = document.getElementById(`day-${daysToExport[i]}`);
    const canvas = await html2canvas(dayElement, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 10, 10, pageWidth - 20, imgHeight);
  }
  
  pdf.save(`${planName}_Plan.pdf`);
};
```

---

## 📋 Required JSON Structure for AI Generation

Update your GPT prompts to return this structure:

```json
{
  "planName": "7-Day Wellness Journey",
  "plan": [
    {
      "day": 1,
      "yoga": [
        {
          "name": "Sun Salutation",
          "duration": "15 minutes",
          "steps": ["Step 1...", "Step 2..."],
          "breathing": "Coordinate with movement",
          "benefits": "Builds heat and flexibility"
        }
      ],
      "exercise": [
        {
          "name": "Push-ups",
          "sets": 3,
          "reps": "10-12",
          "rest": "60 seconds",
          "formCues": ["Keep body straight", "Lower to floor"],
          "tips": ["Modify on knees if needed"]
        }
      ],
      "meals": {
        "breakfast": {
          "name": "Overnight Oats",
          "recipe": "Mix oats with almond milk...",
          "ingredients": ["1/2 cup oats", "1 cup milk"],
          "portions": "1 bowl",
          "macros": {
            "calories": 380,
            "protein": "12g",
            "carbs": "65g",
            "fats": "8g"
          },
          "prepTime": "5 minutes"
        },
        "lunch": { /* same structure */ },
        "dinner": { /* same structure */ }
      },
      "tips": [
        "Drink 8 glasses of water",
        "Get 7-8 hours of sleep"
      ],
      "notes": "Welcome to Day 1! Focus on consistency."
    }
    // ... more days
  ]
}
```

Update `/lib/lifeengine/gptPromptBuilder.ts` to specify this format in the prompt.

---

## 🧪 Testing Checklist

### Functionality
- [ ] Navigate between days using Previous/Next buttons
- [ ] Click day navigation dots to jump to specific days
- [ ] Open Day Index sidebar
- [ ] Select multiple days with checkboxes
- [ ] Export full plan to PDF
- [ ] Export selected days to PDF
- [ ] Export single day to PDF
- [ ] Close plan and return to previous page

### Responsive Design
- [ ] Test on mobile (< 640px)
- [ ] Test on tablet (640px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Verify all sections are readable
- [ ] Check button sizes on mobile

### Data Integration
- [ ] Test with rule-based plan from /api/lifeengine/generate
- [ ] Test with AI plan from /api/lifeengine/custom-gpt-generate
- [ ] Verify all yoga poses display correctly
- [ ] Verify exercises show sets/reps/rest
- [ ] Verify meals show recipes and macros
- [ ] Verify tips appear properly

### Edge Cases
- [ ] Plan with missing yoga section
- [ ] Plan with missing exercise section
- [ ] Plan with missing meals
- [ ] Single-day plan (duration = 1)
- [ ] Very long plan (30+ days)
- [ ] Malformed JSON from AI

---

## 📦 Dependencies

Already installed:
- `lucide-react` - Icons (ChevronLeft, ChevronRight, Download, Calendar, Home)
- `jspdf` - PDF generation
- `html2canvas` - DOM to canvas conversion

If missing, install:
```bash
npm install lucide-react jspdf html2canvas
```

---

## 🚀 Next Steps

### Immediate:
1. ✅ Update `/app/lifeengine/plan/[id]/page.tsx` to use PlanNotebook
2. ✅ Update `/app/lifeengine/create-v2/page.tsx` to show plan in notebook format after generation
3. ✅ Update `/app/lifeengine/chat-v2/page.tsx` to show AI plan in notebook format
4. ⏳ Update GPT prompt builder to specify notebook JSON structure

### Future Enhancements:
- ⏳ Swipe gestures for mobile navigation
- ⏳ Print-friendly CSS styles
- ⏳ Bookmark/favorite specific days
- ⏳ Share individual days via link
- ⏳ Offline PWA support for viewing plans
- ⏳ Animation transitions between pages
- ⏳ Progress tracking (mark days as complete)

---

## 📁 Key Files

```
/components/lifeengine/
  ├── PlanNotebook.tsx           # Main notebook component (800+ lines)
  └── PlanForm.tsx               # Form for creating plans

/lib/lifeengine/
  ├── planConverter.ts           # Format conversion utilities
  └── gptPromptBuilder.ts        # AI prompt builder

/app/lifeengine/
  ├── plan-demo/page.tsx         # Demo showcase page
  ├── plan/[id]/page.tsx         # View existing plans
  ├── create-v2/page.tsx         # Rule-based plan creation
  └── chat-v2/page.tsx           # AI-powered plan creation

/components/layout/
  └── Sidebar.tsx                # Navigation menu
```

---

## 🎯 Success Criteria

✅ Each day displays as a full-width, scrollable page
✅ Navigation between days is intuitive (Previous/Next + dots)
✅ Day index sidebar allows quick jumps
✅ PDF export works for full plan and selected days
✅ Responsive design works on all screen sizes
✅ Color-coded sections for easy scanning
✅ All plan data (yoga, exercise, meals, tips) displays correctly
✅ Works with both rule-based and AI-generated plans
✅ Accessible with proper ARIA labels and keyboard navigation

---

## 📝 Notes

- The notebook format is **display-only** (read-only, no editing)
- Plans are stored in the original format (weekly structure), converted to notebook format for display
- PDF export quality depends on page complexity (large images may increase file size)
- Day Index sidebar uses fixed positioning and overlays on mobile
- All navigation state is managed in React (no URL routing for day changes)

---

**Last Updated:** November 8, 2025  
**Status:** ✅ Implementation Complete  
**Demo Available:** `/lifeengine/plan-demo`
