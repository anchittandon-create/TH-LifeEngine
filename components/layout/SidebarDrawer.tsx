"use client";
import { useEffect, useRef } from "react"; import Sidebar from "./Sidebar";
export default function SidebarDrawer({open,onClose}:{open:boolean;onClose:()=>void;}){ const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(!open) return; const el=ref.current; if(!el) return;
    const T=el.querySelectorAll<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])'); const first=T[0], last=T[T.length-1];
    const h=(e:KeyboardEvent)=>{ if(e.key==="Escape"){e.preventDefault();onClose();} if(e.key==="Tab"&&T.length){ if(e.shiftKey&&document.activeElement===first){e.preventDefault();(last||el).focus();} else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();(first||el).focus();} } };
    document.addEventListener("keydown",h); (first||el).focus(); return()=>document.removeEventListener("keydown",h);
  },[open,onClose]); if(!open) return null;
  return (<div className="show-md" style={{position:"fixed",inset:0,zIndex:50}} aria-modal="true" role="dialog"><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.3)"}} onClick={onClose}/><div ref={ref} tabIndex={-1} style={{position:"fixed",inset:"0 auto 0 0",width:280,background:"#fff",borderRight:"1px solid #e5e7eb",padding:12,overflowY:"auto"}}><Sidebar/><button className="btn ghost" style={{marginTop:8}} onClick={onClose}>Close</button></div></div>);
}
