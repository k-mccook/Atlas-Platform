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
    <aside className="w-72 bg-slate-900 text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-10">
        Atlas
      </h1>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-4 py-3 transition ${
              pathname === link.href
                ? 'bg-blue-600'
                : 'hover:bg-slate-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
