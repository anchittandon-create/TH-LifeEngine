'use client';

import { useEffect, useState } from 'react';
import Form from '@/components/ui/Form';
import type { Profile } from '@/lib/domain/profile';

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(setProfiles);
  }, []);

  const handleCreate = async (data: Record<string, any>) => {
    const response = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const newProfile = await response.json();
      setProfiles(prev => [...prev, newProfile]);
      setShowForm(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profiles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Profile'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-[var(--card)] border border-[var(--border)] rounded-md">
          <Form onSubmit={handleCreate}>
            <label className="block mb-2">
              Name:
              <input
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
              />
            </label>
            <label className="block mb-2">
              Age:
              <input
                name="age"
                type="number"
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
              />
            </label>
            <label className="block mb-2">
              Gender:
              <select
                name="gender"
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block mb-2">
              Region:
              <input
                name="region"
                type="text"
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
              />
            </label>
            <label className="block mb-2">
              Medical Conditions:
              <input
                name="medicalConditions"
                type="text"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md"
              />
            </label>
          </Form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-md">
            <h2 className="text-lg font-semibold mb-2">{profile.name}</h2>
            <p className="text-[var(--muted)]">Age: {profile.age}</p>
            <p className="text-[var(--muted)]">Gender: {profile.gender}</p>
            <p className="text-[var(--muted)]">Region: {profile.region}</p>
            {profile.medicalConditions && (
              <p className="text-[var(--muted)]">Conditions: {profile.medicalConditions}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
