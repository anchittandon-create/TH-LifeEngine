"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={clsx("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{title}</h1>
        {description ? <p className="text-sm text-slate-600 md:text-base">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
    </div>
  );
}
