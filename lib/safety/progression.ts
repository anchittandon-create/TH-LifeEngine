type Experience = "beginner" | "intermediate" | "advanced";

export function maxWeeklyIncreasePercent(experience: Experience): number {
  switch (experience) {
    case "beginner":
      return 0.05;
    case "intermediate":
      return 0.08;
    case "advanced":
      return 0.1;
    default:
      return 0.05;
  }
}

export function needsDeloadWeek(totalWeeks: number, weekIndex: number): boolean {
  if (totalWeeks < 8) return false;
  return weekIndex > 0 && weekIndex % 5 === 0;
}

export function isProgressionSafe(prevLoad: number, currentLoad: number, experience: Experience): boolean {
  const diff = currentLoad - prevLoad;
  if (prevLoad === 0) return true;
  const percent = diff / prevLoad;
  return percent <= maxWeeklyIncreasePercent(experience);
}
