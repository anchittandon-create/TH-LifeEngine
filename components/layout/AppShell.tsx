"use client";

import { useRef, useState } from "react";
import Sidebar from "./Sidebar";
import SidebarDrawer from "./SidebarDrawer";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <button
              ref={toggleRef}
              type="button"
              aria-controls="mobile-sidebar"
              aria-expanded={open ? "true" : "false"}
              aria-label="Open navigation"
              className={styles.drawerToggle}
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
            <span>TH+ LifeEngine</span>
          </div>
          <div className={styles.description}>Verbal Edition</div>
        </div>
      </header>
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
      <SidebarDrawer open={open} onClose={closeDrawer} />
    </div>
  );
}
