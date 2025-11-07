"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function normalize(path: string) {
  if (!path) return "/";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed || "/";
}

export default function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname() || "/";
  const current = normalize(pathname);
  const target = normalize(href);
  const isRootLink = target === "/lifeengine";

  let isActive = false;
  if (isRootLink) {
    isActive = current === target;
  } else {
    isActive = current === target || current.startsWith(`${target}/`);
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive ? "true" : "false"}
    >
      <span>{label}</span>
    </Link>
  );
}
