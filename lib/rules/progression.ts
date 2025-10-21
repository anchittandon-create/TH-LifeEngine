export const PROGRESSION = { maxWeeklyIncreasePct:10, deloadEveryWeeks:5, deloadDropPct:30, maxDuration: 120, maxSessionsPerWeek: 6 };

export function calculateProgressionLimits(profile: any, activityType: string) { return PROGRESSION; }