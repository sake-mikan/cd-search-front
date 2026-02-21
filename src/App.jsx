import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Moon, Sun } from 'lucide-react';
import { fetchAlbums } from './api/albums';
import AlbumDetail from './pages/AlbumDetail';
import ArtistTracks from './pages/ArtistTracks';
import TrackSearch from './pages/TrackSearch';

const TOP_RELEASE_LIMIT = 5;
const THEME_STORAGE_KEY = 'theme-preference';

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

  const [sort, setSort] = useState('release_date');
  const [order, setOrder] = useState('desc');

  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isBlank = (v) => String(v ?? '').trim() === '';
  const isEmptySearch = (filters = {}) => {
    const nextTitle = filters.title ?? title;
    const nextArtist = filters.artist ?? artist;
    const nextCatalog = filters.catalog_number ?? catalogNumber;
    const nextReleaseDate = filters.release_date ?? releaseDate;

    return (
      isBlank(nextTitle) &&
      isBlank(nextArtist) &&
      isBlank(nextCatalog) &&
      isBlank(nextReleaseDate)
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
      const response = await fetchAlbums({
        ...query,
        page: topOnlyMode ? 1 : page,
        ...(topOnlyMode ? { per_page: TOP_RELEASE_LIMIT } : {}),
      });

      setAlbums(response.data.data ?? []);
      setCurrentPage(response.data.current_page ?? 1);
      setLastPage(response.data.last_page ?? 1);
    } catch {
      setError('データの取得に失敗しました。');
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
    loadAlbums(page);
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
    'border px-4 py-2 cursor-pointer select-none hover:bg-gray-300/60 dark:hover:bg-gray-600/70';

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

  const visibleAlbums = useMemo(() => {
    const emptySearch =
      isBlank(title) &&
      isBlank(artist) &&
      isBlank(catalogNumber) &&
      isBlank(releaseDate);

    if (!emptySearch) return albums;

    return [...albums]
      .sort((a, b) => {
        const aDate = Date.parse(a?.release_date ?? '');
        const bDate = Date.parse(b?.release_date ?? '');
        const safeA = Number.isNaN(aDate) ? -Infinity : aDate;
        const safeB = Number.isNaN(bDate) ? -Infinity : bDate;
        return safeB - safeA;
      })
      .slice(0, TOP_RELEASE_LIMIT);
  }, [albums, title, artist, catalogNumber, releaseDate]);

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

  return (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-3 right-3 z-50 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/90 px-3 py-1.5 text-xs text-gray-700 shadow backdrop-blur hover:bg-white dark:border-gray-600 dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-800"
        title={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      >
        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{isDarkMode ? 'ライト' : 'ダーク'}</span>
      </button>

      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-6">
              <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h1 className="text-2xl font-bold">CD情報検索</h1>

                  <Link
                    to="/tracks"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    曲検索へ
                  </Link>
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

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="border px-4 py-2 w-20">ジャケット</th>
                      <th className={sortableHeaderClass}>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
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
                          className="inline-flex items-center gap-1"
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
                          className="inline-flex items-center gap-1"
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
                          className="inline-flex items-center gap-1"
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
                            to={`/albums/${a.id}`}
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
            </div>
          }
        />

        <Route path="/albums/:id" element={<AlbumDetail />} />
        <Route path="/artists/:id/tracks" element={<ArtistTracks />} />
        <Route path="/tracks" element={<TrackSearch />} />
      </Routes>
    </>
  );
}

export default App;
