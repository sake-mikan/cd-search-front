import React from 'react';
import Link from 'next/link';

const SITE_NAME = 'DISC MASTER';
const SITE_DOMAIN = 'cdinfo-master.com';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-12 pb-16 space-y-6">
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-4">
        <Link 
          href="/guide/tag-write" 
          className="text-sm font-bold text-slate-500 dark:text-slate-300 underline decoration-slate-300 dark:decoration-white/20 underline-offset-8 transition-all hover:text-sky-600 dark:hover:text-sky-400"
        >
          タグ書き込みガイド
        </Link>
        <Link 
          href="/guide/barcode-read" 
          className="text-sm font-bold text-slate-500 dark:text-slate-300 underline decoration-slate-300 dark:decoration-white/20 underline-offset-8 transition-all hover:text-sky-600 dark:hover:text-sky-400"
        >
          JAN読み取りガイド
        </Link>
        <Link 
          href="/site-policy" 
          className="text-sm font-bold text-slate-500 dark:text-slate-300 underline decoration-slate-300 dark:decoration-white/20 underline-offset-8 transition-all hover:text-sky-600 dark:hover:text-sky-400"
        >
          Site Policy
        </Link>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-white/40 uppercase">
          &copy; {year} {SITE_NAME}
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 tracking-widest">{SITE_DOMAIN}</p>
      </div>
    </footer>
  );
}
