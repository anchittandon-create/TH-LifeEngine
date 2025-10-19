"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
export default function NavLink({ href, label }:{href:string;label:string}) {
  const p = usePathname() || "/";
  const active = p===href || p.startsWith(href + "/");
  return (
    <Link href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 data-[active=true]:bg-gray-900 data-[active=true]:text-white">
      <span>{label}</span>
    </Link>
  );
}
