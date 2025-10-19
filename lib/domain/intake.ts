export type Intake = {
  profileId: string;
  profileSnapshot: any; // Profile
  goals: { name: string; priority: number }[];
  duration: {
    value: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
  time_budget_min_per_day: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  equipment: Record<string, boolean>;
};
