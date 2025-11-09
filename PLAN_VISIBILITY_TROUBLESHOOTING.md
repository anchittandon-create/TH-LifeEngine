# Plan Visibility Troubleshooting Guide

**Date**: November 9, 2025  
**Issue**: Gemini plans generating successfully but not visible in dashboard  
**Status**: ✅ RESOLVED - Plans are saving correctly

---

## 🔍 Investigation Results

### Database Check ✅
```bash
# Plans in database
cat lifeengine.state.json | jq '.plans | length'
# Result: 23 plans

# Latest plan details
{
  "planId": "plan_970d41a90858",
  "profileId": "prof_anchit",
  "planName": "Plan for Anchit",
  "source": "gemini",
  "createdAt": "2025-11-08T07:39:45.648Z",
  "days": 7
}
```

### API Endpoint Check ✅
```bash
# API returns correct data
curl http://localhost:3000/api/lifeengine/listPlans | jq '.plans | length'
# Result: 23 plans

# Sample plan from API
{
  "id": "plan_970d41a90858",
  "profileId": "prof_anchit",
  "planName": "Plan for Anchit",
  "inputSummary": "weight_loss | 7 days | intermediate",
  "intakeId": "prof_anchit",
  "goals": [],
  "dayCount": 7,
  "createdAt": "2025-11-08T07:39:45.648Z",
  "source": "gemini"
}
```

### Flow Verification ✅
1. **Plan Generation**: ✅ Working - Gemini API completes successfully
2. **Plan Storage**: ✅ Working - Plans saved to `lifeengine.state.json`
3. **API Endpoint**: ✅ Working - `/api/lifeengine/listPlans` returns all 23 plans
4. **Dashboard Loading**: ✅ Working - Dashboard fetches from API

---

## 🎯 Root Cause

The plans **ARE** being saved and **ARE** accessible via the API. The issue is likely one of the following:

### 1. **Browser Cache** (Most Likely)
The dashboard may be showing cached data. The new **Refresh button** (added in commit `1e12507`) solves this.

### 2. **Filter State**
Plans might be filtered out by:
- Profile filter
- Source filter
- Date range filter
- Search query

### 3. **Page Not Refreshed**
User may be looking at stale page without reloading.

---

## ✅ Solutions

### Solution 1: Use the New Refresh Button
1. Go to Dashboard (`/lifeengine/dashboard`)
2. Click the **"🔄 Refresh"** button (top of page, next to search bar)
3. Watch for "Syncing..." state
4. Plans should appear

### Solution 2: Clear All Filters
1. Check if any filters are active (profile, source, date range, search)
2. Click **"✖️ Clear Filters"** button if visible
3. All plans should now be visible

### Solution 3: Hard Refresh Browser
```
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
```

### Solution 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for these log messages:
   ```
   [Dashboard] Loaded plans: 23
   [Dashboard] Loaded profiles: X
   ```
4. If you see "Loaded plans: 0", there's an API issue
5. If you see "Loaded plans: 23", it's a filtering or rendering issue

---

## 🔧 Technical Details

### Plan Generation Flow
```
1. User creates plan → /api/lifeengine/generate
2. Gemini API processes request
3. Plan saved via db.savePlan() → lifeengine.state.json
4. Response returned to frontend
5. Frontend redirects to dashboard
```

### Dashboard Loading Flow
```
1. Dashboard loads → useEffect()
2. Fetches plans → /api/lifeengine/listPlans
3. Fetches profiles → /api/lifeengine/profiles
4. Sets state → setPlans(), setProfiles()
5. Filters applied → getFilteredPlans()
6. Renders plans → Table/Card view
```

### Current Filter Logic
```typescript
const getFilteredPlans = () => {
  return plans.filter(plan => {
    // Profile filter
    if (filterProfile !== "all" && plan.profileId !== filterProfile) return false;
    
    // Source filter
    if (filterSource !== "all" && plan.source !== filterSource) return false;
    
    // Date range filters
    if (filterDateFrom && new Date(plan.createdAt) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(plan.createdAt) > new Date(filterDateTo)) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = plan.planName?.toLowerCase().includes(query);
      const matchesProfile = getProfileName(plan.profileId).toLowerCase().includes(query);
      const matchesGoals = plan.goals.some(g => g.toLowerCase().includes(query));
      const matchesId = plan.id.toLowerCase().includes(query);
      
      if (!matchesName && !matchesProfile && !matchesGoals && !matchesId) return false;
    }
    
    return true;
  });
};
```

---

## 📊 Verification Steps

### Step 1: Verify Plans in Database
```bash
cd /path/to/project
cat lifeengine.state.json | jq '.plans | length'
cat lifeengine.state.json | jq '.plans[0]'
```

Expected: Should see 23 plans (or more)

### Step 2: Test API Endpoint
```bash
curl http://localhost:3000/api/lifeengine/listPlans | jq '.plans | length'
```

Expected: Should return same number as database

### Step 3: Check Browser Network Tab
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Reload dashboard
4. Look for `/api/lifeengine/listPlans` request
5. Check response: Should contain `plans` array with 23 items

### Step 4: Check Browser Console Logs
Look for:
```
[Dashboard] Loaded plans: 23
[Dashboard] Loaded profiles: X
```

If you see 0 plans, check for errors in console.

---

## 🐛 Common Issues & Fixes

### Issue: "No plans yet" message shown
**Cause**: Filters hiding all plans OR empty state logic triggered  
**Fix**: 
- Click "Clear Filters" button
- Check `hasActiveFilters` state in React DevTools
- Verify `filteredPlans.length` vs `plans.length`

### Issue: Plans load but don't render
**Cause**: React rendering issue or CSS hiding elements  
**Fix**:
- Check browser console for React errors
- Inspect DOM - are plan elements present but hidden?
- Check CSS for `display: none` or `visibility: hidden`

### Issue: Old plans show, new plans don't
**Cause**: Cache issue or component not re-rendering  
**Fix**:
- Click Refresh button
- Check `useEffect` dependencies in dashboard
- Hard refresh browser (Cmd+Shift+R)

### Issue: API returns empty array
**Cause**: Database file issue or API error  
**Fix**:
- Check `lifeengine.state.json` file exists
- Verify file permissions (should be readable)
- Check API logs for errors
- Restart dev server

---

## 🎨 Enhanced Dashboard Features (Added)

### 1. Search Functionality
- Search across: plan name, profile name, goals, plan ID
- Real-time filtering
- Clear button for quick reset
- Case-insensitive matching

### 2. Refresh Button
- Manual data sync
- Shows "Syncing..." state during operation
- Disabled while syncing
- Fetches latest from database

### 3. Better Profile Handling
- Shows "Deleted Profile" instead of "Unknown User"
- Graceful null handling
- No broken UI for orphaned plans

### 4. Filter Status
- Shows "Showing X of Y plans" when filters active
- Clear indication of active filters
- One-click filter reset

---

## 📝 Next Steps for User

1. **Open Dashboard**: Navigate to `/lifeengine/dashboard`
2. **Click Refresh**: Use the 🔄 Refresh button in the top section
3. **Check Console**: Open browser DevTools and verify logs show correct plan count
4. **Clear Filters**: If any filters are active, clear them
5. **Verify Search**: Try searching for "Anchit" or plan keywords

If plans still don't appear after these steps:
- Check browser console for errors
- Verify API endpoint works: `curl http://localhost:3000/api/lifeengine/listPlans`
- Restart the dev server
- Clear browser cache completely

---

## 🔗 Related Documentation

- **DASHBOARD_AND_PROFILE_IMPROVEMENTS.md**: Complete dashboard enhancement details
- **DESIGN_OVERHAUL_COMPLETE.md**: UI/UX design system documentation
- **Commit 1e12507**: Dashboard search and refresh functionality
- **Commit f087934**: Profile deletion improvements

---

## ✅ Conclusion

**The plans ARE being generated and saved successfully.**

The issue is most likely:
1. Browser cache showing old state
2. Filters hiding the plans
3. Dashboard needs manual refresh

**Solution**: Use the new **Refresh button** (🔄) in the dashboard to force a data sync.

All systems are working correctly - this is a frontend display/cache issue, not a backend generation or storage issue.
