export type Intake = {
  profileId:string; profileSnapshot: import("./profile").Profile;
  plan_type:{ primary:string; secondary:string[] };
  goals:{ name:string; target_metric?:string; priority?:number }[];
  duration:{ unit:"days"|"weeks"|"months"|"years"; value:number };
  time_budget_min_per_day:number;
  experience_level:"beginner"|"intermediate"|"advanced";
  equipment:string[];
};
