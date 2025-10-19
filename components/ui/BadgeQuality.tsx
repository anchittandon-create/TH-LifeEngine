"use client";

import clsx from "clsx";

type BadgeQualityProps = {
  score: number;
  label?: string;
};

function getColor(score: number) {
  if (score >= 0.9) return "bg-emerald-500";
  if (score >= 0.75) return "bg-amber-500";
  return "bg-rose-500";
}

export function BadgeQuality({ score, label }: BadgeQualityProps) {
  const clamped = Math.max(0, Math.min(1, score));
  const width = `${clamped * 100}%`;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2.5 w-24 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div className={clsx("h-full rounded-full transition-all", getColor(clamped))} style={{ width }} />
      </div>
      <span className="text-xs font-semibold text-slate-600">
        {label ?? "Quality"} {clamped.toFixed(2)}
      </span>
    </div>
  );
}
