"use client";
import { useRef, useState } from "react"; import Sidebar from "./Sidebar"; import SidebarDrawer from "./SidebarDrawer";
export default function AppShell({children}:{children:React.ReactNode}){ const[open,setOpen]=useState(false); const btnRef=useRef<HTMLButtonElement>(null); const close=()=>{setOpen(false);btnRef.current?.focus();};
  return (<div><header className="header"><div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
    <div style={{display:"flex",gap:8,alignItems:"center"}}><button ref={btnRef} className="btn show-md" aria-controls="mobile-sidebar" aria-expanded={open} onClick={()=>setOpen(true)}>☰</button><strong>TH+ LifeEngine</strong></div>
    <div style={{fontSize:13,color:"#6b7280"}}>Health Booster</div></div></header>
    <div className="layout"><Sidebar/><main className="container" style={{paddingTop:16,paddingBottom:32}}>{children}</main></div><SidebarDrawer open={open} onClose={close}/></div>);
}
