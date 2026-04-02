import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarRange, Moon, RefreshCcw, Sparkles, Sun } from 'lucide-react';
import { fetchAllAlbums, fetchAlbumSuggestions, fetchMusicBrainzFallbackAlbums } from './api/albums';
import AlbumDetail from './pages/AlbumDetail';
import AlbumCorrectionRequest from './pages/AlbumCorrectionRequest';
import MusicBrainzAlbumDetail from './pages/MusicBrainzAlbumDetail';
import ArtistTracks from './pages/ArtistTracks';
import ArtistAlbums from './pages/ArtistAlbums';
import SeriesAlbums from './pages/SeriesAlbums';
import TrackSearch from './pages/TrackSearch';
import ContentSearch from './pages/ContentSearch';
import SiteFooter from './components/SiteFooter';
import { getAlbumRoutePath } from './utils/albumPublicId';
import { formatDateDisplay } from './utils/formatDateDisplay';

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
const normalizeMusicBrainzMatchText = (value) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('ja-JP')
    .replace(/\s+/g, ' ');

const createAlbumIdentityKey = (album) =>
  [
    normalizeMusicBrainzMatchText(album?.title),
    normalizeMusicBrainzMatchText(album?.album_artist?.name ?? album?.album_artist),
    normalizeCatalogNumber(album?.catalog_number_display ?? album?.catalog_number),
    String(album?.release_date ?? '').trim(),
  ].join('|');

const filterNewMusicBrainzAlbums = (fallbackAlbums, existingAlbums) => {
  const existingKeys = new Set((Array.isArray(existingAlbums) ? existingAlbums : []).map(createAlbumIdentityKey));
  return (Array.isArray(fallbackAlbums) ? fallbackAlbums : []).filter(
    (album) => !existingKeys.has(createAlbumIdentityKey(album))
  );
};

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
  const [hasSearched, setHasSearched] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [catalogSuggestions, setCatalogSuggestions] = useState([]);
  const [musicBrainzAlbums, setMusicBrainzAlbums] = useState([]);
  const [musicBrainzLoading, setMusicBrainzLoading] = useState(false);
  const [musicBrainzError, setMusicBrainzError] = useState('');
  const [musicBrainzSearched, setMusicBrainzSearched] = useState(false);

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
  const shouldSearchMusicBrainzFallback = (filters = {}) => {
    const nextTitle = filters.title ?? title;
    const nextArtist = filters.artist ?? artist;
    const nextCatalog = filters.catalog_number ?? catalogNumber;

    const filledCount = [nextTitle, nextArtist, nextCatalog].filter((value) => !isBlankValue(value)).length;
    return !isBlankValue(nextCatalog) || filledCount >= 2;
  };
  const loadAlbums = async (page = 1, override = {}) => {
    setLoading(true);
    setError('');
    setMusicBrainzAlbums([]);
    setMusicBrainzError('');
    setMusicBrainzLoading(false);
    setMusicBrainzSearched(false);

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

      const shouldSearchFallback = shouldSearchMusicBrainzFallback(query);
      if (shouldSearchFallback && totalValue <= 5) {
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
          setMusicBrainzError('登録済みデータに対する補助候補の取得に失敗しました。');
        } finally {
          setMusicBrainzLoading(false);
        }
      }
    } catch {
      setError('データの取得に失敗しました。');
      setAlbums([]);
      setCurrentPage(1);
      setLastPage(1);
      setResultCount(0);
      setResultLimited(false);
      setMusicBrainzAlbums([]);
      setMusicBrainzError('');
      setMusicBrainzLoading(false);
      setMusicBrainzSearched(false);
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
        setFeaturedError('新着CDの取得に失敗しました。');
      } finally {
        setFeaturedLoading(false);
      }
    };

    loadFeaturedAlbums();
  }, [featuredRefreshKey]);

  useEffect(() => {
    const query = title.trim();
    if (query === '') {
      setTitleSuggestions([]);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const items = await fetchAlbumSuggestions('title', query, 8);
        if (active) setTitleSuggestions(items);
      } catch {
        if (active) setTitleSuggestions([]);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [title]);

  useEffect(() => {
    const query = artist.trim();
    if (query === '') {
      setArtistSuggestions([]);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const items = await fetchAlbumSuggestions('artist', query, 8);
        if (active) setArtistSuggestions(items);
      } catch {
        if (active) setArtistSuggestions([]);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [artist]);

  useEffect(() => {
    const query = catalogNumber.trim();
    if (query === '') {
      setCatalogSuggestions([]);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const items = await fetchAlbumSuggestions('catalog_number', query, 8);
        if (active) setCatalogSuggestions(items);
      } catch {
        if (active) setCatalogSuggestions([]);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [catalogNumber]);

  const toggleTheme = () => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentDark = themeMode === 'dark' || (themeMode === 'system' && systemDark);
    setThemeMode(currentDark ? 'light' : 'dark');
  };

  const changePage = (page) => {
    if (!hasSearched) return;
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
    'border border-slate-200 px-3 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer select-none hover:bg-slate-200/80 dark:border-slate-600 dark:hover:bg-slate-600/80';

  const renderPages = () => {
    if (!hasSearched) return null;

    const pages = [];
    const addPage = (i) => {
      pages.push(
        <button
          key={i}
          onClick={() => changePage(i)}
          disabled={i === currentPage}
          className={`rounded-full px-3 py-1 ${i === currentPage ? 'bg-sky-600 text-white cursor-default' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'}` }
        >
          {i}
        </button>
      );
    };

    const addEllipsis = (key) => {
      pages.push(
        <span key={key} className="px-2 py-1 text-slate-500 dark:text-slate-400">
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
    setTitleSuggestions([]);
    setArtistSuggestions([]);
    setCatalogSuggestions([]);
    setMusicBrainzAlbums([]);
    setMusicBrainzError('');
    setMusicBrainzLoading(false);
    setMusicBrainzSearched(false);
    setHasSearched(false);
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

  const themeLabel = isDarkMode ? '\u30e9\u30a4\u30c8' : '\u30c0\u30fc\u30af';
  const themeTitle = isDarkMode ? '\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048' : '\u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048';
  const isInitialView = !hasSearched;
  const showMusicBrainzSection =
    !isInitialView && resultCount === 0 && (musicBrainzLoading || musicBrainzError !== '' || musicBrainzSearched);
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
                        className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
                      >
                        楽曲名検索
                      </Link>
                      <Link
                        to="/contents"
                        className="inline-flex items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        {'\u4f5c\u54c1\u304b\u3089\u63a2\u3059'}
                      </Link>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (isEmptySearch()) {
                        setHasSearched(false);
                        setAlbums([]);
                        setCurrentPage(1);
                        setLastPage(1);
                        setError('');
                        setResultCount(0);
                        setResultLimited(false);
                        return;
                      }
                      setHasSearched(true);
                      loadAlbums(1);
                    }}
                    className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5"
                  >
                    <>
                      <input
                        list="album-title-suggestions"
                        className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
                        placeholder="タイトル"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <datalist id="album-title-suggestions">
                        {titleSuggestions.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    </>

                    <>
                      <input
                        list="album-artist-suggestions"
                        className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
                        placeholder="アーティスト"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                      />
                      <datalist id="album-artist-suggestions">
                        {artistSuggestions.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    </>


                    <>
                      <input
                        list="album-catalog-suggestions"
                        className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
                        placeholder="規格品番"
                        value={catalogNumber}
                        onChange={(e) => setCatalogNumber(e.target.value)}
                      />
                      <datalist id="album-catalog-suggestions">
                        {catalogSuggestions.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    </>

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
                        <p className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                          <CalendarRange className="h-3.5 w-3.5" />
                          UPCOMING PICKUP
                        </p>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
                          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">New Release</h2>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
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
                              <div className="absolute inset-0 overflow-hidden rounded-[24px]">
                                <img
                                  src={album.cover_image_url}
                                  alt={formatAlbumListTitle(album)}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition duration-500 will-change-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                              </div>
                            ) : (
                              <div className="absolute inset-0 overflow-hidden rounded-[24px]">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                              </div>
                            )}
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

                {!isInitialView && resultCount > 0 && (
                  <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-700/80">
                          <th className="border-b border-r border-slate-200 px-3 py-2 w-20 text-sm font-semibold whitespace-nowrap last:border-r-0 dark:border-slate-600">ジャケット</th>
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
                          <th className={sortableHeaderClass}>{'\u7a2e\u5225'}</th>
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
                          <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            <td className="border-b border-r border-slate-200 px-2 py-2 last:border-r-0 dark:border-slate-600">
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

                            <td className="border-b border-r border-slate-200 px-4 py-2 last:border-r-0 dark:border-slate-600">
                              <Link
                                to={getAlbumRoutePath(a)}
                                state={{ title: a.title }}
                                className="text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 hover:underline underline-offset-4"
                              >
                                {formatAlbumListTitle(a)}
                              </Link>
                            </td>

                            <td className="border-b border-r border-slate-200 px-4 py-2 last:border-r-0 dark:border-slate-600">{a.album_artist?.name ?? '-'}</td>
                            <td className="border-b border-r border-slate-200 px-4 py-2 whitespace-nowrap w-[9.5rem] last:border-r-0 dark:border-slate-600">{a.catalog_number_display || a.catalog_number || '-'}</td>
                            <td className="border-b border-r border-slate-200 px-4 py-2 whitespace-nowrap w-[7rem] last:border-r-0 dark:border-slate-600">{a.release_type_label || a.release_type || '-'}</td>
                            <td className="border-b border-r border-slate-200 px-4 py-2 whitespace-nowrap w-[8.5rem] last:border-r-0 dark:border-slate-600">{formatDateDisplay(a.release_date) || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                )}

                {showMusicBrainzSection && (
                  <section className="mt-6 rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90">
                    <div className="mb-4 space-y-1">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">MusicBrainz 候補</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {resultCount === 0 ? '登録済みデータに見つからなかったため、MusicBrainz の検索結果を表示しています。' : '登録済みデータに加えて、未登録の MusicBrainz 候補も表示しています。'}
                      </p>
                    </div>

                    {musicBrainzLoading && (
                      <p className="text-sm text-slate-500 dark:text-slate-300">MusicBrainz を検索しています...</p>
                    )}

                    {!musicBrainzLoading && musicBrainzError && (
                      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {musicBrainzError}
                      </p>
                    )}

                    {!musicBrainzLoading && !musicBrainzError && musicBrainzAlbums.length === 0 && resultCount === 0 && (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                        MusicBrainz にも候補は見つかりませんでした。
                      </p>
                    )}

                    {!musicBrainzLoading && musicBrainzAlbums.length > 0 && (
                      <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[760px] border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-700/80">
                                <th className="border-b border-r border-slate-200 px-3 py-2 w-20 text-sm font-semibold whitespace-nowrap last:border-r-0 dark:border-slate-600">ジャケット</th>
                                <th className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold whitespace-nowrap last:border-r-0 dark:border-slate-600">タイトル</th>
                                <th className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold whitespace-nowrap last:border-r-0 dark:border-slate-600">アーティスト</th>
                                <th className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold whitespace-nowrap last:border-r-0 dark:border-slate-600">規格品番</th>
                                <th className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold whitespace-nowrap last:border-r-0 dark:border-slate-600">発売日</th>
                              </tr>
                            </thead>
                            <tbody>
                              {musicBrainzAlbums.map((album) => (
                                <tr key={album.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                  <td className="border-b border-r border-slate-200 px-2 py-2 last:border-r-0 dark:border-slate-600">
                                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                                      {album.cover_image_url ? (
                                        <img
                                          src={album.cover_image_url}
                                          alt={album.title}
                                          loading="lazy"
                                          decoding="async"
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextSibling.style.display = 'block';
                                          }}
                                        />
                                      ) : null}
                                      <span
                                        className="text-xs text-gray-500 dark:text-gray-300"
                                        style={{ display: album.cover_image_url ? 'none' : 'block' }}
                                      >
                                        No Image
                                      </span>
                                    </div>
                                  </td>
                                  <td className="border-b border-r border-slate-200 px-4 py-2 last:border-r-0 dark:border-slate-600">
                                    <Link
                                      to={'/albums/musicbrainz/' + album.musicbrainz_id}
                                      className="text-blue-600 hover:underline hover:text-blue-800 dark:text-sky-400 dark:hover:text-sky-300"
                                    >
                                      {album.title}
                                    </Link>
                                  </td>
                                  <td className="border-b border-r border-slate-200 px-4 py-2 last:border-r-0 dark:border-slate-600">{album.album_artist || '-'}</td>
                                  <td className="border-b border-r border-slate-200 px-4 py-2 whitespace-nowrap last:border-r-0 dark:border-slate-600">{album.catalog_number_display || album.catalog_number || '-'}</td>
                                  <td className="border-b border-r border-slate-200 px-4 py-2 whitespace-nowrap last:border-r-0 dark:border-slate-600">{formatDateDisplay(album.release_date) || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {!isInitialView && resultCount > 0 && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    >
                      前へ
                    </button>

                    {renderPages()}

                    <button
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === lastPage}
                      className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
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
          path="/albums/musicbrainz/:id"
          element={<MusicBrainzAlbumDetail isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
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
          path="/contents"
          element={<ContentSearch isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
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
