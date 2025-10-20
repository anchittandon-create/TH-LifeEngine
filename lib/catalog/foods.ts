import foodsData from './foods.json';

export interface Food {
  id: string;
  name: string;
  calories: number;
  type: string;
}

export const FOODS: Food[] = foodsData as Food[];

export function getFoodById(id: string): Food | undefined {
  return FOODS.find(food => food.id === id);
}

export function getFoodsByType(type: string): Food[] {
  return FOODS.filter(food => food.type === type);
}