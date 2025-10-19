'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const items = [
  { href: '/lifeengine/profiles', label: 'Profiles' },
  { href: '/lifeengine/plan', label: 'Generate Plan' },
  { href: '/lifeengine/dashboard', label: 'Dashboard' },
];

export default function LifeEngineNav() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-shrink-0 border-r border-white/10 bg-slate-900 px-6 py-10 text-sm text-white shadow-2xl">
      <nav className="flex w-full flex-col gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">LifeEngine</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">TH+ Plan Studio</h1>
          <p className="mt-3 text-xs text-white/60">
            Navigate between profiles, the plan creator, and the dashboard.
          </p>
        </div>
        <ul className="space-y-2">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                    active ? 'bg-white text-slate-900 shadow' : 'hover:bg-white/10',
                  )}
                >
                  <span className={clsx('h-2 w-2 rounded-full', active ? 'bg-slate-900' : 'bg-indigo-400')} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
