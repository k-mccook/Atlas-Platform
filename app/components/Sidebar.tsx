'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: '🏠 Dashboard' },
  { href: '/ask', label: '🔍 Ask Atlas' },
  { href: '/assignments', label: '📂 Assignments' },
  { href: '/research', label: '📚 Saved Research' },
  { href: '/narratives', label: '📝 Narrative Assistant' },
  { href: '/library', label: '📖 Guideline Library' },
  { href: '/settings', label: '⚙️ Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-72 shrink-0 bg-slate-900 p-6 text-white">
      <div className="mb-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold shadow-lg shadow-blue-950/30">
            A
          </div>

          <div>
            <div className="text-2xl font-bold tracking-tight">
              Atlas
            </div>

            <div className="text-xs text-slate-400">
              Appraisal Intelligence
            </div>
          </div>
        </Link>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/dashboard' &&
              pathname.startsWith(`${link.href}/`));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Atlas Research
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          Search appraisal guidance and research sources from one workspace.
        </p>
      </div>
    </aside>
  );
}