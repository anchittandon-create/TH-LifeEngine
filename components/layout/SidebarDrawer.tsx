"use client";

import { useEffect, useRef } from "react";
import NavLink from "./NavLink";
import { NAV_ITEMS } from "./Sidebar";
import styles from "./SidebarDrawer.module.css";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function SidebarDrawer({ open, onClose }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusable = () =>
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const nodes = Array.from(focusable());
        if (!nodes.length) {
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    const nodes = focusable();
    (nodes[0] ?? panel).focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className={styles.overlay} role="presentation" onClick={onClose} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        tabIndex={-1}
      >
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              onClick={onClose}
            />
          ))}
        </nav>
        <button type="button" className={styles.close} onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}
