'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SidebarDrawer from './SidebarDrawer';
import styles from './AppShell.module.css';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('theme-dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('theme-dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <div className={styles.appShell}>
      <Sidebar className="hidden md:block" />
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        className="md:hidden"
      />
      <div className={styles.main}>
        {/* Mobile header */}
        <header className={`${styles.header} md:hidden`}>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={styles.menuButton}
            aria-label="Open navigation menu"
          >
            ☰
          </button>
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Desktop header */}
        <header className={styles.headerDesktop}>
          <div></div> {/* Spacer for centering */}
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}