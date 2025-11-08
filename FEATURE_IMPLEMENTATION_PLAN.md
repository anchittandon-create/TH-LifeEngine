# Complete Feature Implementation Plan

**Date:** November 8, 2025  
**Scope:** Build 3 fully functional features (Yoga Planner, Sleep Optimizer, Habit Tracker)

---

## Current Status - All 10 Menu Items

✅ **Working Pages:**
1. Home (`/lifeengine`) - Landing page
2. Profiles (`/lifeengine/profiles`) - User profile management
3. Create Plan - Gemini (`/lifeengine/create`) - Rule-based plan generation
4. Create Plan - Custom GPT (`/use-custom-gpt`) - AI-powered generation
5. Dashboard (`/lifeengine/dashboard`) - View all created plans
6. Diet Builder (`/lifeengine/diet`) - Complete feature with meal planning
7. Settings (`/lifeengine/settings`) - App settings

🚧 **Needs Implementation:**
8. Yoga Planner (`/lifeengine/yoga`) - Currently placeholder
9. Sleep Optimizer (`/lifeengine/sleep`) - Currently placeholder
10. Habit Tracker (`/lifeengine/habits`) - Currently placeholder

---

## Implementation Approach

Given the scope, I'll create **fully functional but simplified** versions that can be enhanced later:

### Phase 1: Core Functionality (MVP)
- Working UI with real state management
- Local storage persistence
- Profile integration
- Basic tracking and analytics

### Phase 2: Future Enhancements
- Backend API integration
- AI-powered recommendations
- Advanced analytics
- Export/import features

---

## Feature 1: Yoga Planner 🧘

### Core Features:
1. **Pose Library** - 10+ pre-configured yoga poses with instructions
2. **Sequence Builder** - Create custom sequences by selecting poses
3. **Practice Timer** - Guided timer for each pose in sequence
4. **Practice History** - Track completed sessions
5. **My Sequences** - Save and reuse favorite sequences

### Implementation:
- **State:** React hooks (useState, useEffect)
- **Storage:** localStorage for sequences and sessions
- **Timer:** useEffect-based countdown
- **UI:** Cards, grids, overlay modal for active practice

### Data Structure:
```typescript
interface YogaPose {
  id: string;
  name: string;
  sanskritName: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // seconds
  benefits: string[];
  instructions: string[];
  category: string;
}

interface YogaSequence {
  id: string;
  name: string;
  profileId: string;
  level: string;
  duration: number; // total minutes
  poses: YogaPose[];
  createdAt: string;
}

interface YogaSession {
  id: string;
  sequenceId: string;
  sequenceName: string;
  date: string;
  duration: number;
  completed: boolean;
}
```

---

## Feature 2: Sleep Optimizer 😴

### Core Features:
1. **Sleep Logger** - Daily sleep tracking (bedtime, wake time, quality)
2. **Sleep Stats** - Average sleep hours, quality trends, consistency score
3. **Sleep Goals** - Set target hours and bedtime
4. **Insights** - Simple recommendations based on patterns
5. **Weekly View** - Calendar visualization of sleep data

### Implementation:
- **State:** React hooks for form and data
- **Storage:** localStorage for sleep logs
- **Analytics:** Calculate averages, streaks, trends
- **UI:** Form, calendar grid, stats cards

### Data Structure:
```typescript
interface SleepLog {
  id: string;
  profileId: string;
  date: string;
  bedtime: string; // "22:30"
  wakeTime: string; // "06:30"
  duration: number; // hours
  quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  factors: string[]; // "caffeine", "stress", "exercise"
}

interface SleepGoal {
  profileId: string;
  targetHours: number;
  targetBedtime: string;
  targetWakeTime: string;
}

interface SleepInsight {
  type: "positive" | "warning" | "tip";
  message: string;
  recommendation?: string;
}
```

---

## Feature 3: Habit Tracker ✅

### Core Features:
1. **Create Habits** - Custom habits with frequency goals
2. **Daily Check-in** - Mark habits as complete each day
3. **Streak Tracking** - Current streak and best streak
4. **Calendar View** - Visual completion calendar
5. **Progress Analytics** - Completion rate, consistency

### Implementation:
- **State:** React hooks for habits and completions
- **Storage:** localStorage for habits and daily logs
- **Analytics:** Calculate streaks, completion rates
- **UI:** Habit cards, calendar heatmap, stats

### Data Structure:
```typescript
interface Habit {
  id: string;
  profileId: string;
  name: string;
  category: string; // "health", "fitness", "mindfulness", "nutrition"
  frequency: "daily" | "weekdays" | "weekends" | "custom";
  goal: string; // e.g., "Drink 8 glasses of water"
  icon: string;
  color: string;
  createdAt: string;
  active: boolean;
}

interface HabitCompletion {
  habitId: string;
  date: string; // "2025-11-08"
  completed: boolean;
  notes?: string;
}

interface HabitStats {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  completionRate: number; // percentage
  totalCompletions: number;
}
```

---

## Shared Components & Utilities

### 1. Stats Card Component
```typescript
<StatCard
  value={42}
  label="Total Sessions"
  icon="🔥"
  trend="+5 this week"
/>
```

### 2. Calendar Heatmap
```typescript
<CalendarHeatmap
  data={completions}
  onDateClick={(date) => showDetails(date)}
/>
```

### 3. Progress Ring
```typescript
<ProgressRing
  value={75}
  max={100}
  size="large"
  color="green"
/>
```

---

## File Structure

```
app/lifeengine/
├── yoga/
│   ├── page.tsx              # Main yoga planner page
│   └── page.module.css       # Styles
├── sleep/
│   ├── page.tsx              # Sleep optimizer page
│   └── page.module.css       # Styles
└── habits/
    ├── page.tsx              # Habit tracker page
    └── page.module.css       # Styles

lib/
├── yoga/
│   └── poses.ts              # Pre-configured poses library
├── sleep/
│   └── analytics.ts          # Sleep calculations
└── habits/
    └── utils.ts              # Streak calculations
```

---

## Implementation Priority

### Immediate (Today):
1. ✅ Yoga Planner - Most requested, complete feature
2. ✅ Sleep Optimizer - Essential wellness tool
3. ✅ Habit Tracker - Supports long-term behavior change

### Near Future:
- Backend API integration for all three features
- AI recommendations (e.g., pose sequences based on goals)
- Social features (share sequences, compete on streaks)
- Export data (PDF reports, CSV)

---

## Design Consistency

All three features will follow the existing app patterns:

### Colors:
- **Yoga:** Purple/Pink gradient (`from-purple-50 via-white to-pink-50`)
- **Sleep:** Indigo/Blue gradient (`from-indigo-50 via-white to-blue-50`)
- **Habits:** Green/Emerald gradient (`from-green-50 via-white to-emerald-50`)

### Layout:
- Centered max-width container (1000px)
- Section cards with rounded corners
- Gradient backgrounds
- Consistent spacing (Tailwind: p-6, gap-4)

### Typography:
- Title: text-4xl font-bold
- Subtitle: text-lg text-gray-600
- Section headings: text-2xl font-semibold

---

## Next Steps

1. **Create Yoga Planner** with full implementation
2. **Create Sleep Optimizer** with logging and analytics
3. **Create Habit Tracker** with streak tracking
4. **Create shared CSS module** for common styles
5. **Test all features** with profile integration
6. **Document** usage and API endpoints (for future backend)

---

## Success Criteria

Each feature must have:
- ✅ Working UI (no errors)
- ✅ Data persistence (localStorage)
- ✅ Profile integration
- ✅ Basic analytics/stats
- ✅ Mobile responsive
- ✅ Professional design
- ✅ Clear user flows

---

**Estimated Time:** 2-3 hours per feature for complete MVP  
**Total Lines:** ~500-800 per feature  
**Dependencies:** Existing UI components (Button, Input, Select, etc.)

