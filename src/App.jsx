import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarRange, Moon, RefreshCcw, Sparkles, Sun } from 'lucide-react';
import { fetchAllAlbums } from './api/albums';
import AlbumDetail from './pages/AlbumDetail';
import AlbumCorrectionRequest from './pages/AlbumCorrectionRequest';
import ArtistTracks from './pages/ArtistTracks';
import ArtistAlbums from './pages/ArtistAlbums';
import SeriesAlbums from './pages/SeriesAlbums';
import TrackSearch from './pages/TrackSearch';
import SiteFooter from './components/SiteFooter';
import { getAlbumRoutePath } from './utils/albumPublicId';

const SEARCH_PAGE_SIZE = 20;
const FEATURED_TILE_LIMIT = 12;
const THEME_STORAGE_KEY = 'theme-preference';

const isBlankValue = (value) => String(value ?? '').trim() === '';

const normalizeCatalogNumber = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const compareCatalogNumbers = (left, right) => {
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
};

const getSortableTimestamp = (value) => {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const compareVariantRepresentative = (left, right) => {
  const catalogComparison = compareCatalogNumbers(left?.catalog_number, right?.catalog_number);
  if (catalogComparison !== 0) return catalogComparison;

  const releaseDateComparison =
    getSortableTimestamp(left?.release_date) - getSortableTimestamp(right?.release_date);
  if (releaseDateComparison !== 0) return releaseDateComparison;

  return Number(left?.id ?? Number.MAX_SAFE_INTEGER) - Number(right?.id ?? Number.MAX_SAFE_INTEGER);
};

const getVariantKey = (album) => {
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();
  if (variantGroupKey !== '') {
    return `variant:${variantGroupKey}`;
  }
  return `album:${album?.id ?? ''}`;
};

const collapseEditionVariants = (albums) => {
  const representativeByGroup = new Map();

  for (const album of albums) {
    const key = getVariantKey(album);
    const current = representativeByGroup.get(key);
    if (!current || compareVariantRepresentative(album, current) < 0) {
      representativeByGroup.set(key, album);
    }
  }

  const representativeIds = new Set(
    [...representativeByGroup.values()]
      .map((album) => album?.id)
      .filter((id) => id !== undefined && id !== null)
  );

  return albums.filter((album) => representativeIds.has(album?.id));
};

const formatAlbumListTitle = (album) => {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();

  if (variantGroupKey !== '' && edition !== '' && edition !== '-') {
    return title !== '' ? `${title}【${edition}】` : `【${edition}】`;
  }

  return title;
};

const formatDateYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateSlash = (value) => String(value ?? '').trim().replace(/-/g, '/');

const getUpcomingReleaseWindow = (baseDate = new Date()) => {
  const start = new Date(baseDate);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  end.setHours(23, 59, 59, 999);

  return {
    from: formatDateYmd(start),
    to: formatDateYmd(end),
    label: `${formatDateYmd(start).replace(/-/g, '/')} - ${formatDateYmd(end).replace(/-/g, '/')}`,
  };
};

const shuffleAlbums = (items) => {
  const next = Array.isArray(items) ? items.slice() : [];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const pickFeaturedAlbums = (items) => shuffleAlbums(items).slice(0, FEATURED_TILE_LIMIT);

function App() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [releaseDate, setReleaseDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [resultCount, setResultCount] = useState(0);
  const [resultLimited, setResultLimited] = useState(false);
  const [resultLimit, setResultLimit] = useState(1000);

  const [featuredRefreshKey, setFeaturedRefreshKey] = useState(0);
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState('');
  const [featuredRangeLabel, setFeaturedRangeLabel] = useState('');

  const [sort, setSort] = useState('release_date');
  const [order, setOrder] = useState('desc');

  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isEmptySearch = (filters = {}) => {
    const nextTitle = filters.title ?? title;
    const nextArtist = filters.artist ?? artist;
    const nextCatalog = filters.catalog_number ?? catalogNumber;
    const nextReleaseDate = filters.release_date ?? releaseDate;

    return (
      isBlankValue(nextTitle) &&
      isBlankValue(nextArtist) &&
      isBlankValue(nextCatalog) &&
      isBlankValue(nextReleaseDate)
    );
  };
  const loadAlbums = async (page = 1, override = {}) => {
    setLoading(true);
    setError('');

    try {
      const query = {
        title: override.title ?? title,
        catalog_number: override.catalog_number ?? catalogNumber,
        release_date: override.release_date ?? releaseDate,
        artist: override.artist ?? artist,
        sort: override.sort ?? sort,
        order: override.order ?? order,
      };

      const response = await fetchAllAlbums(query);
      const fetchedAlbums = Array.isArray(response.data) ? response.data : [];
      const shouldCollapseEditionVariants =
        isBlankValue(query.catalog_number) &&
        isBlankValue(query.title) &&
        isBlankValue(query.artist);
      const nextAlbums = shouldCollapseEditionVariants ? collapseEditionVariants(fetchedAlbums) : fetchedAlbums;
      const totalValue = nextAlbums.length;
      const nextLastPage = Math.max(1, Math.ceil(Math.max(totalValue, 1) / SEARCH_PAGE_SIZE));
      const nextPage = Math.min(Math.max(page, 1), nextLastPage);

      setAlbums(nextAlbums);
      setCurrentPage(nextPage);
      setLastPage(nextLastPage);
      setResultCount(totalValue);
      setResultLimited(Boolean(response.result_limited));
      const limitValue = Number(response.result_limit ?? 1000);
      setResultLimit(Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 1000);
    } catch {
      setError('データの取得に失敗しました。');
      setAlbums([]);
      setCurrentPage(1);
      setLastPage(1);
      setResultCount(0);
      setResultLimited(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const dark = themeMode === 'dark' || (themeMode === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      setIsDarkMode(dark);
    };

    applyTheme();

    const onMediaChange = () => {
      if (themeMode === 'system') applyTheme();
    };

    if (mq.addEventListener) mq.addEventListener('change', onMediaChange);
    else mq.addListener(onMediaChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onMediaChange);
      else mq.removeListener(onMediaChange);
    };
  }, [themeMode]);

  useEffect(() => {
    if (themeMode === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const releaseWindow = getUpcomingReleaseWindow();
    setFeaturedRangeLabel(releaseWindow.label);

    const loadFeaturedAlbums = async () => {
      setFeaturedLoading(true);
      setFeaturedError('');
      try {
        const response = await fetchAllAlbums({
          release_date_from: releaseWindow.from,
          release_date_to: releaseWindow.to,
          sort: 'release_date',
          order: 'asc',
        });
        const fetchedAlbums = Array.isArray(response.data) ? response.data : [];
        const upcomingAlbums = collapseEditionVariants(fetchedAlbums).filter((album) => {
          const releaseValue = String(album?.release_date ?? '').trim();
          return releaseValue !== '' && releaseValue >= releaseWindow.from && releaseValue <= releaseWindow.to;
        });

        setFeaturedAlbums(pickFeaturedAlbums(upcomingAlbums));
      } catch {
        setFeaturedAlbums([]);
        setFeaturedError('今週〜来週の発売予定の取得に失敗しました。');
      } finally {
        setFeaturedLoading(false);
      }
    };

    loadFeaturedAlbums();
  }, [featuredRefreshKey]);

  const toggleTheme = () => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentDark = themeMode === 'dark' || (themeMode === 'system' && systemDark);
    setThemeMode(currentDark ? 'light' : 'dark');
  };

  const changePage = (page) => {
    if (isEmptySearch()) return;
    if (page < 1 || page > lastPage) return;
    setCurrentPage(page);
  };

  const changeSort = (newSort) => {
    if (sort === newSort) {
      const nextOrder = order === 'asc' ? 'desc' : 'asc';
      setOrder(nextOrder);
      loadAlbums(1, { sort: newSort, order: nextOrder });
    } else {
      setSort(newSort);
      setOrder('asc');
      loadAlbums(1, { sort: newSort, order: 'asc' });
    }
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const sortableHeaderClass =
    'border px-3 py-2 text-sm whitespace-nowrap cursor-pointer select-none hover:bg-gray-300/60 dark:hover:bg-gray-600/70';

  const renderPages = () => {
    if (isEmptySearch()) return null;

    const pages = [];
    const addPage = (i) => {
      pages.push(
        <button
          key={i}
          onClick={() => changePage(i)}
          disabled={i === currentPage}
          className={`px-3 py-1 rounded border ${
            i === currentPage
              ? 'bg-blue-600 text-white cursor-default'
              : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          {i}
        </button>
      );
    };

    const addEllipsis = (key) => {
      pages.push(
        <span key={key} className="px-2 py-1 text-gray-500 dark:text-gray-400">
          ...
        </span>
      );
    };

    const windowSize = 2;
    const start = Math.max(1, currentPage - windowSize);
    const end = Math.min(lastPage, currentPage + windowSize);

    if (start > 1) {
      addPage(1);
      if (start > 2) addEllipsis('start');
    }

    for (let i = start; i <= end; i += 1) {
      addPage(i);
    }

    if (end < lastPage) {
      if (end < lastPage - 1) addEllipsis('end');
      addPage(lastPage);
    }

    return pages;
  };

  const visibleAlbums = albums.slice((currentPage - 1) * SEARCH_PAGE_SIZE, currentPage * SEARCH_PAGE_SIZE);

  const handleClear = () => {
    setTitle('');
    setCatalogNumber('');
    setReleaseDate('');
    setArtist('');
    setAlbums([]);
    setCurrentPage(1);
    setLastPage(1);
    setError('');
    setResultCount(0);
    setResultLimited(false);
  };

  const refreshFeatured = () => {
    setFeaturedRefreshKey((value) => value + 1);
  };

  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
  const isInitialView = isEmptySearch();
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen overflow-hidden bg-gray-100 px-3 pb-6 pt-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-6 relative">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" />
                <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
                <div className="absolute bottom-8 left-1/3 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="absolute right-3 top-4 z-10 hidden lg:inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 sm:right-6 sm:top-6"
                title={themeTitle}
                aria-label={themeTitle}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{themeLabel}</span>
              </button>

              <div className="relative mx-auto max-w-7xl rounded-[28px] bg-white/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/95 dark:ring-white/10 sm:p-6">
                <div className="mb-6 overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/80 px-4 py-5 shadow-sm dark:border-slate-700/70 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 sm:px-6 sm:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                        <Sparkles className="h-3.5 w-3.5" />
                        CD ARCHIVE
                      </span>
                      <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">CD情報検索</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                          タイトル、アーティスト、規格品番、発売日から横断検索できます。
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 lg:hidden"
                        title={themeTitle}
                        aria-label={themeTitle}
                      >
                        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                        <span>{themeLabel}</span>
                      </button>
                      <Link
                        to="/tracks"
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                      >
                        曲検索へ
                      </Link>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      loadAlbums(1);
                    }}
                    className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5"
                  >
                    <input
                      className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
                      placeholder="タイトル"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />

                    <input
                      className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
                      placeholder="アーティスト"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                    />

                    <input
                      className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
                      placeholder="規格品番"
                      value={catalogNumber}
                      onChange={(e) => setCatalogNumber(e.target.value)}
                    />

                    <input
                      type="date"
                      className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                    />

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
                      >
                        検索
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="flex-1 rounded-2xl bg-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        クリア
                      </button>
                    </div>
                  </form>
                </div>

                {isInitialView && (
                  <section className="mb-8 rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/70 p-4 shadow-sm dark:border-slate-700/70 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 sm:p-5">
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-slate-700 shadow-sm dark:bg-slate-700/80 dark:text-slate-100">
                          <CalendarRange className="h-3.5 w-3.5" />
                          UPCOMING PICKUP
                        </p>
                        <div>
                          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Upcoming CDs</h2>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {featuredRangeLabel}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={refreshFeatured}
                        disabled={featuredLoading}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reload
                      </button>
                    </div>

                    {featuredLoading && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: FEATURED_TILE_LIMIT }).map((_, index) => (
                          <div
                            key={index}
                            className="h-[300px] animate-pulse rounded-[24px] border border-slate-200 bg-slate-200/70 dark:border-slate-700 dark:bg-slate-700/60"
                          />
                        ))}
                      </div>
                    )}

                    {!featuredLoading && featuredError && (
                      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {featuredError}
                      </p>
                    )}

                    {!featuredLoading && !featuredError && featuredAlbums.length === 0 && (
                      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        この期間に該当するCDは見つかりませんでした。
                      </p>
                    )}
                    {!featuredLoading && featuredAlbums.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {featuredAlbums.map((album) => (
                          <Link
                            key={album.id}
                            to={getAlbumRoutePath(album)}
                            state={{ title: album.title }}
                            className="group relative isolate flex min-h-[300px] overflow-hidden rounded-[24px] border border-slate-900/10 bg-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10"
                          >
                            {album.cover_image_url ? (
                              <img
                                src={album.cover_image_url}
                                alt={formatAlbumListTitle(album)}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                            <div className="relative flex h-full w-full flex-col justify-between p-4">
                              <div className="flex items-start justify-between gap-3">
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                                  <CalendarRange className="h-3 w-3" />
                                  {formatDateSlash(album.release_date)}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] text-white/85 backdrop-blur-sm">
                                  {String(album.catalog_number ?? '').trim() || 'unknown'}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <p className="text-[11px] font-medium tracking-[0.22em] text-white/60">CD RELEASE</p>
                                <h3 className="text-lg font-semibold leading-snug text-white">{formatAlbumListTitle(album)}</h3>
                                <p className="text-sm leading-6 text-white/80">{album.album_artist?.name ?? '-'}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {!isInitialView && loading && <p className="text-gray-400">Loading...</p>}
                {!isInitialView && error && <p className="text-red-500">{error}</p>}
                {!loading && !error && !isInitialView && (
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                    検索結果: {resultCount}件
                    {resultLimited ? `（上限 ${resultLimit}件）` : ''}
                  </p>
                )}

                {!isInitialView && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-200 dark:bg-gray-700">
                          <th className="border px-3 py-2 w-20 text-sm whitespace-nowrap">ジャケット</th>
                          <th className={sortableHeaderClass}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 whitespace-nowrap"
                              onClick={() => changeSort('title')}
                              aria-label="タイトルでソート"
                            >
                              タイトル
                              {sortIcon('title')}
                            </button>
                          </th>
                          <th className={sortableHeaderClass}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 whitespace-nowrap"
                              onClick={() => changeSort('artist')}
                              aria-label="アーティストでソート"
                            >
                              アーティスト
                              {sortIcon('artist')}
                            </button>
                          </th>
                          <th className={sortableHeaderClass}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 whitespace-nowrap"
                              onClick={() => changeSort('catalog_number')}
                              aria-label="規格品番でソート"
                            >
                              規格品番
                              {sortIcon('catalog_number')}
                            </button>
                          </th>
                          <th className={sortableHeaderClass}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 whitespace-nowrap"
                              onClick={() => changeSort('release_date')}
                              aria-label="発売日でソート"
                            >
                              発売日
                              {sortIcon('release_date')}
                            </button>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleAlbums.map((a) => (
                          <tr key={a.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                            <td className="border px-2 py-2">
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                                {a.cover_image_url ? (
                                  <img
                                    src={a.cover_image_url}
                                    alt={formatAlbumListTitle(a)}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextSibling.style.display = 'block';
                                    }}
                                  />
                                ) : null}
                                <span
                                  className="text-xs text-gray-500 dark:text-gray-300"
                                  style={{ display: a.cover_image_url ? 'none' : 'block' }}
                                >
                                  No Image
                                </span>
                              </div>
                            </td>

                            <td className="border px-4 py-2">
                              <Link
                                to={getAlbumRoutePath(a)}
                                state={{ title: a.title }}
                                className="text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 hover:underline underline-offset-4"
                              >
                                {formatAlbumListTitle(a)}
                              </Link>
                            </td>

                            <td className="border px-4 py-2">{a.album_artist?.name ?? '-'}</td>
                            <td className="border px-4 py-2 whitespace-nowrap w-[9.5rem]">{a.catalog_number}</td>
                            <td className="border px-4 py-2 whitespace-nowrap w-[8.5rem]">{a.release_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!isInitialView && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      前へ
                    </button>

                    {renderPages()}

                    <button
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === lastPage}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      次へ
                    </button>
                  </div>
                )}
              </div>
              <SiteFooter />
            </div>
          }
        />

        <Route
          path="/albums/:id/correction-request"
          element={<AlbumCorrectionRequest isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/albums/:id"
          element={<AlbumDetail isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/artists/:id/tracks"
          element={<ArtistTracks isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/artists/:id/albums"
          element={<ArtistAlbums isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/series/:id/albums"
          element={<SeriesAlbums isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/tracks"
          element={<TrackSearch isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
      </Routes>
    </>
  );
}

export default App;