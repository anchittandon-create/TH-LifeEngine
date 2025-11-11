"use client";
import Sidebar from "./layout/Sidebar";
import { AppVersionSwitcher } from "@/components/ui/AppVersionSwitcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - always visible on desktop, collapsible on mobile */}
      <Sidebar />
      
      {/* Main content area */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="w-full p-6">
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">TH+ LifeEngine</p>
                <p className="text-sm text-gray-600">Health Booster Control Center</p>
              </div>
              <AppVersionSwitcher />
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
