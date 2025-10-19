"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";
type Profile = { id: string; name: string; gender: string; age: number; region?: string; medical_flags?: string[] };
export default function ProfilesPage(){
  const { data, mutate, isLoading, error } = useSWR<{ profiles: Profile[] }>("/api/lifeengine/profiles/list", fetcher);
  async function createQuick() {
    await fetch("/api/lifeengine/profiles/create", { method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ name: "New User", demographics: { age: 30, sex: "F" } })
    });
    mutate();
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profiles</h1>
        <button onClick={createQuick} className="px-4 py-2 rounded bg-black text-white">New Profile</button>
      </div>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">Failed to load</p>}
        <ul className="divide-y">
          {(data?.profiles || []).map((p) => (
            <li key={p.id} className="py-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{p.name}</div>
                <div className="text-gray-500">{p.gender ?? "—"} • {p.age ?? "—"} • {p.region ?? "—"}</div>
              </div>
              <div className="flex gap-2">
                <a className="px-3 py-1 rounded border" href={`/lifeengine/create?profileId=${p.id}`}>Create Plan</a>
                <button className="px-3 py-1 rounded border">Edit</button>
              </div>
            </li>
          ))}
          {(!data?.profiles || data.profiles.length === 0) && <li className="py-8 text-center text-gray-500">No profiles yet.</li>}
        </ul>
      </section>
    </div>
  );
}
