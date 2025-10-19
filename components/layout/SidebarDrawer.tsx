"use client";
import { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";

type Props = { open: boolean; onClose: () => void; labelledById?: string };
export default function SidebarDrawer({ open, onClose, labelledById }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  // focus trap
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "Tab" && focusable.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); (last || panel).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); (first || panel).focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    (first || panel).focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog" aria-labelledby={labelledById}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={panelRef} tabIndex={-1} className="fixed inset-y-0 left-0 w-72 bg-white p-4 shadow-xl overflow-y-auto">
        {/* reuse same nav */}
        <Sidebar />
        <button className="mt-4 px-3 py-2 rounded border w-full" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
