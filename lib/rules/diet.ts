export function bmr(sex: string, w: number, h: number, age: number) {
  return sex === "M"
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;
}

export function tdee(
  b: number,
  activity: "sedentary" | "light" | "moderate" | "intense"
) {
  const f = { sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725 }[
    activity
  ];
  return b * f;
}

export function kcalTarget(
  t: number,
  goal: "deficit" | "maintenance" | "surplus"
) {
  if (goal === "deficit") {
    return Math.max(1200, t - 500);
  }
  if (goal === "surplus") {
    return t + 300;
  }
  return t;
}

export function hydrationMl(
  weightKg: number,
  region: "IN" | "US" | "EU" | "Global" = "IN"
) {
  const floors: Record<string, number> = {
    IN: 2200,
    US: 2000,
    EU: 2000,
    Global: 2000,
  };
  return Math.max(35 * weightKg, floors[region] ?? 2000);
}
