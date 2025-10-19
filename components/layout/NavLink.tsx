"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";

type Props = {
  href: string;
  label: string;
  icon?: ReactNode;
  match?: "exact" | "startsWith";
  onClick?: () => void;
};
export default function NavLink({ href, label, icon, match = "startsWith", onClick }: Props) {
  const pathname = usePathname() || "/";
  const active = useMemo(() => {
    if (match === "exact") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }, [pathname, href, match]);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 data-[active=true]:bg-blue-600 data-[active=true]:text-white"
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span>{label}</span>
    </Link>
  );
}
