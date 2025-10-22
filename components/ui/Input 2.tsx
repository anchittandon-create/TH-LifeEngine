"use client";

import * as React from "react";
import clsx from "clsx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", label, error, helperText, id, ...props },
  ref,
) {
  const inputId = id ?? React.useId();
  return (
    <label htmlFor={inputId} className="flex w-full flex-col gap-1 text-sm text-slate-700">
      {label ? <span className="font-medium text-slate-600">{label}</span> : null}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/40",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${inputId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </label>
  );
});
