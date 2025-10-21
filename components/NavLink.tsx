import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import styles from './NavLink.module.css';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function NavLink({ href, children, className = '' }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const classes = [
    styles.navLink,
    isActive && styles.active,
    className
  ].filter(Boolean).join(' ');

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}