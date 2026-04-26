import React from 'react';
import Link from 'next/link';
import { LucideIcon, Disc3 } from 'lucide-react';

const navItems = [
  { id: 'cd', label: 'CDを探す', href: '/' },
  { id: 'track', label: '楽曲名で探す', href: '/tracks' },
  { id: 'content', label: '作品から探す', href: '/contents' },
];

export default function SearchHeroCard({
  current = 'cd',
  onTabChange,
  title,
  subtitle,
  children,
  badge = 'CD SEARCH',
  badgeIcon: BadgeIcon = Disc3,
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/50 bg-white/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 transition-all duration-500">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200/40 dark:border-white/5 bg-slate-50/30 dark:bg-black/20">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`group relative px-8 py-5 text-sm font-bold transition-all duration-300 ${
              current === item.id
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            {item.label}
            {current === item.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
            )}
          </Link>
        ))}
      </div>

      <div className="p-8 md:p-10 space-y-8">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400 shadow-sm">
              <BadgeIcon className="h-3.5 w-3.5" />
              {badge}
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              {title}
            </h1>
            <p className="text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
