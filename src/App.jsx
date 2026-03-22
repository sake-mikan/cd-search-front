import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Moon, Sun } from 'lucide-react';
import { fetchAllAlbums } from './api/albums';
import AlbumDetail from './pages/AlbumDetail';
import AlbumCorrectionRequest from './pages/AlbumCorrectionRequest';
import ArtistTracks from './pages/ArtistTracks';
import ArtistAlbums from './pages/ArtistAlbums';
import SeriesAlbums from './pages/SeriesAlbums';
import TrackSearch from './pages/TrackSearch';
import SiteFooter from './components/SiteFooter';
import { getAlbumRoutePath } from './utils/albumPublicId';

const TOP_RELEASE_LIMIT = 10;
const SEARCH_PAGE_SIZE = 20;
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

  if (!normalizedLeft) {
    return 1;
  }

  if (!normalizedRight) {
    return -1;
  }

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
  if (catalogComparison !== 0) {
    return catalogComparison;
  }

  const releaseDateComparison =
    getSortableTimestamp(left?.release_date) - getSortableTimestamp(right?.release_date);
  if (releaseDateComparison !== 0) {
    return releaseDateComparison;
  }

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

      const topOnlyMode = isEmptySearch(override);
      const response = await fetchAllAlbums(query);
      const fetchedAlbums = Array.isArray(response.data) ? response.data : [];
      const nextAlbums = isBlankValue(query.catalog_number)
        ? collapseEditionVariants(fetchedAlbums)
        : fetchedAlbums;
      const pageSize = topOnlyMode ? TOP_RELEASE_LIMIT : SEARCH_PAGE_SIZE;
      const totalValue = nextAlbums.length;
      const nextLastPage = Math.max(1, Math.ceil(Math.max(totalValue, 1) / pageSize));
      const nextPage = topOnlyMode ? 1 : Math.min(Math.max(page, 1), nextLastPage);

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
    loadAlbums(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    if (mq.addEventListener) {
      mq.addEventListener('change', onMediaChange);
    } else {
      mq.addListener(onMediaChange);
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', onMediaChange);
      } else {
        mq.removeListener(onMediaChange);
      }
    };
  }, [themeMode]);

  useEffect(() => {
    if (themeMode === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

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

    for (let i = start; i <= end; i++) {
      addPage(i);
    }

    if (end < lastPage) {
      if (end < lastPage - 1) addEllipsis('end');
      addPage(lastPage);
    }

    return pages;
  };

  const visibleAlbums = isEmptySearch()
    ? albums.slice(0, TOP_RELEASE_LIMIT)
    : albums.slice((currentPage - 1) * SEARCH_PAGE_SIZE, currentPage * SEARCH_PAGE_SIZE);

  const handleClear = () => {
    setTitle('');
    setCatalogNumber('');
    setReleaseDate('');
    setArtist('');
    setCurrentPage(1);
    setError('');

    loadAlbums(1, {
      title: '',
      catalog_number: '',
      release_date: '',
      artist: '',
    });
  };

  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 px-3 pb-6 pt-4 sm:p-6 relative">
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
              <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h1 className="text-2xl font-bold">CD情報検索</h1>
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
                >
                  <input
                    className="border rounded px-3 py-2 bg-white dark:bg-gray-700"
                    placeholder="タイトル"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <input
                    className="border rounded px-3 py-2 bg-white dark:bg-gray-700"
                    placeholder="アーティスト"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                  />

                  <input
                    className="border rounded px-3 py-2 bg-white dark:bg-gray-700"
                    placeholder="規格品番"
                    value={catalogNumber}
                    onChange={(e) => setCatalogNumber(e.target.value)}
                  />

                  <input
                    type="date"
                    className="border rounded px-3 py-2 bg-white dark:bg-gray-700"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                  />

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                    >
                      検索
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="flex-1 bg-gray-300 dark:bg-gray-700 rounded px-4 py-2 hover:bg-gray-400 dark:hover:bg-gray-600"
                    >
                      クリア
                    </button>
                  </div>
                </form>

                {loading && <p className="text-gray-400">Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && !isEmptySearch() && (
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                    検索結果: {resultCount}件
                    {resultLimited ? `（上限 ${resultLimit}件）` : ''}
                  </p>
                )}

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
                                alt={a.title}
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
                            {a.title}
                          </Link>
                        </td>

                        <td className="border px-4 py-2">{a.album_artist?.name ?? '-'}</td>
                        <td className="border px-4 py-2">{a.catalog_number}</td>
                        <td className="border px-4 py-2">{a.release_date}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>

                {!isEmptySearch() && (
                  <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
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

