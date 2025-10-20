export const PLAN_TYPES = {
  primary: [
    'weight_loss',
    'muscle_gain',
    'endurance',
    'flexibility',
    'stress_relief',
    'general_fitness',
  ],
  secondary: [
    'yoga',
    'cardio',
    'strength',
    'meditation',
    'nutrition_focus',
    'recovery',
  ],
};

export const GOALS = [
  'lose_weight',
  'gain_muscle',
  'improve_endurance',
  'increase_flexibility',
  'reduce_stress',
  'better_sleep',
  'improve_posture',
  'boost_energy',
];

export const MEDICAL_FLAGS = [
  'hypertension',
  'diabetes',
  'pregnant',
  'injury',
  'heart_condition',
  'asthma',
  'arthritis',
  'back_pain',
];

export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

export const GENDERS = [
  'male',
  'female',
  'other',
];

export const SAMPLE_PROFILES = [
  {
    id: 'sample_1',
    name: 'Alex Johnson',
    age: 28,
    gender: 'male' as const,
    height: 175,
    weight: 75,
    activityLevel: 'moderate' as const,
    goals: ['lose_weight', 'gain_muscle'],
    flags: [],
  },
  {
    id: 'sample_2',
    name: 'Sarah Chen',
    age: 35,
    gender: 'female' as const,
    height: 162,
    weight: 68,
    activityLevel: 'light' as const,
    goals: ['reduce_stress', 'improve_flexibility'],
    flags: ['pregnant'],
  },
];

export const SAMPLE_INTAKES = [
  {
    profileId: 'sample_1',
    primaryPlanType: 'weight_loss',
    secondaryPlanType: 'strength',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    preferences: {
      time_budget: 60,
      preferred_times: ['morning', 'evening'],
      dietary_restrictions: [],
    },
  },
];