"use client";

import { Button } from "./Button";
import clsx from "clsx";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600",
        className,
      )}
    >
      {icon ? <div className="text-3xl">{icon}</div> : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {actionLabel ? (
        <Button type="button" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
