"use client";
import { useRef, useState } from "react";
import Sidebar from "./Sidebar";
import SidebarDrawer from "./SidebarDrawer";
import { AppVersionSwitcher } from "@/components/ui/AppVersionSwitcher";

export default function AppShell({children}:{children:React.ReactNode}){
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Header with Menu Button */}
      <header className="header">
        <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:56,gap:16}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button 
              ref={btnRef} 
              className="btn show-md" 
              aria-controls="mobile-sidebar" 
              aria-expanded={open} 
              onClick={()=>setOpen(true)}
            >
              ☰
            </button>
            <div style={{display:"flex",flexDirection:"column"}}>
              <strong>TH+ LifeEngine</strong>
              <span style={{fontSize:12,color:"#6b7280"}}>Health Booster</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <AppVersionSwitcher />
          </div>
        </div>
      </header>
      
      {/* Main Layout with Persistent Sidebar */}
      <div className="layout" style={{ flex: 1, display: 'flex' }}>
        {/* Desktop Sidebar - Always Visible */}
        <Sidebar/>
        
        {/* Main Content Area */}
        <main className="container" style={{flex: 1, paddingTop:16,paddingBottom:32, overflowY: 'auto'}}>
          {children}
        </main>
      </div>
      
      {/* Mobile Sidebar Drawer */}
      <SidebarDrawer open={open} onClose={close}/>
    </div>
  );
}
