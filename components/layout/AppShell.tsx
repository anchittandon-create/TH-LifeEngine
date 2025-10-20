"use client";

import { useRef, useState } from "react";
import Sidebar from "./Sidebar";
import SidebarDrawer from "./SidebarDrawer";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <button
              ref={btnRef}
              className={styles.drawerToggle}
              aria-controls="mobile-sidebar"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
            <strong>TH+ LifeEngine</strong>
          </div>
          <div className={styles.description}>Health Booster</div>
        </div>
      </header>
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
      <SidebarDrawer open={open} onClose={close} />
    </div>
  );
}
