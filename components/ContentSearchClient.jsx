'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, Grid2x2, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAllAlbums, fetchContents } from '@/lib/api';
import InfoCard from './InfoCard';
import PageHeaderCard from './PageHeaderCard';
import ResponsiveResultList from './ResponsiveResultList';
import SearchHeroCard from './SearchHeroCard';
import SiteBrandHeader from './SiteBrandHeader';
import SiteFooter from './SiteFooter';
import FeatureIntroCards from './FeatureIntroCards';
import SearchValueHighlights from './SearchValueHighlights';
import { getAlbumRoutePath } from '@/utils/albumPublicId';
import { formatDateDisplay } from '@/utils/formatDateDisplay';
import { PageBackdrop, ThemeToggle, pageCardClass, pageShellClass, panelClass, secondaryButtonClass, tableCellClass } from '@/utils/uiTheme';
import { useTheme } from './ThemeProvider';

const SEARCH_PAGE_SIZE = 20;
const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

function normalizeCatalogNumber(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function compareCatalogNumbers(left, right) {
  const normalizedLeft = normalizeCatalogNumber(left);
  const normalizedRight = normalizeCatalogNumber(right);

  if (normalizedLeft === normalizedRight) {
    return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  if (!normalizedLeft) return 1;
  if (!normalizedRight) return -1;

  return normalizedLeft.localeCompare(normalizedRight, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function getSortableTimestamp(value) {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function compareVariantRepresentative(left, right) {
  const catalogComparison = compareCatalogNumbers(left?.catalog_number, right?.catalog_number);
  if (catalogComparison !== 0) return catalogComparison;

  const releaseDateComparison = getSortableTimestamp(left?.release_date) - getSortableTimestamp(right?.release_date);
  if (releaseDateComparison !== 0) return releaseDateComparison;

  return Number(left?.id ?? Number.MAX_SAFE_INTEGER) - Number(right?.id ?? Number.MAX_SAFE_INTEGER);
}

function getVariantKey(album) {
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();
  if (variantGroupKey !== '') {
    return `variant:${variantGroupKey}`;
  }
  return `album:${album?.id ?? ''}`;
}

function collapseEditionVariants(albums) {
  const representativeByGroup = new Map();

  for (const album of albums) {
    const key = getVariantKey(album);
    const current = representativeByGroup.get(key);
    if (!current || compareVariantRepresentative(album, current) < 0) {
      representativeByGroup.set(key, album);
    }
  }

  const representativeIds = new Set(
    [...representativeByGroup.values()].map((album) => album?.id).filter((id) => id != null)
  );

  return albums.filter((album) => representativeIds.has(album?.id));
}

function formatAlbumTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();

  if (variantGroupKey !== '' && edition !== '' && edition !== '-') {
    return `${title} [${edition}]`;
  }

  return title;
}

export default function ContentSearchClient() {
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [contentTree, setContentTree] = useState([]);
  const [loadingContents, setLoadingContents] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [selectedContentName, setSelectedContentName] = useState('');
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [sort, setSort] = useState('release_date');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    let active = true;

    const loadContents = async () => {
      setLoadingContents(true);
      setError('');
      try {
        const items = await fetchContents();
        if (active) {
          setContentTree(items);
        }
      } catch {
        if (active) {
          setContentTree([]);
          setError('作品一覧の取得に失敗しました。');
        }
      } finally {
        if (active) {
          setLoadingContents(false);
        }
      }
    };

    loadContents();
    return () => {
      active = false;
    };
  }, []);

  const contentNameMap = useMemo(() => {
    const map = new Map();
    contentTree.forEach((parent) => {
      map.set(String(parent.id), parent.name);
      (Array.isArray(parent.children) ? parent.children : []).forEach((child) => {
        map.set(String(child.id), child.name);
      });
    });
    return map;
  }, [contentTree]);

  const visibleContentTree = useMemo(() => {
    if (selectedContentId === '') return contentTree;
    return contentTree.filter((parent) =>
      String(parent.id) === selectedContentId ||
      (Array.isArray(parent.children) ? parent.children : []).some((child) => String(child.id) === selectedContentId)
    );
  }, [contentTree, selectedContentId]);

  useEffect(() => {
    const nextContentId = String(searchParams.get('content_id') ?? '').trim();
    setSelectedContentId(nextContentId);
    setSelectedContentName(nextContentId !== '' ? contentNameMap.get(nextContentId) ?? '' : '');

    if (nextContentId === '') {
      setAlbums([]);
      setCurrentPage(1);
      setLastPage(1);
      return;
    }

    let active = true;
    const loadAlbums = async () => {
      setLoadingAlbums(true);
      setError('');
      try {
        const response = await fetchAllAlbums({ content_id: nextContentId, sort, order });
        const items = Array.isArray(response.data) ? response.data : [];
        const collapsed = collapseEditionVariants(items);
        const nextLastPage = Math.max(1, Math.ceil(Math.max(collapsed.length, 1) / SEARCH_PAGE_SIZE));
        if (active) {
          setAlbums(collapsed);
          setCurrentPage(1);
          setLastPage(nextLastPage);
        }
      } catch {
        if (active) {
          setAlbums([]);
          setCurrentPage(1);
          setLastPage(1);
          setError('作品別アルバムの取得に失敗しました。');
        }
      } finally {
        if (active) {
          setLoadingAlbums(false);
        }
      }
    };

    loadAlbums();
    return () => {
      active = false;
    };
  }, [searchParams, contentNameMap, sort, order]);

  const visibleAlbums = useMemo(
    () => albums.slice((currentPage - 1) * SEARCH_PAGE_SIZE, currentPage * SEARCH_PAGE_SIZE),
    [albums, currentPage]
  );

  const changePage = (page) => {
    const nextPage = Math.max(1, page);
    setCurrentPage(nextPage);
  };

  const selectContent = (id) => {
    const params = new URLSearchParams(searchParams);
    params.set('content_id', String(id));
    router.push(`/contents?${params.toString()}`);
  };

  const clearSelection = () => {
    router.push('/contents');
  };

  const handleSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(nextSort);
    setOrder(nextOrder);
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const columns = [
    { key: 'cover', header: 'ジャケット', className: 'w-24' },
    {
      key: 'title',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('title')} aria-label="タイトルでソート">
          タイトル
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'artist',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('artist')}>
          アーティスト
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
      key: 'releaseDate',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('release_date')}>
          発売日
          {sortIcon('release_date')}
        </button>
      ),
      className: 'w-32 whitespace-nowrap',
    },
  ];

  const pageButtons = Array.from({ length: lastPage }, (_, index) => index + 1).filter(
    (page) => Math.abs(page - currentPage) <= 2 || page === 1 || page === lastPage
  );

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <ThemeToggle />

      <div className={pageCardClass}>
        <SiteBrandHeader hideSearchOnMobile={true} />

        <FeatureIntroCards />

        <SearchHeroCard
          current="content"
          badge="CONTENT NAVI"
          badgeIcon={Grid2x2}
          title={'作品から探す'}
          subtitle={'作品名を選択すると関連アルバムが表示されます。'}
        >
          {loadingContents ? <p className="text-sm text-slate-500 dark:text-slate-300 py-10 text-center font-bold animate-pulse tracking-widest uppercase">Synchronizing Sectors...</p> : null}
          {!loadingContents && contentTree.length === 0 ? <p className="text-sm text-red-600 dark:text-red-300">{error || '作品一覧の取得に失敗しました。'}</p> : null}
          {!loadingContents && visibleContentTree.length > 0 ? (
            <div className="space-y-8">
              {visibleContentTree.map((parent) => (
                <section
                  key={parent.id}
                  className="rounded-[32px] border border-slate-200/40 bg-white/40 p-6 shadow-sm dark:border-white/5 dark:bg-black/20 backdrop-blur-xl"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                    <h2 className="text-sm font-black tracking-[0.2em] text-slate-900 dark:text-white uppercase">{parent.name}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {(Array.isArray(parent.children) ? parent.children : []).map((child) => {
                      const active = selectedContentId === String(child.id);
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => selectContent(child.id)}
                          className={`rounded-2xl border px-4 py-3 text-left text-xs font-bold transition-all duration-300 ${
                            active
                              ? 'border-sky-500 bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                              : 'border-slate-200/50 bg-white/50 text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-white/5 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
                          }`}
                        >
                          {child.name}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => selectContent(parent.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-xs font-bold transition-all duration-300 ${
                        selectedContentId === String(parent.id)
                          ? 'border-sky-500 bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                          : 'border-slate-200/50 bg-white/50 text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-white/5 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                    >
                      全て
                    </button>
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </SearchHeroCard>

        {selectedContentId !== '' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InfoCard 
              title={`検索結果 ${albums.length}件`} 
              description={selectedContentName || 'DOMAIN FILTER ACTIVE'}
              actions={
                <button type="button" onClick={clearSelection} className="px-5 py-2 rounded-full bg-slate-200/50 text-[10px] font-black tracking-widest text-slate-700 dark:bg-white/5 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-all uppercase backdrop-blur-md">
                  選択を解除
                </button>
              }
            >
              {loadingAlbums ? <p className="text-sm text-slate-500 dark:text-slate-300 py-10 text-center animate-pulse tracking-widest uppercase">Synchronizing Results...</p> : null}
              {!loadingAlbums && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
              {!loadingAlbums && !error ? (
                <>
                  <ResponsiveResultList
                    items={visibleAlbums}
                    columns={columns}
                    emptyText="この作品に紐づくアルバムは見つかりませんでした。"
                    renderDesktopRow={(album, index, rowClass) => (
                      <tr key={album.id ?? index} className={`${rowClass} group/row`}>
                        <td className={tableCellClass}>
                          <div className="h-16 w-16 overflow-hidden rounded-[20px] border border-white/10 group-hover/row:scale-110 transition-transform duration-500">
                            {album.cover_image_url ? (
                              <img
                                src={album.cover_image_url}
                                alt={formatAlbumTitle(album)}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] font-black text-white/10 uppercase italic">Null</div>
                            )}
                          </div>
                        </td>
                        <td className={tableCellClass}>
                          <Link
                            href={getAlbumRoutePath(album)}
                            className="text-base font-black text-slate-900 dark:text-white hover:text-sky-400 transition-all decoration-sky-500/50 decoration-2 underline-offset-8 hover:underline"
                          >
                            {formatAlbumTitle(album)}
                          </Link>
                        </td>
                        <td className={tableCellClass}>
                          <span className="font-bold text-slate-700 dark:text-white/60">{album.album_artist?.name ?? '-'}</span>
                        </td>
                        <td className={tableCellClass}>
                          <span className="font-black tabular-nums text-slate-500 dark:text-white/40 tracking-widest uppercase">{album.catalog_number_display || album.catalog_number || '-'}</span>
                        </td>
                        <td className={tableCellClass}>
                          <span className="font-black text-slate-400 dark:text-white/20 whitespace-nowrap">{formatDateDisplay(album.release_date) || '-'}</span>
                        </td>
                      </tr>
                    )}
                    renderMobileCard={(album) => (
                      <Link
                        key={album.id}
                        href={getAlbumRoutePath(album)}
                        className="flex gap-5 p-6 rounded-[32px] border border-slate-200/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5 backdrop-blur-3xl transition-all hover:bg-white/10 active:scale-95"
                      >
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[24px] border border-slate-200/50 dark:border-white/10">
                          {album.cover_image_url ? (
                            <img src={album.cover_image_url} alt={formatAlbumTitle(album)} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-white/10 font-black text-xs uppercase italic">Null</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <h3 className="truncate text-lg font-black text-slate-900 dark:text-white leading-tight">{formatAlbumTitle(album)}</h3>
                          <p className="truncate text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">{album.album_artist?.name ?? '-'}</p>
                          <div className="pt-2"><span className="px-3 py-1 rounded-full bg-sky-500 text-[10px] font-black text-white tracking-[0.1em] uppercase shadow-lg shadow-sky-500/20">{formatDateDisplay(album.release_date)}</span></div>
                        </div>
                      </Link>
                    )}
                  />

                  {lastPage > 1 ? (
                    <div className="mt-16 flex items-center justify-center gap-5">
                      <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="h-14 w-14 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronLeft className="h-6 w-6" /></button>
                      <div className="flex items-center gap-4 px-10 py-3 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 font-black text-sm tracking-widest backdrop-blur-3xl shadow-sm">
                        {pageButtons.map((page, index) => (
                          <span key={page}>
                            {index > 0 && pageButtons[index - 1] !== page - 1 ? <span className="px-2 text-slate-400">...</span> : null}
                            <button
                              type="button"
                              onClick={() => changePage(page)}
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
                      <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === lastPage} className="h-14 w-14 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronRight className="h-6 w-6" /></button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </InfoCard>
          </div>
        ) : null}
      </div>
      <SiteFooter />
    </div>
  );
}
