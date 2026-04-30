'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, ChevronLeft, ChevronRight, Moon, Search, Sparkles, Sun, CalendarRange, Tag, CloudOff, Globe, Music2 } from 'lucide-react';
import { fetchAllAlbums, fetchMusicBrainzFallbackAlbums } from '@/lib/api';
import InfoCard from './InfoCard';
import ResponsiveResultList from './ResponsiveResultList';
import SearchHeroCard from './SearchHeroCard';
import BarcodeScanner from './BarcodeScanner';
import SiteBrandHeader from './SiteBrandHeader';
import SiteFooter from './SiteFooter';
import FeatureIntroCards from './FeatureIntroCards';
import SearchValueHighlights from './SearchValueHighlights';
import { getAlbumRoutePath } from '@/utils/albumPublicId';
import { formatDateDisplay } from '@/utils/formatDateDisplay';
import { formatReleaseTypeLabelJa } from '@/utils/releaseTypeLabel';
import {
  inputClass,
  pageCardClass,
  pageShellClass,
  secondaryButtonClass,
  PageBackdrop,
  ThemeToggle,
  primaryButtonClass,
  tableCellClass,
} from '@/utils/uiTheme';
import { useTheme } from './ThemeProvider';

const SEARCH_PAGE_SIZE = 20;

const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

function isBlankValue(value) {
  return String(value ?? '').trim() === '';
}

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

function formatAlbumListTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();

  if (variantGroupKey !== '' && edition !== '' && edition !== '-') {
    return `${title} [${edition}]`;
  }

  return title;
}

function formatDateYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getUpcomingReleaseWindow(baseDate = new Date()) {
  const start = new Date(baseDate);
  const diffToSunday = -start.getDay();
  start.setDate(start.getDate() + diffToSunday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    from: formatDateYmd(start),
    to: formatDateYmd(end),
    label: `${formatDateYmd(start).replace(/-/g, '/')} - ${formatDateYmd(end).replace(/-/g, '/')}`,
  };
}

function normalizeMusicBrainzMatchText(value) {
  return String(value ?? '').trim().toLocaleLowerCase('ja-JP').replace(/\s+/g, ' ');
}

function createAlbumIdentityKey(album) {
  return [
    normalizeMusicBrainzMatchText(album?.title),
    normalizeMusicBrainzMatchText(album?.album_artist?.name ?? album?.album_artist),
    normalizeCatalogNumber(album?.catalog_number_display ?? album?.catalog_number),
    String(album?.release_date ?? '').trim(),
  ].join('|');
}

function filterNewMusicBrainzAlbums(fallbackAlbums, existingAlbums) {
  const existingKeys = new Set((Array.isArray(existingAlbums) ? existingAlbums : []).map(createAlbumIdentityKey));
  return (Array.isArray(fallbackAlbums) ? fallbackAlbums : []).filter(
    (album) => !existingKeys.has(createAlbumIdentityKey(album))
  );
}

function shouldSearchMusicBrainzFallback(filters) {
  const filledCount = [filters.title, filters.artist, filters.catalog_number].filter((value) => !isBlankValue(value)).length;
  return !isBlankValue(filters.catalog_number) || filledCount >= 2;
}

function hasAnySearchInput(filters) {
  return [filters.title, filters.artist, filters.catalog_number, filters.release_date].some(
    (value) => !isBlankValue(value)
  );
}

export default function HomeClient() {
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState(searchParams.get('title') ?? '');
  const [artist, setArtist] = useState(searchParams.get('artist') ?? '');
  const [catalogNumber, setCatalogNumber] = useState(searchParams.get('catalog_number') ?? '');
  const [releaseDate, setReleaseDate] = useState(searchParams.get('release_date') ?? '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page') ?? '1'));
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'release_date');
  const [order, setOrder] = useState(searchParams.get('order') ?? 'desc');

  const [lastPage, setLastPage] = useState(1);
  const [resultCount, setResultCount] = useState(0);
  const [resultLimited, setResultLimited] = useState(false);
  const [resultLimit, setResultLimit] = useState(1000);
  const [featuredWeekOffset, setFeaturedWeekOffset] = useState(0);
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredRangeLabel, setFeaturedRangeLabel] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [musicBrainzAlbums, setMusicBrainzAlbums] = useState([]);
  const [musicBrainzLoading, setMusicBrainzLoading] = useState(false);
  const [musicBrainzError, setMusicBrainzError] = useState('');
  const [musicBrainzSearched, setMusicBrainzSearched] = useState(false);

  const initialSearchTriggered = useRef(false);

  const visibleAlbums = useMemo(
    () => albums.slice((currentPage - 1) * SEARCH_PAGE_SIZE, currentPage * SEARCH_PAGE_SIZE),
    [albums, currentPage]
  );

  const syncUrlWithState = useCallback((overrides = {}) => {
    const params = new URLSearchParams();
    const t = overrides.title !== undefined ? overrides.title : title;
    const a = overrides.artist !== undefined ? overrides.artist : artist;
    const c = overrides.catalog_number !== undefined ? overrides.catalog_number : catalogNumber;
    const d = overrides.release_date !== undefined ? overrides.release_date : releaseDate;
    const p = overrides.page !== undefined ? overrides.page : currentPage;
    const s = overrides.sort !== undefined ? overrides.sort : sort;
    const o = overrides.order !== undefined ? overrides.order : order;

    if (t) params.set('title', t);
    if (a) params.set('artist', a);
    if (c) params.set('catalog_number', c);
    if (d) params.set('release_date', d);
    if (p > 1) params.set('page', String(p));
    if (s !== 'release_date') params.set('sort', s);
    if (o !== 'desc') params.set('order', o);

    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : '/', { scroll: false });
  }, [artist, catalogNumber, currentPage, order, releaseDate, router, sort, title]);

  const loadAlbums = async (page = 1, override = {}) => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    setMusicBrainzAlbums([]);
    setMusicBrainzError('');
    setMusicBrainzLoading(false);
    setMusicBrainzSearched(false);

    try {
      const query = {
        title: override.title ?? title,
        artist: override.artist ?? artist,
        catalog_number: override.catalog_number ?? catalogNumber,
        release_date: override.release_date ?? releaseDate,
        sort: override.sort ?? sort,
        order: override.order ?? order,
      };

      const response = await fetchAllAlbums(query);
      const fetchedAlbums = Array.isArray(response.data) ? response.data : [];
      const shouldCollapseVariants = isBlankValue(query.catalog_number);
      const nextAlbums = shouldCollapseVariants ? collapseEditionVariants(fetchedAlbums) : fetchedAlbums;
      const totalValue = nextAlbums.length;
      const nextLastPage = Math.max(1, Math.ceil(Math.max(totalValue, 1) / SEARCH_PAGE_SIZE));
      const nextPage = Math.min(Math.max(page, 1), nextLastPage);

      setAlbums(nextAlbums);
      setCurrentPage(nextPage);
      setLastPage(nextLastPage);
      setResultCount(totalValue);
      setResultLimited(Boolean(response.result_limited));
      setResultLimit(Number(response.result_limit || 1000));

      if (shouldSearchMusicBrainzFallback(query) && totalValue <= 5) {
        setMusicBrainzLoading(true);
        setMusicBrainzSearched(true);
        try {
          const fallbackAlbums = await fetchMusicBrainzFallbackAlbums({
            title: query.title,
            artist: query.artist,
            catalog_number: query.catalog_number,
          });
          setMusicBrainzAlbums(filterNewMusicBrainzAlbums(fallbackAlbums, nextAlbums));
        } catch {
          setMusicBrainzError('MusicBrainz の補助候補取得に失敗しました。');
        } finally {
          setMusicBrainzLoading(false);
        }
      }
    } catch {
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = searchParams.get('title') ?? '';
    const a = searchParams.get('artist') ?? '';
    const c = searchParams.get('catalog_number') ?? '';
    const d = searchParams.get('release_date') ?? '';
    const p = Number(searchParams.get('page') ?? '1');
    const s = searchParams.get('sort') ?? 'release_date';
    const o = searchParams.get('order') ?? 'desc';

    setTitle(t);
    setArtist(a);
    setCatalogNumber(c);
    setReleaseDate(d);
    setCurrentPage(p);
    setSort(s);
    setOrder(o);

    if (t || a || c || d) {
      loadAlbums(p, { title: t, artist: a, catalog_number: c, release_date: d, sort: s, order: o });
    } else {
      setHasSearched(false);
      setAlbums([]);
    }
  }, [searchParams]);

  useEffect(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + featuredWeekOffset * 7);
    const releaseWindow = getUpcomingReleaseWindow(baseDate);
    setFeaturedRangeLabel(releaseWindow.label);
    const loadFeaturedAlbums = async () => {
      setFeaturedLoading(true);
      try {
        const response = await fetchAllAlbums({
          release_date_from: releaseWindow.from,
          release_date_to: releaseWindow.to,
          sort: 'release_date',
          order: 'asc',
        });
        const upcomingAlbums = collapseEditionVariants(Array.isArray(response.data) ? response.data : []);
        setFeaturedAlbums(upcomingAlbums.slice(0, 12));
      } catch {
        setFeaturedAlbums([]);
      } finally {
        setFeaturedLoading(false);
      }
    };
    loadFeaturedAlbums();
  }, [featuredWeekOffset]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const query = { title, artist, catalog_number: catalogNumber, release_date: releaseDate };
    if (!hasAnySearchInput(query)) {
      setError('タイトル、アーティスト、規格品番、発売日のいずれか1つ以上を入力してください。');
      setHasSearched(false);
      return;
    }
    setCurrentPage(1);
    syncUrlWithState({ page: 1 });
    loadAlbums(1);
  };

  const handleClear = () => {
    setTitle(''); setArtist(''); setCatalogNumber(''); setReleaseDate('');
    setHasSearched(false); setAlbums([]); router.replace('/', { scroll: false });
    setError(''); setMusicBrainzAlbums([]); setMusicBrainzSearched(false);
  };

  const changePage = (page) => {
    if (page < 1 || page > lastPage) return;
    setCurrentPage(page);
    syncUrlWithState({ page });
  };

  const changeSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(nextSort); setOrder(nextOrder);
    syncUrlWithState({ sort: nextSort, order: nextOrder });
    loadAlbums(currentPage, { sort: nextSort, order: nextOrder });
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return order === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const pageButtons = Array.from({ length: lastPage }, (_, index) => index + 1).filter(
    (page) => Math.abs(page - currentPage) <= 2 || page === 1 || page === lastPage
  );

  const showMusicBrainzSection = !loading && hasSearched && resultCount <= 5 && (musicBrainzLoading || musicBrainzError !== '' || musicBrainzSearched);

  const columns = [
    { key: 'cover', header: 'ジャケット', className: 'w-24 whitespace-nowrap' },
    { key: 'title', header: <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('title')}>タイトル {sortIcon('title')}</button> },
    { key: 'artist', header: <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('artist')}>アーティスト</button> },
    { key: 'catalog', header: <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('catalog_number')}>規格品番 {sortIcon('catalog_number')}</button>, className: 'w-40' },
    { key: 'releaseDate', header: <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('release_date')}>発売日 {sortIcon('release_date')}</button>, className: 'w-32' },
  ];

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <ThemeToggle />

      <div className={pageCardClass}>
        <SiteBrandHeader isHome={true} hideSearchOnMobile={true} />

        <FeatureIntroCards />

        {/* Search Engine Card */}
        <SearchHeroCard
          className="!-mt-9"
          current="cd"
          title="CD情報検索"
          subtitle="タイトル・アーティスト・規格品番・発売日など、蓄積された多数の楽曲情報から検索できます。"
        >
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto_auto] items-end">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">タイトル</span>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="例: MILLION C@STING 03" />
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">アーティスト</span>
                <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} className={inputClass} placeholder="例: STAR ELEMENTS" />
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">規格品番</span>
                <input type="text" value={catalogNumber} onChange={(e) => setCatalogNumber(e.target.value)} className={inputClass} placeholder="例: LACM-14080" />
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">発売日</span>
                <input type="text" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className={inputClass} placeholder="年 / 月 / 日" />
              </div>
              <button type="submit" disabled={loading} className={primaryButtonClass}>
                <Search className="h-4 w-4" /> 検索
              </button>
              <button type="button" onClick={handleClear} className="flex h-12 items-center justify-center rounded-full bg-slate-200/50 px-6 text-sm font-bold text-slate-700 dark:bg-white/5 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-all backdrop-blur-md">
                クリア
              </button>
            </div>
          </form>
          {!loading && error ? <p className="mt-6 text-sm font-bold text-red-600 dark:text-red-400">{error}</p> : null}
        </SearchHeroCard>

        {/* New Release Grid */}
        {!hasSearched && (
          <InfoCard
            className="-mt-3 space-y-4"
            headerSection={
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400 shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                  UPCOMING PICKUP
                </span>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">New Release</h2>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setFeaturedWeekOffset(v => v - 1)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-200 text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"><ChevronLeft className="h-4 w-4" /></button>
                    <div className="inline-flex min-h-[40px] items-center rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-200">
                      {featuredRangeLabel}
                    </div>
                    <button type="button" onClick={() => setFeaturedWeekOffset(v => v + 1)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-200 text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featuredLoading ? <p className="text-sm text-slate-500 dark:text-slate-300">新譜を読み込み中です。</p> : 
                featuredAlbums.map((album) => (
                  <Link key={album.id} href={getAlbumRoutePath(album)} className="group relative isolate flex min-h-[280px] overflow-hidden rounded-[24px] border border-slate-900/10 bg-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10">
                    <div className="absolute inset-0 overflow-hidden rounded-[24px]">
                      {album.cover_image_url ? (
                        <img src={album.cover_image_url} alt={formatAlbumListTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 will-change-transform group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                    </div>
                    
                    <div className="relative flex h-full w-full flex-col justify-between p-4">
                      {/* Top Overlay Badges (React版再現) */}
                      <div className="flex items-start justify-between gap-3">
                        {(() => {
                          const typeLabel = formatReleaseTypeLabelJa(album.release_type, album.release_type_label);
                          return typeLabel ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm shadow-sm transition-transform group-hover:scale-105">
                              <Music2 className="h-3 w-3" />{typeLabel}
                            </span>
                          ) : <div />;
                        })()}
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] text-white/85 backdrop-blur-sm shadow-sm transition-transform group-hover:scale-105">{album.catalog_number_display || album.catalog_number || 'unknown'}</span>
                      </div>

                      <div className="space-y-1.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="line-clamp-3 text-lg font-semibold leading-snug text-white drop-shadow-lg">{formatAlbumListTitle(album)}</h3>
                        <p className="line-clamp-2 text-sm font-medium text-white/70 drop-shadow-md">{album.album_artist?.name ?? '-'}</p>
                      </div>
                    </div>
                  </Link>
                ))
              }
            </div>
          </InfoCard>
        )}

        {/* Results Engine */}
        {hasSearched && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InfoCard title={`検索結果 ${resultCount}件`} description={resultLimited ? `上限 ${resultLimit} 件で検索しています。` : ''}>
              {loading && <p className="text-sm text-slate-500 dark:text-slate-300 py-10 text-center animate-pulse tracking-widest uppercase">Synchronizing Sectors...</p>}
              {!loading && (
                <ResponsiveResultList
                  items={visibleAlbums}
                  columns={columns}
                  emptyText="該当するCDは見つかりませんでした。"
                  renderDesktopRow={(album, index, rowClass) => (
                    <tr key={album.id ?? index} className={`${rowClass} group/row`}>
                      <td className={tableCellClass}>
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                          {album.cover_image_url ? <img src={album.cover_image_url} alt={formatAlbumListTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                        </div>
                      </td>
                      <td className={tableCellClass}>
                        <div className="flex flex-col gap-2.5">
                          <Link href={getAlbumRoutePath(album)} className="inline text-blue-600 underline-offset-8 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300 font-bold decoration-sky-500/30">
                            {formatAlbumListTitle(album)}
                          </Link>
                          <div className="pt-0.5">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-100 tracking-wider uppercase">{formatReleaseTypeLabelJa(album.release_type, album.release_type_label) || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className={tableCellClass}>{album.album_artist?.name ?? '-'}</td>
                      <td className={tableCellClass}>{album.catalog_number_display || album.catalog_number || '-'}</td>
                      <td className={tableCellClass}>{formatDateDisplay(album.release_date) || '-'}</td>
                    </tr>
                  )}
                  renderMobileCard={(album) => (
                    <Link key={album.id} href={getAlbumRoutePath(album)} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40">
                      <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                        <div className="flex aspect-square w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-700">
                          {album.cover_image_url ? <img src={album.cover_image_url} alt={formatAlbumListTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="line-clamp-3 text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{formatAlbumListTitle(album)}</h3>
                            <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">{formatReleaseTypeLabelJa(album.release_type, album.release_type_label) || '-'}</span>
                          </div>
                          <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{album.album_artist?.name ?? '-'}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 tabular-nums dark:bg-slate-700">{album.catalog_number_display || album.catalog_number || '-'}</span>
                            <span>{formatDateDisplay(album.release_date) || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                />
              )}
              {lastPage > 1 && (
                <div className="mt-16 flex items-center justify-center gap-5">
                  <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronLeft className="h-5 w-5" /></button>
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
                  <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === lastPage} className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronRight className="h-5 w-5" /></button>
                </div>
              )}
            </InfoCard>

            {showMusicBrainzSection && (
              <InfoCard 
                title="MusicBrainz 候補" 
                description={resultCount === 0 ? '登録済みデータに見つからなかったため、MusicBrainz の検索結果を表示しています。' : '登録済みデータに加えて、未登録の MusicBrainz 候補も表示しています。'}
                className="border-emerald-500/20 dark:border-emerald-500/10"
              >
                {musicBrainzLoading ? <p className="text-sm text-slate-500 dark:text-slate-300 py-10 text-center animate-pulse uppercase tracking-[0.2em]">MusicBrainz Deep Scan...</p> : null}
                {!musicBrainzLoading && musicBrainzError ? <p className="text-sm text-red-600 dark:text-red-300">{musicBrainzError}</p> : null}
                {!musicBrainzLoading && !musicBrainzError && (
                  <ResponsiveResultList
                    items={musicBrainzAlbums}
                    columns={columns}
                    emptyText="MusicBrainz にも候補は見つかりませんでした。"
                    renderDesktopRow={(album, index, rowClass) => (
                      <tr key={album.musicbrainz_id || index} className={rowClass}>
                        <td className={tableCellClass}>
                          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                            {album.cover_image_url ? <img src={album.cover_image_url} alt={album.title} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                          </div>
                        </td>
                        <td className={tableCellClass}>
                          <Link href={`/albums/musicbrainz/${album.musicbrainz_id}`} className="text-blue-600 font-bold underline-offset-8 transition-all hover:text-sky-400 dark:text-sky-400 dark:hover:text-sky-300 decoration-sky-500/30">
                            {album.title}
                          </Link>
                        </td>
                        <td className={tableCellClass}>{album.album_artist || '-'}</td>
                        <td className={tableCellClass}>{album.catalog_number_display || album.catalog_number || '-'}</td>
                        <td className={tableCellClass}>{formatDateDisplay(album.release_date) || '-'}</td>
                      </tr>
                    )}
                    renderMobileCard={(album) => (
                      <Link key={album.musicbrainz_id} href={`/albums/musicbrainz/${album.musicbrainz_id}`} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40">
                        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                          <div className="flex aspect-square w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-700">
                            {album.cover_image_url ? <img src={album.cover_image_url} alt={album.title} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <h3 className="line-clamp-3 text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{album.title}</h3>
                            <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{album.album_artist || '-'}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 tabular-nums dark:bg-slate-700">{album.catalog_number_display || album.catalog_number || '-'}</span>
                              <span>{formatDateDisplay(album.release_date) || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )}
                  />
                )}
              </InfoCard>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
