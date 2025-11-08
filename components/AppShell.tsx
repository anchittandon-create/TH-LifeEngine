'use client';
import Sidebar from './layout/Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - always visible on desktop, collapsible on mobile */}
      <Sidebar />
      
      {/* Main content area */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="w-full p-6">
          {children}
        </div>
      </main>
    </div>
  );
}