"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";

interface Profile {
  id: string;
  name: string;
  gender: string;
  age: number;
  region: string;
}

interface ProfilesData {
  profiles: Profile[];
}

export default function Profiles() {
  const { data, isLoading, error, mutate } = useSWR<ProfilesData>("/api/lifeengine/profiles/list", fetcher);

  async function create() {
    await fetch("/api/lifeengine/profiles/create", { method: "POST" });
    mutate();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profiles</h1>
        <button onClick={create} className="px-4 py-2 rounded bg-black text-white">New Profile</button>
      </div>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        {isLoading && "Loading…"}
        {error && "Error"}
        <ul className="divide-y">
          {data?.profiles?.map((p: Profile) => (
            <li key={p.id} className="py-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{p.name}</div>
                <div className="text-gray-500">{p.gender} • {p.age} • {p.region}</div>
              </div>
              <a className="px-3 py-1 rounded border" href={`/lifeengine/create?profileId=${p.id}`}>Create Plan</a>
            </li>
          ))}
          {(!data?.profiles || data.profiles.length === 0) && (
            <li className="py-8 text-center text-gray-500">No profiles yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
