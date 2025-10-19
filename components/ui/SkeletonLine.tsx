"use client";

import clsx from "clsx";

type SkeletonLineProps = {
  width?: string;
  className?: string;
};

export function SkeletonLine({ width = "100%", className }: SkeletonLineProps) {
  return <div className={clsx("animate-pulse rounded-full bg-slate-200/80", className)} style={{ width, height: "0.75rem" }} />;
}
