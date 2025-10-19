"use client";

import * as React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 focus:ring-slate-400",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm md:text-base",
  lg: "px-5 py-3 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, variant = "primary", size = "md", loading = false, asChild = false, disabled, ...props },
  ref,
) {
  const classes = clsx(
    "inline-flex min-h-[44px] items-center justify-center rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    (disabled || loading) && "cursor-not-allowed opacity-60",
    className,
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: clsx((children.props as any)?.className, classes),
      "aria-disabled": disabled || loading,
    });
  }

  const content = (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">Loading</span>
          <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </>
      ) : (
        children
      )}
    </button>
  );

  return content;
});
