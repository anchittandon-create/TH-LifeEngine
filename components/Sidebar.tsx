import NavLink from './NavLink';

export default function Sidebar({ className = '' }: { className?: string }) {
  return (
    <aside className={`w-64 bg-[var(--card)] border-r border-[var(--border)] p-4 ${className}`}>
      <nav className="space-y-2">
        <NavLink href="/lifeengine">Home</NavLink>
        <NavLink href="/lifeengine/profiles">Profiles</NavLink>
        <NavLink href="/lifeengine/create">Create Plan</NavLink>
        <NavLink href="/lifeengine/dashboard">Dashboard</NavLink>
      </nav>
    </aside>
  );
}
