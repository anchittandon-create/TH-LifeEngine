'use client';

import { useEffect } from 'react';
import NavLink from './NavLink';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function SidebarDrawer({ isOpen, onClose, className = '' }: SidebarDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <aside className="relative w-64 bg-[var(--card)] border-r border-[var(--border)] p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-[var(--border)]"
        >
          ✕
        </button>
        <nav className="space-y-2 mt-8">
          <NavLink href="/lifeengine">Home</NavLink>
          <NavLink href="/lifeengine/profiles">Profiles</NavLink>
          <NavLink href="/lifeengine/create">Create</NavLink>
          <NavLink href="/lifeengine/dashboard">Dashboard</NavLink>
        </nav>
      </aside>
    </div>
  );
}