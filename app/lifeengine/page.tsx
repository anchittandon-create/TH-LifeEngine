import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/lifeengine/PageHeader";
import { HomeQuickActions } from "@/components/lifeengine/HomeQuickActions";
import { RecentPlans } from "@/components/lifeengine/RecentPlans";

export default function Home() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">TH+ LifeEngine</h1>
        <p className="text-gray-600 text-sm mt-1">Personalized, evidence-backed health plans.</p>
        <div className="mt-4 flex gap-3">
          <a href="/lifeengine/create" className="px-4 py-2 rounded bg-black text-white">Create Plan</a>
          <a href="/lifeengine/profiles" className="px-4 py-2 rounded border">Manage Profiles</a>
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium">Recent Activity</h2>
        <p className="text-sm text-gray-500">Hook up to /api later.</p>
      </section>
    </div>
  );
}
