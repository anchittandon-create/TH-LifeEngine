"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";

interface Profile {
  id: string;
  name: string;
}

interface ProfilesData {
  profiles: Profile[];
}

export default function Create() {
  const { data: profilesData } = useSWR<ProfilesData>("/api/lifeengine/profiles/list", fetcher);
  const [profileId, setProfileId] = useState("");
  const [goals, setGoals] = useState("weight_loss,gut_health");
  const [unit, setUnit] = useState("weeks");
  const [value, setValue] = useState(8);
  const [budget, setBudget] = useState(40);
  const [dietType, setDietType] = useState("veg");
  const [flags, setFlags] = useState("pcod");
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pid = new URL(window.location.href).searchParams.get("profileId");
    if (pid) setProfileId(pid);
  }, []);

  const valid = useMemo(() => profileId && goals.trim().length > 0 && budget > 0, [profileId, goals, budget]);

  async function submit() {
    setLoading(true);
    setResp(null);
    const payload = {
      intake: {
        profileId,
        profileSnapshot: (profilesData?.profiles || []).find((p: any) => p.id === profileId) || {},
        goals: goals.split(",").map((s) => ({ name: s.trim() })),
        duration: { unit, value },
        time_budget_min_per_day: budget,
        experience_level: "beginner",
        equipment: { mat: true },
        assumptions: []
      }
    };
    const r = await fetch("/api/lifeengine/plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setResp(await r.json());
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Create Plan</h1>
        <p className="text-sm text-gray-600">Wizard → output on the same page</p>
      </header>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-2">Step 1 — Select Profile</h2>
        <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Select…</option>
          {(profilesData?.profiles || []).map((p: Profile) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </section>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-3">Step 2 — Inputs</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-xs">Goals</label>
            <input value={goals} onChange={e => setGoals(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Duration</label>
            <div className="flex gap-2">
              <select value={unit} onChange={e => setUnit(e.target.value)} className="border rounded px-3 py-2">
                <option>days</option>
                <option>weeks</option>
                <option>months</option>
                <option>years</option>
              </select>
              <input type="number" value={value} onChange={e => setValue(parseInt(e.target.value || "0"))} className="border rounded px-3 py-2 w-28" />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Time Budget (min/day)</label>
            <input type="number" value={budget} onChange={e => setBudget(parseInt(e.target.value || "0"))} className="border rounded px-3 py-2" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Diet Type</label>
            <select value={dietType} onChange={e => setDietType(e.target.value)} className="border rounded px-3 py-2">
              <option>veg</option>
              <option>vegan</option>
              <option>eggetarian</option>
              <option>non_veg</option>
              <option>jain</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Flags</label>
            <input value={flags} onChange={e => setFlags(e.target.value)} className="border rounded px-3 py-2" placeholder="pcod,back_pain" />
          </div>
        </div>
        <button onClick={submit} disabled={!valid || loading} className="mt-3 px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {loading ? "Creating…" : "Create Plan"}
        </button>
      </section>
      {resp && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Plan Output</h2>
          <div className="text-sm text-gray-600">Warnings: {resp.warnings?.length ?? 0}</div>
          <pre className="mt-3 bg-gray-50 text-xs p-3 rounded overflow-auto max-h-[480px]">
            {JSON.stringify(resp, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
