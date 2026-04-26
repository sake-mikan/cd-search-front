'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Music4, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import SiteFooter from '@/components/SiteFooter';
import InfoCard from '@/components/InfoCard';
import PageHeaderCard from '@/components/PageHeaderCard';
import ResponsiveResultList from '@/components/ResponsiveResultList';
import SearchHeroCard from '@/components/SearchHeroCard';
import SiteBrandHeader from '@/components/SiteBrandHeader';
import FeatureIntroCards from '@/components/FeatureIntroCards';
import SearchValueHighlights from '@/components/SearchValueHighlights';
import { fetchTracks } from '@/lib/api';
import { getAlbumRoutePath } from '@/utils/albumPublicId';
import {
  inputClass,
  pageCardClass,
  pageShellClass,
  secondaryButtonClass,
  PageBackdrop,
  ThemeToggle,
  tableCellClass,
  primaryButtonClass,
} from '@/utils/uiTheme';
import { useTheme } from './ThemeProvider';

function roleLabel(role) {
  if (role === 'vocal') return '歌唱';
  if (role === 'lyricist') return '作詞';
  if (role === 'composer') return '作曲';
  if (role === 'arranger') return '編曲';
  return role;
}

function trackCredits(track) {
  if (track?.credits && typeof track.credits === 'object') {
    const normalized = {};
    for (const [role, list] of Object.entries(track.credits)) {
      if (!Array.isArray(list) || list.length === 0) continue;
      normalized[role] = list
        .map((item) => ({ id: item?.id ?? null, public_id: item?.public_id ?? null, name: item?.name ?? '' }))
        .filter((item) => String(item.name).trim() !== '');
    }
    if (Object.keys(normalized).length > 0) return normalized;
  }
  return {};
}

function creditsSummary(track) {
  const groups = trackCredits(track);
  const entries = Object.entries(groups);
  if (entries.length === 0) return '-';
  return entries.map(([role, people]) => `${roleLabel(role)}: ${people.map(p => p.name).join(', ')}`).join(' / ');
}

const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

export default function TrackSearchClient() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [title, setTitle] = useState('');
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState('release_date');
  const [order, setOrder] = useState('desc');
  
  const load = async ({ nextTitle = submittedTitle, nextPage = currentPage, nextSort = sort, nextOrder = order } = {}) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchTracks({
        title: nextTitle.trim(),
        page: nextPage,
        per_page: 20,
        sort: nextSort,
        order: nextOrder,
      });
      
      const tracks = response.data?.tracks;
      setItems(tracks?.data ?? []);
      setCurrentPage(Number(tracks?.current_page || nextPage));
      setLastPage(Number(tracks?.last_page || 1));
      setTotalCount(Number(tracks?.total || (tracks?.data?.length ?? 0)));
    } catch (caughtError) {
      console.error(caughtError);
      setItems([]);
      setTotalCount(0);
      setError('楽曲検索の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSearched) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sort, order, hasSearched]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (nextTitle === '') {
      setError('曲名を入力してください。');
      setHasSearched(false);
      setItems([]);
      setCurrentPage(1);
      setLastPage(1);
      setTotalCount(0);
      return;
    }
    setError('');
    setItems([]);
    setLastPage(1);
    setCurrentPage(1);
    setTotalCount(0);
    setSubmittedTitle(nextTitle);
    setHasSearched(true);
    load({ nextTitle, nextPage: 1, nextSort: sort, nextOrder: order });
  };

  const handleClear = () => {
    setTitle('');
    setSubmittedTitle('');
    setCurrentPage(1);
    setItems([]);
    setLastPage(1);
    setTotalCount(0);
    setError('');
    setHasSearched(false);
  };

  const handleSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(nextSort);
    setOrder(nextOrder);
    setCurrentPage(1);
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const pageButtons = Array.from({ length: lastPage }, (_, index) => index + 1).filter(
    (page) => Math.abs(page - currentPage) <= 2 || page === 1 || page === lastPage
  );

  const columns = [
    {
      key: 'title',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('title')}>
          曲名
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'album',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('album')}>
          アルバム
          {sortIcon('album')}
        </button>
      ),
    },
    {
      key: 'catalog',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('catalog_number')}>
          規格品番
          {sortIcon('catalog_number')}
        </button>
      ),
      className: 'w-40 whitespace-nowrap tabular-nums',
    },
    {
      key: 'release',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('release_date')}>
          発売日
          {sortIcon('release_date')}
        </button>
      ),
      className: 'w-32 whitespace-nowrap',
    },
  ];

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <ThemeToggle />

      <div className={pageCardClass}>
        <SiteBrandHeader />

        <FeatureIntroCards />

        <SearchHeroCard
          current="track"
          badge="TRACK SEARCH"
          badgeIcon={Music4}
          title={'楽曲名検索'}
          subtitle={'曲名から収録アルバムやクレジットを横断して探せます。'}
        >
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 gap-6 items-end md:grid-cols-[1fr_auto_auto]">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">曲名</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={'例: Thank You!'}
                  className={inputClass}
                  required
                />
              </div>
              <button type="submit" className={primaryButtonClass}><Search className="h-4 w-4" />検索</button>
              <button type="button" onClick={handleClear} className="flex h-12 items-center justify-center rounded-full bg-slate-200/50 px-6 text-sm font-bold text-slate-700 dark:bg-white/5 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-all backdrop-blur-md">
                クリア
              </button>
            </div>
          </form>
        </SearchHeroCard>

        {!hasSearched ? (
          <InfoCard title="検索のヒント" description="楽曲名を入力して検索を押すと、収録アルバムと主要クレジットを表示します。" />
        ) : null}

        {loading ? <InfoCard title="検索結果" description="楽曲を検索しています。" /> : null}

        {error ? (
          <p className="rounded-[32px] border border-red-200 bg-red-50 px-8 py-6 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {hasSearched && !loading && !error ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InfoCard title={`検索結果 ${totalCount}件`}>
              <ResponsiveResultList
                items={items}
                columns={columns}
                emptyText="該当する楽曲がありません。"
                renderDesktopRow={(track, index, rowClass) => (
                  <tr key={track.id ?? index} className={`${rowClass} group/row`}>
                    <td className={tableCellClass}>
                      <span className="font-black text-slate-900 dark:text-white">{track.title}</span>
                    </td>
                    <td className={tableCellClass}>
                      {track.album?.id ? (
                        <Link href={getAlbumRoutePath(track.album)} className="text-blue-600 font-bold underline-offset-8 transition-all hover:text-sky-400 dark:text-sky-400 dark:hover:text-sky-300 hover:underline decoration-sky-500/50 decoration-2">
                          {track.album.title}
                        </Link>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-medium">-</span>
                      )}
                    </td>
                    <td className={tableCellClass}>
                      <span className="font-black tabular-nums text-slate-500 dark:text-white/40 tracking-widest uppercase">{track.album?.catalog_number_display || track.album?.catalog_number || '-'}</span>
                    </td>
                    <td className={tableCellClass}>
                      <span className="font-black text-slate-400 dark:text-white/40 whitespace-nowrap">{track.album?.release_date?.replace(/-/g, '/') || '-'}</span>
                    </td>
                  </tr>
                )}
                renderMobileCard={(track) => (
                  <div key={track.id} className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 backdrop-blur-3xl transition-all hover:bg-white/10 active:scale-95">
                    <div className="space-y-3">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{track.title}</h3>
                      <p className="line-clamp-2 text-sm font-bold text-slate-500 dark:text-white/40 leading-relaxed">
                        {track.album?.id ? (
                          <Link href={getAlbumRoutePath(track.album)} className="text-sky-600 hover:underline decoration-2 underline-offset-4 dark:text-sky-400">
                            {track.album.title}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-500 dark:text-white/40 tracking-widest uppercase">{track.album?.catalog_number_display || track.album?.catalog_number || '-'}</span>
                      <span className="px-3 py-1 rounded-full bg-sky-500/10 text-[10px] font-black text-sky-600 dark:text-sky-400 tracking-widest uppercase">{track.album?.release_date?.replace(/-/g, '/') || '-'}</span>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-200/50 bg-slate-50/50 dark:border-white/5 dark:bg-black/20 p-4 text-[11px] font-bold text-slate-500 dark:text-white/30 leading-relaxed">
                      {creditsSummary(track)}
                    </div>
                  </div>
                )}
              />
              {lastPage > 1 ? (
                <div className="mt-16 flex items-center justify-center gap-5">
                  <button type="button" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronLeft className="h-5 w-5" /></button>
                  <div className="flex items-center gap-4 px-10 py-3 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 font-black text-sm tracking-widest backdrop-blur-3xl shadow-sm">
                    {pageButtons.map((page, index) => (
                      <span key={page}>
                        {index > 0 && pageButtons[index - 1] !== page - 1 ? <span className="px-2 text-slate-400">...</span> : null}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          disabled={page === currentPage}
                          className={
                            page === currentPage
                              ? 'rounded-full bg-sky-600 px-3 py-1 text-white shadow-lg shadow-sky-500/20 font-black'
                              : 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-all font-bold px-3 py-1'
                          }
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage} className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronRight className="h-5 w-5" /></button>
                </div>
              ) : null}
            </InfoCard>
          </div>
        ) : null}
      </div>
      <SiteFooter />
    </div>
  );
}
