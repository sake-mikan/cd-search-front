import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, FilePenLine, Moon, Search, ShieldCheck, Sun } from 'lucide-react';
import DiscMasterLogo from '../components/DiscMasterLogo';
import {
  fetchAllAlbums,
  fetchAlbumSuggestions,
  fetchMusicBrainzFallbackAlbums,
} from '../api/albums';
import InfoCard from '../components/InfoCard';
import PageHeaderCard from '../components/PageHeaderCard';
import ResponsiveResultList from '../components/ResponsiveResultList';
import SearchModeTabs from '../components/SearchModeTabs';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { formatDateDisplay } from '../utils/formatDateDisplay';
import { formatReleaseTypeLabelJa } from '../utils/releaseTypeLabel';
import {
  inputClass,
  pageCardClass,
  pageShellClass,
  secondaryButtonClass,
  PageBackdrop,
  floatingThemeButtonClass,
} from '../utils/uiTheme';

const SEARCH_PAGE_SIZE = 20;
const FEATURED_TILE_LIMIT = 12;

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

function pickFeaturedAlbums(items) {
  const next = Array.isArray(items) ? items.slice() : [];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next.slice(0, FEATURED_TILE_LIMIT);
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


export default function HomePage({ isDarkMode = false, onToggleTheme = () => {} }) {
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
  const [featuredWeekOffset, setFeaturedWeekOffset] = useState(0);
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
  const formActionButtonClass =
    'inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';
  const searchSubmitButtonClass =
    `${formActionButtonClass} bg-sky-600 text-white shadow-sm hover:bg-sky-700`;
  const clearButtonClass =
    `${formActionButtonClass} bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600`;
  const iconActionButtonClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600';

  const visibleAlbums = useMemo(
    () => albums.slice((currentPage - 1) * SEARCH_PAGE_SIZE, currentPage * SEARCH_PAGE_SIZE),
    [albums, currentPage]
  );

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
        artist: override.artist ?? artist,
        catalog_number: override.catalog_number ?? catalogNumber,
        release_date: override.release_date ?? releaseDate,
        sort: override.sort ?? sort,
        order: override.order ?? order,
      };

      const response = await fetchAllAlbums(query);
      const fetchedAlbums = Array.isArray(response.data) ? response.data : [];
      const shouldCollapseVariants = isBlankValue(query.catalog_number) && isBlankValue(query.title) && isBlankValue(query.artist);
      const nextAlbums = shouldCollapseVariants ? collapseEditionVariants(fetchedAlbums) : fetchedAlbums;
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
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + featuredWeekOffset * 7);
    const releaseWindow = getUpcomingReleaseWindow(baseDate);
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
        setFeaturedError('New Release の取得に失敗しました。');
      } finally {
        setFeaturedLoading(false);
      }
    };

    loadFeaturedAlbums();
  }, [featuredWeekOffset]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextQuery = {
      title,
      artist,
      catalog_number: catalogNumber,
      release_date: releaseDate,
    };

    if (!hasAnySearchInput(nextQuery)) {
      setError('タイトル、アーティスト、規格品番、発売日のいずれか1つ以上を入力してください。');
      setHasSearched(false);
      setMusicBrainzAlbums([]);
      setMusicBrainzError('');
      setMusicBrainzLoading(false);
      setMusicBrainzSearched(false);
      return;
    }

    setHasSearched(true);
    setCurrentPage(1);
    await loadAlbums(1);
  };

  const handleClear = () => {
    setTitle('');
    setArtist('');
    setCatalogNumber('');
    setReleaseDate('');
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

  const changePage = (page) => {
    if (!hasSearched) return;
    if (page < 1 || page > lastPage) return;
    setCurrentPage(page);
  };

  const showPreviousFeaturedWeek = () => setFeaturedWeekOffset((value) => value - 1);
  const showNextFeaturedWeek = () => setFeaturedWeekOffset((value) => value + 1);

  const changeSort = async (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(nextSort);
    setOrder(nextOrder);
    if (hasSearched) {
      setCurrentPage(1);
      await loadAlbums(1, { sort: nextSort, order: nextOrder });
    }
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const sortableHeaderButtonClass =
    'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

  const renderPages = () => {
    const pages = [];
    const addPage = (page) => {
      pages.push(
        <button
          key={page}
          type="button"
          onClick={() => changePage(page)}
          disabled={page === currentPage}
          className={
            page === currentPage
              ? 'rounded-full bg-sky-600 px-3 py-1 text-white'
              : 'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
          }
        >
          {page}
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

    for (let page = start; page <= end; page += 1) {
      addPage(page);
    }

    if (end < lastPage) {
      if (end < lastPage - 1) addEllipsis('end');
      addPage(lastPage);
    }

    return pages;
  };

  const columns = [
    { key: 'cover', header: 'ジャケット', className: 'w-24 whitespace-nowrap' },
    {
      key: 'title',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('title')} aria-label={'タイトルでソート'}>
          {'タイトル'}
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'artist',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('artist')} aria-label={'アーティストでソート'}>
          {'アーティスト'}
        </button>
      ),
    },
    {
      key: 'catalog',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('catalog_number')} aria-label={'規格品番でソート'}>
          {'規格品番'}
          {sortIcon('catalog_number')}
        </button>
      ),
      className: 'w-40 whitespace-nowrap font-mono',
    },
    {
      key: 'releaseDate',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => changeSort('release_date')} aria-label={'発売日でソート'}>
          {'発売日'}
          {sortIcon('release_date')}
        </button>
      ),
      className: 'w-32 whitespace-nowrap',
    },
  ];

  const showMusicBrainzSection = !loading && hasSearched && resultCount <= 5 && (musicBrainzLoading || musicBrainzError !== '' || musicBrainzSearched);

  const themeLabel = isDarkMode ? '\u30e9\u30a4\u30c8' : '\u30c0\u30fc\u30af';
  const themeTitle = isDarkMode ? '\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048' : '\u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048';

  return (
    <div className={pageShellClass}>
      <PageBackdrop />

      <button
        type="button"
        onClick={onToggleTheme}
        className={floatingThemeButtonClass}
        title={themeTitle}
        aria-label={themeTitle}
      >
        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{themeLabel}</span>
      </button>
      <div className={`${pageCardClass} max-w-7xl space-y-3`}>
        <div className="px-1 pt-1 sm:px-2">
          <DiscMasterLogo />
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[20px] border border-sky-300/35 bg-gradient-to-br from-sky-500/12 via-cyan-500/8 to-slate-900/5 p-3.5 shadow-[0_12px_32px_-22px_rgba(14,165,233,0.42)] ring-1 ring-sky-400/10 dark:border-sky-400/16 dark:from-sky-400/14 dark:via-cyan-400/10 dark:to-slate-950/24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_45%)]" />
            <div className="relative flex items-start gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-sky-500 text-white shadow-md shadow-sky-500/20">
                <FilePenLine className="h-[15px] w-[15px]" />
              </span>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">{'タグ書き込み機能'}</p>
                <p className="text-[13px] font-semibold leading-5 text-slate-900 dark:text-slate-100">{'対応ブラウザではローカルファイルへ楽曲情報を直接書き込めます。'}</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[20px] border border-emerald-300/35 bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-slate-900/5 p-3.5 shadow-[0_12px_32px_-22px_rgba(16,185,129,0.38)] ring-1 ring-emerald-400/10 dark:border-emerald-400/16 dark:from-emerald-400/14 dark:via-teal-400/10 dark:to-slate-950/24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_45%)]" />
            <div className="relative flex items-start gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <ShieldCheck className="h-[15px] w-[15px]" />
              </span>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{'アップロード不要'}</p>
                <p className="text-[13px] font-semibold leading-5 text-slate-900 dark:text-slate-100">{'音楽ファイルはサーバーへアップロードされません。ローカル環境内で処理できます。'}</p>
              </div>
            </div>
          </div>
        </div>
        <PageHeaderCard
          maxWidthClass="max-w-7xl"
          isDarkMode={isDarkMode}
          title={'\u0043\u0044\u60c5\u5831\u691c\u7d22'}
          subtitle={'タイトル、アーティスト、規格品番、発売日から横断検索できます。'}
          onToggleTheme={onToggleTheme}
          showFloatingThemeButton={false}
          showMobileThemeButton={true}
        >
          <div className="space-y-0">
            <SearchModeTabs current="album" />
            <div className="-mt-px space-y-4 rounded-b-[24px] border border-slate-200/90 border-t-0 bg-slate-50/30 p-4 dark:border-slate-700/90 dark:bg-slate-900/20">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto_auto] xl:items-end">
              <label className="space-y-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{'タイトル'}</span>
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} list="album-title-suggestions" placeholder={'例: MILLION C@STING 03'} className={inputClass} />
                <datalist id="album-title-suggestions">
                  {titleSuggestions.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{'アーティスト'}</span>
                <input type="text" value={artist} onChange={(event) => setArtist(event.target.value)} list="album-artist-suggestions" placeholder={'例: STAR ELEMENTS'} className={inputClass} />
                <datalist id="album-artist-suggestions">
                  {artistSuggestions.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{'規格品番'}</span>
                <input type="text" value={catalogNumber} onChange={(event) => setCatalogNumber(event.target.value)} list="album-catalog-suggestions" placeholder={'例: LACM-14080'} className={inputClass} />
                <datalist id="album-catalog-suggestions">
                  {catalogSuggestions.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{'発売日'}</span>
                <input type="date" value={releaseDate} onChange={(event) => setReleaseDate(event.target.value)} className={inputClass} />
              </label>
              <button type="submit" className={`${searchSubmitButtonClass} xl:self-end`}><Search className="h-4 w-4" />{'検索'}</button>
              <button type="button" onClick={handleClear} className={`${clearButtonClass} xl:self-end`}>{'クリア'}</button>
            </form>
            {!loading && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
            </div>
          </div>
        </PageHeaderCard>
        {!hasSearched ? (
          <InfoCard className="space-y-4">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                <CalendarDays className="h-3.5 w-3.5" />
                UPCOMING PICKUP
              </span>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">New Release</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={showPreviousFeaturedWeek}
                    className={iconActionButtonClass}
                    title={'\u524d\u306e\u9031\u3092\u8868\u793a'}
                    aria-label={'\u524d\u306e\u9031\u3092\u8868\u793a'}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="inline-flex min-h-[40px] items-center rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-200">
                    {featuredRangeLabel}
                  </div>
                  <button
                    type="button"
                    onClick={showNextFeaturedWeek}
                    className={iconActionButtonClass}
                    title={'\u6b21\u306e\u9031\u3092\u8868\u793a'}
                    aria-label={'\u6b21\u306e\u9031\u3092\u8868\u793a'}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            {featuredLoading ? <p className="text-sm text-slate-500 dark:text-slate-300">{'\u65b0\u8b5c\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u3067\u3059\u3002'}</p> : null}
            {!featuredLoading && featuredError ? <p className="text-sm text-red-600 dark:text-red-300">{featuredError}</p> : null}
            {!featuredLoading && !featuredError && featuredAlbums.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-300">{'\u3053\u306e\u671f\u9593\u306b\u8a72\u5f53\u3059\u308bCD\u306f\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002'}</p> : null}
            {!featuredLoading && featuredAlbums.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {featuredAlbums.map((album) => (
                  <Link
                    key={album.id}
                    to={getAlbumRoutePath(album)}
                    state={{ title: album.title }}
                    className="group relative isolate flex min-h-[280px] overflow-hidden rounded-[24px] border border-slate-900/10 bg-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10"
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-[24px]">
                      {album.cover_image_url ? (
                        <img src={album.cover_image_url} alt={formatAlbumListTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 will-change-transform group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                    </div>
                    <div className="relative flex h-full w-full flex-col justify-between p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                          <CalendarRange className="h-3 w-3" />{formatDateDisplay(album.release_date) || '-'}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] text-white/85 backdrop-blur-sm">{album.catalog_number_display || album.catalog_number || 'unknown'}</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="line-clamp-3 text-lg font-semibold leading-snug text-white">{formatAlbumListTitle(album)}</h3>
                        <p className="line-clamp-2 text-sm leading-6 text-white/80">{album.album_artist?.name ?? '-'}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </InfoCard>
        ) : null}

        {hasSearched ? (
          <InfoCard title={`検索結果 ${resultCount}件`} description={resultLimited ? `上限 ${resultLimit} 件で検索しています。` : ''}>
            {loading ? <p className="text-sm text-slate-500 dark:text-slate-300">{'検索中です...'}</p> : null}
            {!loading && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
            {!loading && !error ? (
              <>
                <ResponsiveResultList
                  items={visibleAlbums}
                  columns={columns}
                  emptyText={'該当するCDは見つかりませんでした。'}
                  renderDesktopRow={(album, index, rowClass) => (
                    <tr key={album.id ?? index} className={rowClass}>
                      <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-600">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                          {album.cover_image_url ? <img src={album.cover_image_url} alt={formatAlbumListTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                        </div>
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 font-medium dark:border-slate-600">
                        <div className="space-y-2">
                          <Link to={getAlbumRoutePath(album)} state={{ title: album.title }} className="inline text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300">{formatAlbumListTitle(album)}</Link>
                          <div>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-100">{formatReleaseTypeLabelJa(album.release_type, album.release_type_label) || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-700 dark:border-slate-600 dark:text-slate-200">{album.album_artist?.name ?? '-'}</td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600">{album.catalog_number_display || album.catalog_number || '-'}</td>
                      <td className="border-b px-4 py-3 whitespace-nowrap text-slate-600 dark:border-slate-600 dark:text-slate-300">{formatDateDisplay(album.release_date) || '-'}</td>
                    </tr>
                  )}
                  renderMobileCard={(album) => (
                    <Link key={album.id} to={getAlbumRoutePath(album)} state={{ title: album.title }} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40">
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
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono dark:bg-slate-700">{album.catalog_number_display || album.catalog_number || '-'}</span>
                            <span>{formatDateDisplay(album.release_date) || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                />
                {lastPage > 1 ? (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className={`${secondaryButtonClass} disabled:opacity-50`}>{'前へ'}</button>
                    {renderPages()}
                    <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === lastPage} className={`${secondaryButtonClass} disabled:opacity-50`}>{'次へ'}</button>
                  </div>
                ) : null}
              </>
            ) : null}
          </InfoCard>
        ) : null}

        {showMusicBrainzSection ? (
          <InfoCard title={'MusicBrainz 候補'} description={resultCount === 0 ? '登録済みデータに見つからなかったため、MusicBrainz の検索結果を表示しています。' : '登録済みデータに加えて、未登録の MusicBrainz 候補も表示しています。'}>
            {musicBrainzLoading ? <p className="text-sm text-slate-500 dark:text-slate-300">{'MusicBrainz を検索しています...'}</p> : null}
            {!musicBrainzLoading && musicBrainzError ? <p className="text-sm text-red-600 dark:text-red-300">{musicBrainzError}</p> : null}
            {!musicBrainzLoading && !musicBrainzError ? (
              <ResponsiveResultList
                items={musicBrainzAlbums}
                columns={columns.filter((column) => column.key !== 'releaseType')}
                emptyText={'MusicBrainz にも候補は見つかりませんでした。'}
                renderDesktopRow={(album, index, rowClass) => (
                  <tr key={album.id ?? index} className={rowClass}>
                    <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-600">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                        {album.cover_image_url ? <img src={album.cover_image_url} alt={album.title} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                      </div>
                    </td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-medium dark:border-slate-600"><Link to={`/albums/musicbrainz/${album.musicbrainz_id}`} className="text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300">{album.title}</Link></td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-700 dark:border-slate-600 dark:text-slate-200">{album.album_artist || '-'}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600">{album.catalog_number_display || album.catalog_number || '-'}</td>
                    <td className="border-b px-4 py-3 whitespace-nowrap text-slate-600 dark:border-slate-600 dark:text-slate-300">{formatDateDisplay(album.release_date) || '-'}</td>
                  </tr>
                )}
                renderMobileCard={(album) => (
                  <Link key={album.id} to={`/albums/musicbrainz/${album.musicbrainz_id}`} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40">
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                      <div className="flex aspect-square w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-700">
                        {album.cover_image_url ? <img src={album.cover_image_url} alt={album.title} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <h3 className="line-clamp-3 text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{album.title}</h3>
                        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{album.album_artist || '-'}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono dark:bg-slate-700">{album.catalog_number_display || album.catalog_number || '-'}</span>
                          <span>{formatDateDisplay(album.release_date) || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              />
            ) : null}
          </InfoCard>
        ) : null}
      </div>
      <div className="mt-6 text-center">
        <Link to="/site-policy" className="text-sm font-medium text-slate-600 underline decoration-slate-400/70 underline-offset-4 transition hover:text-sky-700 dark:text-slate-300 dark:decoration-slate-500/70 dark:hover:text-sky-300">{'サイトポリシー'}</Link>
      </div>
      <SiteFooter />
    </div>
  );
}

