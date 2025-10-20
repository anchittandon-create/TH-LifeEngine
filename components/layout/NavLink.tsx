"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
export default function NavLink({ href, label }:{ href:string; label:string }){ const p=usePathname()||"/"; const a=(p===href||p.startsWith(href+"/")); return (<Link href={href} aria-current={a?"page":undefined} data-active={a?"true":"false"}><span>{label}</span></Link>); }
