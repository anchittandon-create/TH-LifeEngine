import NavLink from './NavLink';
import styles from './Sidebar.module.css';

export default function Sidebar({ className = '' }: { className?: string }) {
  const classes = [styles.sidebar, className].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      <nav className={styles.nav}>
        <NavLink href="/lifeengine" className={styles.navLink}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Home
        </NavLink>
        <NavLink href="/lifeengine/profiles" className={styles.navLink}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          Profiles
        </NavLink>
        <NavLink href="/lifeengine/create" className={styles.navLink}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4v16m8-8H4"/>
          </svg>
          Create Plan
        </NavLink>
        <NavLink href="/lifeengine/dashboard" className={styles.navLink}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Dashboard
        </NavLink>
      </nav>
    </aside>
  );
}
