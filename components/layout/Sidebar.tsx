import NavLink from "./NavLink";
import styles from "./Sidebar.module.css";

export const NAV_ITEMS = [
  { href: "/lifeengine", label: "Home" },
  { href: "/lifeengine/profiles", label: "Profiles" },
  { href: "/lifeengine/create", label: "Create Plan" },
  { href: "/lifeengine/dashboard", label: "Dashboard" },
];

export default function Sidebar() {
  return (
    <aside className={styles.container} aria-label="Primary">
      <div className={styles.heading}>Navigation</div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>
    </aside>
  );
}
