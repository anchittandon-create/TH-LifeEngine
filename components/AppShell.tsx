'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import SidebarDrawer from './SidebarDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      <Sidebar />
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        className="md:hidden"
      />
      <main className="flex-1 overflow-auto">
        <header className="flex items-center justify-between p-4 md:hidden">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-md bg-[var(--card)] border border-[var(--border)]"
          >
            ☰
          </button>
        </header>
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}