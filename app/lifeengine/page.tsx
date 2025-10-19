import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/lifeengine/PageHeader";
import { HomeQuickActions } from "@/components/lifeengine/HomeQuickActions";
import { RecentPlans } from "@/components/lifeengine/RecentPlans";

export default function LifeEngineHomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Times Health+</p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">LifeEngine</h1>
            <p className="max-w-xl text-sm text-white/80 md:text-base">
              Craft gender-, age-, and flag-aware wellness plans grounded in the TH+ knowledge base. Keep members on-track with explainable routines,
              personalised nutrition, and multi-coach alignment.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/lifeengine/create">Create plan</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/lifeengine/profiles">Manage profiles</Link>
              </Button>
            </div>
            <p className="text-xs text-white/70">Need data prep? Profiles sync automatically from your last session.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <PageHeader title="Quick actions" description="Jump back into the workflows you use the most." />
        <HomeQuickActions />
      </section>

      <section className="space-y-4">
        <PageHeader
          title="Recent activity"
          description="Latest plans generated across your member roster."
          action={
            <Button asChild variant="ghost">
              <Link href="/lifeengine/dashboard">View dashboard</Link>
            </Button>
          }
        />
        <RecentPlans />
      </section>
    </div>
  );
}
