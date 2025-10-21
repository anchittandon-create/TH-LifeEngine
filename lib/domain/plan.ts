export type Day = { day_index:number; theme?:string;
  yoga?: { flow_id:string; name:string; duration_min:number; intensity:"low"|"mod"|"high"; tags?:string[] }[];
  breathwork?: { name:string; duration_min:number }[];
  nutrition?: { kcal_target:number; macros?:{p:number;c:number;f:number}; meals?:{ meal:"breakfast"|"lunch"|"dinner"; name:string; swaps?:string[] }[] };
  hydration_ml_target?: number; sleep?:{ target_hr?:number; wind_down_min:number; tip:string };
  habits?: string[]; mindfulness?: string[]; notes?: string; citations?: string[];
};
export type Week = { week_index:number; focus:string; progression_note?:string; days: Day[] };
export type Plan = {
  meta:{ title:string; duration_days:number; weeks:number; goals:string[]; flags:string[]; plan_type:{primary:string;secondary:string[]}; dietary:any; time_budget_min_per_day:number; summary?:string };
  weekly_plan: Week[]; citations: string[]; warnings: string[]; adherence_tips: string[]; coach_messages: string[];
  analytics:{ safety_score:number; diet_match:number; progression_score:number; adherence_score:number; overall:number };
};
