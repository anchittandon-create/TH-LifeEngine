export type Profile = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  region: string;
  medicalConditions: string[];
  dietary?: {
    type?: string;
    allergies?: string[];
  };
};
