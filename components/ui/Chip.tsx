"use client";

import clsx from "clsx";

type ChipTone = "default" | "info" | "warn" | "success";

const toneClasses: Record<ChipTone, string> = {
  default: "bg-slate-100 text-slate-700 border border-slate-200",
  info: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  warn: "bg-amber-100 text-amber-700 border border-amber-200",
  success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

type ChipProps = {
  label: string;
  tone?: ChipTone;
  icon?: React.ReactNode;
  className?: string;
};

export function Chip({ label, tone = "default", icon, className }: ChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
