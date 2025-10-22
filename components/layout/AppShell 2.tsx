"use client";
import { useRef, useState } from "react";
import Sidebar from "./Sidebar"; import SidebarDrawer from "./SidebarDrawer";
export default function AppShell({children}:{children:React.ReactNode}){
  const [open,setOpen]=useState(false); const btnRef=useRef<HTMLButtonElement>(null);
  const close=()=>{setOpen(false); btnRef.current?.focus();};
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button ref={btnRef} className="md:hidden inline-flex items-center justify-center rounded-md border px-3 py-2"
              aria-controls="mobile-sidebar" aria-expanded={open?"true":"false"} aria-label="Open navigation" onClick={()=>setOpen(true)}>☰</button>
            <span className="font-semibold">TH+ LifeEngine</span>
          </div>
          <div className="text-sm text-gray-500">Health Booster</div>
        </div>
      </header>
      <div className="md:grid md:grid-cols-[16rem_1fr] lg:grid-cols-[18rem_1fr]">
        <Sidebar/>
        <main className="mx-auto max-w-5xl w-full p-4 md:p-6 space-y-6">{children}</main>
      </div>
      <SidebarDrawer open={open} onClose={close}/>
    </div>);
}
