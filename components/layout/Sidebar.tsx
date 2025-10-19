"use client";
import NavLink from "./NavLink";
import { ReactNode } from "react";
type NavItem = { label: string; href: string; icon?: ReactNode; match?: "exact"|"startsWith" };
const NAV: NavItem[] = [
  { label: "Home", href: "/lifeengine" },
  { label: "Profiles", href: "/lifeengine/profiles" },
  { label: "Create Plan", href: "/lifeengine/create" },
  { label: "Dashboard", href: "/lifeengine/dashboard" },
  { label: "Settings", href: "/lifeengine/settings" },
];
export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 border-r bg-white">
      <div className="p-3 text-xs uppercase tracking-wide text-gray-500">Navigation</div>
      <nav className="px-2 pb-4 space-y-1" aria-label="Main">
        {NAV.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} match={item.match ?? "startsWith"} />
        ))}
      </nav>
    </aside>
  );
}
