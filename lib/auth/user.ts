import { v4 as uuidv4 } from 'uuid';

export interface RootUser {
  id: string;
  username: string;
  email: string;
  role: 'root' | 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  gender: 'F' | 'M' | 'Other';
  age: number;
  height_cm?: number;
  weight_kg?: number;
  region?: string;
  activity_level?: string;
  dietary?: any;
  medical_flags?: string[];
  preferences?: any;
  availability?: any;
  createdAt: string;
  updatedAt: string;
}

const ROOT_USER_KEY = 'th_lifeengine_root_user';
const PROFILES_STORE = new Map<string, Profile>();

export function getRootUser(): RootUser | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(ROOT_USER_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
}

export function createRootUser(username: string, email: string): RootUser {
  const rootUser: RootUser = {
    id: uuidv4(),
    username,
    email,
    role: 'root',
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(ROOT_USER_KEY, JSON.stringify(rootUser));
  }

  return rootUser;
}

export function updateLastLogin(userId: string) {
  if (typeof window === 'undefined') return;
  
  const user = getRootUser();
  if (user && user.id === userId) {
    user.lastLogin = new Date().toISOString();
    localStorage.setItem(ROOT_USER_KEY, JSON.stringify(user));
  }
}

export function initializeRootUser(): RootUser {
  let user = getRootUser();
  if (!user) {
    user = createRootUser('root', 'root@thlifeengine.com');
  }
  updateLastLogin(user.id);
  return user;
}

// Profile storage functions
export function saveProfile(profile: Profile): Profile {
  PROFILES_STORE.set(profile.id, profile);
  
  // Also save to localStorage for persistence
  if (typeof window !== 'undefined') {
    const allProfiles = Array.from(PROFILES_STORE.values());
    localStorage.setItem('th_profiles', JSON.stringify(allProfiles));
  }
  
  return profile;
}

export function getProfile(id: string): Profile | undefined {
  return PROFILES_STORE.get(id);
}

export function getAllProfiles(): Profile[] {
  return Array.from(PROFILES_STORE.values());
}

export function deleteProfile(id: string): boolean {
  const deleted = PROFILES_STORE.delete(id);
  
  if (deleted && typeof window !== 'undefined') {
    const allProfiles = Array.from(PROFILES_STORE.values());
    localStorage.setItem('th_profiles', JSON.stringify(allProfiles));
  }
  
  return deleted;
}

export function loadProfilesFromStorage() {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem('th_profiles');
  if (stored) {
    const profiles: Profile[] = JSON.parse(stored);
    profiles.forEach(profile => {
      PROFILES_STORE.set(profile.id, profile);
    });
  }
}
