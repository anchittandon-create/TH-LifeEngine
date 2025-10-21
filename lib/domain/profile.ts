export type Profile = {
  id:string; name:string; gender:"F"|"M"|"Other"; age:number; height_cm:number; weight_kg:number;
  region:"IN"|"US"|"EU"|"Global"; medical_flags:string[]; activity_level:"sedentary"|"light"|"moderate"|"intense";
  dietary:{ type:"veg"|"vegan"|"eggetarian"|"non_veg"|"jain"|"gluten_free"|"lactose_free"; allergies:string[]; avoid_items:string[]; cuisine_pref:string[] };
  preferences:{ tone:"gentle"|"balanced"|"intense"; indoor_only:boolean; notes?:string };
  availability:{ days_per_week:number; preferred_slots:{start:string;end:string}[] };
  plan_type:{ primary:string; secondary:string[] };
};
