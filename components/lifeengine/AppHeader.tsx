"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";

const NAV_ITEMS = [
  { href: "/lifeengine", label: "Home" },
  { href: "/lifeengine/profiles", label: "Profiles" },
  { href: "/lifeengine/create", label: "Create Plan" },
  { href: "/lifeengine/dashboard", label: "Dashboard" },
];

export function AppHeader({ active }: { active?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = active ?? pathname ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/lifeengine" className="flex items-center gap-2 text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            TH+
          </span>
          <span className="text-base font-semibold md:text-lg">LifeEngine</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = current.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-full px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isActive
                    ? "bg-slate-900 text-white focus:ring-slate-900"
                    : "text-slate-600 hover:bg-slate-100 focus:ring-slate-400",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="primary" size="sm" aria-label="Create a new plan">
            <Link href="/lifeengine/create">Create Plan</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-slate-200 bg-white md:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive = current.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "rounded-xl px-3 py-2 text-sm font-medium",
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Button asChild variant="primary">
              <Link href="/lifeengine/create">Create Plan</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default AppHeader;
