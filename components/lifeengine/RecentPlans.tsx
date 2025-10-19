"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { usePlans } from "@/lib/hooks/usePlans";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { Chip } from "@/components/ui/Chip";
import { BadgeQuality } from "@/components/ui/BadgeQuality";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Button } from "@/components/ui/Button";

export function RecentPlans() {
  const router = useRouter();
  const { data: plansData, error: plansError, isLoading: plansLoading, mutate: mutatePlans } = usePlans(null, { suspense: false });
  const { data: profilesData, error: profilesError, isLoading: profilesLoading, mutate: mutateProfiles } = useProfiles({ suspense: false });

  if (plansLoading || profilesLoading) {
    return <RecentPlansSkeleton />;
  }

  if (plansError || profilesError) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
        Unable to load recent plans.{" "}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            mutatePlans();
            mutateProfiles();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const plans = plansData?.plans.slice(0, 3) ?? [];
  const profiles = profilesData?.profiles ?? [];
  const resolveProfile = (id: string) => profiles.find((profile) => profile.id === id);

  if (!plans.length) {
    return (
      <EmptyState
        title="No plans generated yet"
        description="Create your first personalized plan to see it appear here."
        actionLabel="Create plan"
        onAction={() => router.push("/lifeengine/create")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const profile = resolveProfile(plan.profileId);
        return (
          <div key={plan.planId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Plan {plan.planId.replace("plan_", "#")}
                  </h3>
                  {profile ? (
                    <Chip label={profile.name} tone="info" />
                  ) : (
                    <Chip label="Unknown profile" tone="warn" />
                  )}
                  {plan.warnings.length ? <Chip label={`${plan.warnings.length} warnings`} tone="warn" /> : null}
                </div>
                <p className="text-xs text-slate-500">
                  {plan.createdAt ? formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true }) : "Just now"}
                </p>
              </div>
              <BadgeQuality score={plan.confidence} label="Confidence" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                <Chip label={`${plan.days} days`} />
                {profile?.lifestyle?.primaryGoal ? <Chip label={profile.lifestyle.primaryGoal} tone="info" /> : null}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/lifeengine/plan/${plan.planId}`}>View</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/lifeengine/create?from=${plan.planId}`}>Duplicate</Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RecentPlansSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
    </div>
  );
}
