"use client";

import clsx from "clsx";
import { SkeletonLine } from "./SkeletonLine";

type SkeletonCardProps = {
  lines?: number;
  className?: string;
};

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={clsx("space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine key={index} width={`${90 - index * 10}%`} />
      ))}
    </div>
  );
}
