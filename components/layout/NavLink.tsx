"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavLink.module.css";

type NavLinkProps = {
  href: string;
  label: string;
  onClick?: () => void;
};

export default function NavLink({ href, label, onClick }: NavLinkProps) {
  const pathname = usePathname() || "/";
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      onClick={onClick}
      className={`${styles.link} ${active ? styles.active : ""}`}
    >
      <span>{label}</span>
    </Link>
  );
}
