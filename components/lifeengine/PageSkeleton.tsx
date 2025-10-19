"use client";

import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { SkeletonLine } from "@/components/ui/SkeletonLine";

export function PageSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SkeletonLine width="60%" className="h-5" />
        <SkeletonLine width="40%" className="h-4" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}
