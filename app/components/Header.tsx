'use client';

import { usePathname } from 'next/navigation';

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Welcome back to Atlas.',
  },
  '/ask': {
    title: 'Ask Atlas',
    subtitle: 'Research appraisal guidance and supporting sources.',
  },
  '/assignments': {
    title: 'Assignments',
    subtitle: 'Manage your appraisal assignments.',
  },
  '/research': {
    title: 'Saved Research',
    subtitle: 'Review and organize your saved research.',
  },
  '/narratives': {
    title: 'Narrative Assistant',
    subtitle: 'Build clearer appraisal narratives.',
  },
  '/library': {
    title: 'Guideline Library',
    subtitle: 'Browse your appraisal guideline sources.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Manage your Atlas workspace.',
  },
};

export default function Header() {
  const pathname = usePathname();

  const currentPage = pageInfo[pathname] ?? {
    title: 'Atlas',
    subtitle: 'Appraisal Intelligence.',
  };

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {currentPage.title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {currentPage.subtitle}
          </p>
        </div>

        {pathname === '/dashboard' && (
          <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            New Assignment
          </button>
        )}
      </div>
    </header>
  );
}