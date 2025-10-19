import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function NavLink({ href, children, className = '' }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--fg)] hover:bg-[var(--card)]'
      } ${className}`}
    >
      {children}
    </Link>
  );
}