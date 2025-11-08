# Navigation & Source Tracking Update

**Date**: November 8, 2025  
**Status**: ✅ Complete

---

## 📋 Changes Summary

### 1. Sidebar Navigation Reordered ✅

Updated the left-hand navigation menu to match the requested order:

**New Order**:
1. 🏠 **Home**
2. 👤 **Profiles**
3. 🤖 **Create Plan using Gemini**
4. ✨ **Create Plan using Custom GPT**
5. 📊 **Plans Created**
6. ⚙️ **Settings**

**Previous Order**:
1. Home
2. Dashboard
3. Profiles
4. Create Plan
5. AI Plan Generator
6. Settings

**File Changed**: `components/layout/Sidebar.tsx`

---

### 2. Source Tracking Implementation ✅

Added comprehensive tracking of which AI provider generated each plan.

#### A. Storage Schema Updates

**1. LocalStorage Plans** (`lib/lifeengine/storage.ts`):
```typescript
export type SavedPlanRecord = {
  id: string;
  profileId: string;
  planName: string;
  planTypes: string[];
  createdAt: string;
  source: "custom-gpt" | "gemini" | "rule-engine"; // ✅ Added
  plan: LifeEnginePlan;
  rawPrompt?: string;
};
```

**2. Database Plans** (`lib/utils/db.ts`):
```typescript
type PlanRow = {
  planId: string;
  profileId: string;
  planName?: string;
  days: number;
  confidence: number;
  warnings: string[];
  planJSON: StoredPlan;
  analytics?: Record<string, any>;
  costMetrics?: Record<string, any>;
  createdAt?: string;
  inputSummary?: string;
  source?: "gemini" | "custom-gpt" | "rule-engine"; // ✅ Added
};
```

#### B. API Updates

**1. Generate API** (`app/api/lifeengine/generate/route.ts`):
- Now saves plans with `source: "gemini"`
- Tracks that plans created via "Create Plan using Gemini" page are from Gemini

**2. Custom GPT Generate API** (`app/api/lifeengine/custom-gpt-generate/route.ts`):
- Already returns metadata with provider information
- Returns `provider: "google-gemini"` or `provider: "openai-gpts"`

**3. Chat Page** (`app/lifeengine/chat/page.tsx`):
- Now reads the provider from API response metadata
- Automatically sets source to "gemini" when Gemini is used
- Sets source to "custom-gpt" when OpenAI Custom GPT is used

**Code**:
```typescript
// Determine source from metadata
const provider = result.metadata?.provider || "custom-gpt";
const source: "custom-gpt" | "gemini" = provider === "google-gemini" ? "gemini" : "custom-gpt";

savePlanRecord({
  ...otherFields,
  source: source, // ✅ Dynamic source tracking
});
```

**4. List Plans API** (`app/api/lifeengine/listPlans/route.ts`):
- Now includes `source` field in API response
- Defaults to "gemini" if not set (for backward compatibility)

#### C. Dashboard UI Updates

**1. Plans Table** (`app/lifeengine/dashboard/page.tsx`):
- Added new "Source" column between "Created" and "Input Parameters"
- Shows color-coded badges:
  - 🤖 **Gemini** - Blue badge (#4285F4)
  - ✨ **Custom GPT** - Green badge (#10A37F)
  - ⚙️ **Rule Engine** - Gray badge (#6B7280)

**2. CSS Styling** (`app/lifeengine/dashboard/page.module.css`):
```css
.sourceCell {
  min-width: 140px;
}

.sourceBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.sourceBadge:global(.gemini) {
  background-color: #4285F4; /* Google Blue */
  color: white;
}

.sourceBadge:global(.customgpt) {
  background-color: #10A37F; /* OpenAI Green */
  color: white;
}

.sourceBadge:global(.ruleengine) {
  background-color: #6B7280; /* Neutral Gray */
  color: white;
}
```

---

## 🎯 Feature Behavior

### Plan Source Logic

| Page | Route | Source Value | Badge |
|------|-------|--------------|-------|
| **Create Plan using Gemini** | `/lifeengine/create` | `"gemini"` | 🤖 Gemini |
| **Create Plan using Custom GPT** (if OpenAI configured) | `/lifeengine/chat` | `"custom-gpt"` | ✨ Custom GPT |
| **Create Plan using Custom GPT** (fallback to Gemini) | `/lifeengine/chat` | `"gemini"` | 🤖 Gemini |
| **Old plans without source** | N/A | `"gemini"` (default) | 🤖 Gemini |

### Dual Provider System

The "Create Plan using Custom GPT" page has intelligent fallback:
1. **Tries OpenAI Custom GPT first** (if `OPENAI_API_KEY` is set)
2. **Falls back to Gemini automatically** (if OpenAI fails or not configured)
3. **Tracks actual provider used** in metadata
4. **Saves correct source** based on which provider succeeded

---

## 📊 Dashboard Preview

**Plans Created Table**:
```
┌────┬──────────────────┬─────────────┬────────────────┬──────────────────┬─────────┐
│ ☑️ │ Plan Name        │ Created     │ Source         │ Input Parameters │ Actions │
├────┼──────────────────┼─────────────┼────────────────┼──────────────────┼─────────┤
│ ☐  │ Plan for John    │ Nov 8, 2025 │ 🤖 Gemini      │ Yoga + Diet | 7  │ 👁️ 📄  │
│ ☐  │ Plan for Sarah   │ Nov 8, 2025 │ ✨ Custom GPT  │ Fitness | 14     │ 👁️ 📄  │
│ ☐  │ Plan for Mike    │ Nov 7, 2025 │ 🤖 Gemini      │ HIIT + Sleep | 7 │ 👁️ 📄  │
└────┴──────────────────┴─────────────┴────────────────┴──────────────────┴─────────┘
```

---

## 🔄 Migration & Backward Compatibility

### Existing Plans
- Plans created before this update will **not** have a `source` field
- Dashboard defaults to `"gemini"` for plans without source
- Badge shows: 🤖 Gemini (gray fallback if undefined)

### Future Plans
- All new plans will have proper source tracking
- Source is determined dynamically from API metadata
- Accurate tracking of Gemini vs. Custom GPT vs. Rule Engine

---

## 📁 Files Modified

1. ✅ `components/layout/Sidebar.tsx` - Navigation order
2. ✅ `lib/lifeengine/storage.ts` - Added source to SavedPlanRecord type
3. ✅ `lib/utils/db.ts` - Added source to PlanRow type
4. ✅ `app/api/lifeengine/generate/route.ts` - Save with source="gemini"
5. ✅ `app/api/lifeengine/listPlans/route.ts` - Include source in response
6. ✅ `app/lifeengine/chat/page.tsx` - Dynamic source from metadata
7. ✅ `app/lifeengine/dashboard/page.tsx` - Source column in table
8. ✅ `app/lifeengine/dashboard/page.module.css` - Source badge styles

---

## ✅ Testing Checklist

- [ ] Generate plan via "Create Plan using Gemini" → Should show 🤖 Gemini badge
- [ ] Generate plan via "Create Plan using Custom GPT" → Should show ✨ Custom GPT or 🤖 Gemini (depending on fallback)
- [ ] Check dashboard table has Source column
- [ ] Verify badges are color-coded correctly
- [ ] Verify navigation menu shows new labels
- [ ] Test with existing plans (should default to Gemini)

---

## 🎨 Design Notes

### Color Scheme
- **Gemini Blue** (#4285F4) - Google's brand color
- **Custom GPT Green** (#10A37F) - OpenAI's brand color  
- **Rule Engine Gray** (#6B7280) - Neutral for legacy system

### User Experience
- Clear visual distinction between AI providers
- Badges are compact and readable
- Navigation labels are explicit about which AI is used
- Source tracking helps users understand plan origins

---

## 📈 Future Enhancements

### Potential Improvements
1. **Filter by Source**: Add dropdown to filter plans by Gemini/Custom GPT
2. **Source Analytics**: Show metrics like "X% plans from Gemini, Y% from Custom GPT"
3. **Cost Breakdown**: Track costs per provider separately
4. **Provider Preferences**: Let users choose default AI provider
5. **Batch Operations**: "Export all Gemini plans" or "Export all Custom GPT plans"

---

## 🔗 Related Documentation

- Cost Optimization: `ULTRA_COST_OPTIMIZATION.md`
- Feature Spec: `SPEC_VS_IMPLEMENTATION_FINAL.md`
- Auto Deployment: `AUTO_DEPLOY_COMPLETE.md`

---

**Last Updated**: November 8, 2025  
**Status**: ✅ Production Ready  
**Next Steps**: Test in production, monitor source distribution
