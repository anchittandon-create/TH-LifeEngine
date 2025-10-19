export type Sex = "F" | "M" | "Other";

export type ProfileContact = {
  email?: string;
  phone?: string;
  location?: string;
};

export type ProfileLifestyle = {
  occupation?: string;
  timeZone?: string;
  activityLevel?: string;
  primaryGoal?: string;
};

export type Profile = {
  id: string;
  name: string;
  demographics?: {
    age?: number;
    sex?: Sex;
    height?: number;
    weight?: number;
  };
  contact?: ProfileContact;
  lifestyle?: ProfileLifestyle;
  health?: {
    flags?: string[];
    allergies?: string[];
  };
  createdAt?: string;
};
