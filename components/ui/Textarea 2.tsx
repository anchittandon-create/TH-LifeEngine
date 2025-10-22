"use client";

import * as React from "react";
import clsx from "clsx";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, helperText, id, ...props },
  ref,
) {
  const textareaId = id ?? React.useId();
  return (
    <label htmlFor={textareaId} className="flex w-full flex-col gap-1 text-sm text-slate-700">
      {label ? <span className="font-medium text-slate-600">{label}</span> : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/40",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {error ? (
        <span id={`${textareaId}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${textareaId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </label>
  );
});
