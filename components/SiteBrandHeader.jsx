'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import DiscMasterLogo from './DiscMasterLogo';

function SiteBrandHeaderInner({ className = '', actions = null, isHome = false, hideSearchOnMobile = false }) {
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
    <header className={`flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between py-2 ${className}`}>
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3 md:gap-4 group shrink-0 w-full md:w-auto">
        <Link href="/" className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          <DiscMasterLogo iconOnly />
          <div className="flex flex-col flex-1">
            <LogoWrapper className="text-[28px] xs:text-3xl md:text-3xl font-black tracking-tighter sm:tracking-tight uppercase leading-none">
              <span className="text-slate-950 dark:text-white">DISC</span>{' '}
              <span className="bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent dark:from-sky-300 dark:via-cyan-300 dark:to-blue-400 drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                MASTER
              </span>
            </LogoWrapper>
            <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] md:tracking-[0.25em] text-slate-500 dark:text-sky-400/50 uppercase mt-1.5 md:mt-2">
              楽曲メタデータ検索・管理 データベース
            </span>
          </div>
        </Link>
      </div>

      <div className={`flex-1 items-center justify-end gap-3 md:gap-4 min-w-0 w-full ${hideSearchOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {/* Global Explorer Bar */}
        <form onSubmit={handleSearch} className="relative flex-1 md:w-full md:max-w-md group/search">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-white/20 transition-colors group-focus-within/search:text-sky-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索"
            className="h-10 md:h-11 w-full rounded-xl md:rounded-full border border-slate-300 dark:border-white/10 bg-white/40 pl-11 pr-10 text-xs font-black tracking-widest text-slate-900 dark:text-white dark:bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
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

export default function SiteBrandHeader(props) {
  return (
    <Suspense fallback={<header className={`flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between py-2 ${props.className || ''}`}></header>}>
      <SiteBrandHeaderInner {...props} />
    </Suspense>
  );
}
