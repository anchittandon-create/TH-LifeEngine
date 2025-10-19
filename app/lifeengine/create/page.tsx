"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";
type Profile = { id: string; name: string; demographics?: any };
type GenResponse = { planId: string; weekPlan: any[]; warnings: string[]; confidence: number };
export default function CreatePage(){
  const { data: profiles } = useSWR<{ profiles: Profile[] }>("/api/lifeengine/profiles/list", fetcher);
  const [profileId, setProfileId] = useState("");
  const [goals, setGoals] = useState("weight_loss,gut_health");
  const [duration, setDuration] = useState({ unit: "weeks", value: 8 });
  const [budget, setBudget] = useState(40);
  const [dietType, setDietType] = useState("veg");
  const [flags, setFlags] = useState("pcod");
  const [level, setLevel] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<GenResponse | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const pid = url.searchParams.get("profileId");
    if (pid) setProfileId(pid);
  }, []);

  const valid = useMemo(() => profileId && goals.trim().length > 0 && budget > 0, [profileId, goals, budget]);

  async function submit() {
    if (!valid) return;
    setLoading(true); setResp(null);
    const p = (profiles?.profiles || []).find(p => p.id === profileId);
    const payload = {
      profile: { age: p?.demographics?.age ?? 30, sex: p?.demographics?.sex ?? "F", height: 162, weight: 70 },
      goals: goals.split(",").map(s => s.trim()).filter(Boolean),
      duration,
      dietary: { type: dietType, cuisine: "indian", allergies: [] },
      flags: flags.split(",").map(s=>s.trim()).filter(Boolean),
      timeBudget: budget,
      level,
      profileId
    };
    const r = await fetch("/api/lifeengine/plan/generate", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    const j: GenResponse = await r.json();
    setResp(j); setLoading(false);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Plan</h1>
          <p className="text-sm text-gray-600">Step-by-step, then output on the same page.</p>
        </div>
      </header>

      {/* Step 1: Profile */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-2">Step 1 — Select Profile</h2>
        <select value={profileId} onChange={(e)=>setProfileId(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Select…</option>
          {(profiles?.profiles || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </section>

      {/* Step 2: Inputs */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-3">Step 2 — Inputs</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-xs">Goals (comma-separated)</label>
            <input value={goals} onChange={e=>setGoals(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Duration</label>
            <div className="flex gap-2">
              <select value={duration.unit} onChange={e=>setDuration({...duration, unit:e.target.value})} className="border rounded px-3 py-2">
                <option>days</option><option>weeks</option><option>months</option><option>years</option>
              </select>
              <input type="number" value={duration.value} onChange={e=>setDuration({...duration, value:parseInt(e.target.value||"0")})} className="border rounded px-3 py-2 w-28" />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Time Budget (min/day)</label>
            <input type="number" value={budget} onChange={e=>setBudget(parseInt(e.target.value||"0"))} className="border rounded px-3 py-2" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Diet Type</label>
            <select value={dietType} onChange={e=>setDietType(e.target.value)} className="border rounded px-3 py-2">
              <option>veg</option><option>vegan</option><option>eggetarian</option><option>non_veg</option><option>jain</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Flags (comma-separated)</label>
            <input value={flags} onChange={e=>setFlags(e.target.value)} className="border rounded px-3 py-2" placeholder="pcod,back_pain" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs">Level</label>
            <select value={level} onChange={e=>setLevel(e.target.value)} className="border rounded px-3 py-2">
              <option>beginner</option><option>intermediate</option><option>advanced</option>
            </select>
          </div>
        </div>
        <button onClick={submit} disabled={!valid || loading} className="mt-3 px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {loading ? "Creating…" : "Create Plan"}
        </button>
      </section>

      {/* Step 3: Output on same page */}
      {resp && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Plan Output</h2>
          <div className="text-sm text-gray-600">Confidence: {resp.confidence.toFixed(2)} • Warnings: {resp.warnings.length}</div>
          <pre className="mt-3 bg-gray-50 text-xs p-3 rounded overflow-auto max-h-[480px]">{JSON.stringify(resp, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
