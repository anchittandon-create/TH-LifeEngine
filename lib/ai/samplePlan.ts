import type { Plan } from './schemas';

export function createFallbackPlan(sex: 'M' | 'F'): Plan {
  return {
    id: 'fallback-plan',
    profileId: 'fallback-profile',
    intakeId: 'fallback-intake',
    days: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activities: [
        {
          type: 'yoga',
          name: 'Basic Stretch',
          duration: 15,
          description: 'Gentle stretching routine',
        },
      ],
      meals: [
        {
          type: 'breakfast',
          name: 'Oatmeal',
          calories: 300,
          description: 'Healthy oatmeal with fruits',
        },
        {
          type: 'lunch',
          name: 'Salad',
          calories: 400,
          description: 'Fresh vegetable salad',
        },
        {
          type: 'dinner',
          name: 'Grilled Chicken',
          calories: 500,
          description: 'Lean protein with veggies',
        },
      ],
    })),
  };
}