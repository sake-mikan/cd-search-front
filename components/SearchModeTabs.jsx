'use client';

import Link from 'next/link';

export default function SearchModeTabs({ activeTab = 'cd', tone = 'home' }) {
  const items = [
    { key: 'cd', label: 'CDを探す', href: '/' },
    { key: 'track', label: '楽曲名で探す', href: '/tracks' },
    { key: 'content', label: '作品から探す', href: '/contents' },
  ];

  const homeTone = tone === 'home';
  const containerClass = homeTone
    ? 'flex w-full items-end gap-1.5 border-b border-slate-400/90 dark:border-slate-700/90'
    : 'flex w-full items-end gap-1 border-b border-slate-300/90 dark:border-slate-700/90';

  return (
    <div className="w-full">
      <div className={containerClass} role="tablist" aria-label="検索モード切り替え">
        {items.map((item) => {
          const active = activeTab === item.key;
          const activeClass = homeTone
            ? 'z-10 border-slate-400/90 border-b-white bg-white text-slate-950 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.18)] dark:border-slate-600 dark:border-b-slate-900 dark:bg-slate-900/95 dark:text-slate-50'
            : 'z-10 border-slate-300/90 border-b-white bg-slate-50 text-sky-700 shadow-sm dark:border-slate-700 dark:border-b-slate-900 dark:bg-slate-900 dark:text-sky-300';
          const inactiveClass = homeTone
            ? 'border-slate-300/70 bg-slate-100/75 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-transparent dark:bg-slate-800/20 dark:text-slate-400 dark:hover:bg-slate-800/55 dark:hover:text-slate-200'
            : 'border-slate-300/65 bg-slate-100/60 text-slate-600 hover:bg-slate-200/85 hover:text-slate-900 dark:border-transparent dark:bg-slate-800/20 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';

          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                'relative -mb-px inline-flex min-h-[46px] items-center justify-center whitespace-nowrap rounded-t-2xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
                active ? activeClass : inactiveClass,
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
              role="tab"
              aria-selected={active}
            >
              {item.label}
              {active ? (
                <span className="pointer-events-none absolute inset-x-4 bottom-0 h-1 rounded-full bg-sky-500 dark:bg-sky-400" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
