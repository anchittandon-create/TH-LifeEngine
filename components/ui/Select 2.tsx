"use client";

import * as React from "react";
import clsx from "clsx";

export type SelectOption = { label: string; value: string };

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, helperText, id, children, options, ...props },
  ref,
) {
  const selectId = id ?? React.useId();
  return (
    <label htmlFor={selectId} className="flex w-full flex-col gap-1 text-sm text-slate-700">
      {label ? <span className="font-medium text-slate-600">{label}</span> : null}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/40",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText ? `${selectId}-helper` : undefined}
        {...props}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <span id={`${selectId}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${selectId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </label>
  );
});
