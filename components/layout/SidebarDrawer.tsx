"use client";
import { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import styles from "./SidebarDrawer.module.css";

export default function SidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;

    const T = el.querySelectorAll<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])');
    const first = T[0], last = T[T.length - 1];

    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && T.length) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last || el).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first || el).focus();
        }
      }
    };

    document.addEventListener("keydown", h);
    (first || el).focus();
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`${styles.wrapper} show-md`} aria-modal="true" role="dialog">
      <div className={styles.overlay} onClick={onClose} />
      <div ref={ref} id="mobile-sidebar" tabIndex={-1} className={styles.panel}>
        <Sidebar />
        <button className={styles.close} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
