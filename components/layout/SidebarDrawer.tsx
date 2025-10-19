"use client";
import { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
export default function SidebarDrawer({open,onClose}:{open:boolean;onClose:()=>void}){
  const panelRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(!open) return;
    const panel=panelRef.current; if(!panel) return;
    const focusables=panel.querySelectorAll<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])');
    const first=focusables[0], last=focusables[focusables.length-1];
    const h=(e:KeyboardEvent)=>{ if(e.key==="Escape"){e.preventDefault();onClose();}
      if(e.key==="Tab"&&focusables.length>0){
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); (last||panel).focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); (first||panel).focus(); }
      }};
    document.addEventListener("keydown",h); (first||panel).focus();
    return ()=>document.removeEventListener("keydown",h);
  },[open,onClose]);
  if(!open) return null;
  return (<div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
    <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
    <div ref={panelRef} tabIndex={-1} className="fixed inset-y-0 left-0 w-72 bg-white p-4 shadow-xl overflow-y-auto">
      <Sidebar/><button className="mt-4 px-3 py-2 rounded border w-full" onClick={onClose}>Close</button>
    </div></div>);
}
