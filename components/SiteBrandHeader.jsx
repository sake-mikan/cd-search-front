'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import DiscMasterLogo from './DiscMasterLogo';

export default function SiteBrandHeader({ className = '', actions = null, isHome = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const LogoWrapper = isHome ? 'h1' : 'span';

  // Homeページにいる場合、URLのパラメータと同期させる
  useEffect(() => {
    const titleParam = searchParams.get('title') || '';
    setQuery(titleParam);
  }, [searchParams]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/?title=${encodeURIComponent(trimmedQuery)}`);
    } else {
      router.push('/');
    }
  };

  const handleClear = () => {
    setQuery('');
    if (searchParams.get('title')) {
      router.push('/');
    }
  };

  return (
    <header className={`flex flex-col gap-6 md:flex-row md:items-center md:justify-between py-2 ${className}`}>
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-4 group shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <DiscMasterLogo iconOnly />
          <div className="flex flex-col">
            <LogoWrapper className="text-3xl font-black tracking-tight uppercase leading-none">
              <span className="text-slate-950 dark:text-white">DISC</span>
              <span className="bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent dark:from-sky-300 dark:via-cyan-300 dark:to-blue-400 drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                MASTER
              </span>
            </LogoWrapper>
            <span className="text-[10px] font-bold tracking-[0.25em] text-slate-500 dark:text-sky-400/50 uppercase mt-2">
              楽曲メタデータ検索・管理 データベース
            </span>
          </div>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 md:gap-4 min-w-0 w-full">
        {/* Global Explorer Bar */}
        <form onSubmit={handleSearch} className="relative flex-1 md:w-full md:max-w-md group/search">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-white/20 transition-colors group-focus-within/search:text-sky-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="GLOBAL EXPLORE"
            className="h-11 w-full rounded-full border border-slate-200/50 bg-white/20 pl-11 pr-10 text-[10px] font-black tracking-[0.2em] text-slate-900 dark:text-white dark:border-white/5 dark:bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-3 flex items-center p-1 text-slate-400 hover:text-slate-600 dark:text-white/20 dark:hover:text-white/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        {actions && <div className="flex-1 md:flex-none flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
