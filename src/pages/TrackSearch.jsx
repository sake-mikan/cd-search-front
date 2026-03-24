import { buildApiUrl } from "../api/baseUrl";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { getArtistTracksRoutePath } from '../utils/artistPublicId';


function roleLabel(role) {
  if (role === 'vocal') return '歌唱';
  if (role === 'lyricist') return '作詞';
  if (role === 'composer') return '作曲';
  if (role === 'arranger') return '編曲';
  return role;
}

export default function TrackSearch({ isDarkMode = false, onToggleTheme = () => {} }) {
  const [title, setTitle] = useState('');
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const apiUrl = useMemo(() => {
    const q = new URLSearchParams();
    if (submittedTitle.trim() !== '') q.set('title', submittedTitle.trim());
    q.set('page', String(currentPage));
    q.set('per_page', '20');
    return buildApiUrl(`/tracks?${q.toString()}`);
  }, [submittedTitle, currentPage]);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const tracks = data?.tracks;
      setItems(tracks?.data ?? []);
      setCurrentPage(tracks?.current_page ?? 1);
      setLastPage(tracks?.last_page ?? 1);
    } catch (e) {
      console.error(e);
      setError('曲検索の取得に失敗しました。API が起動しているか確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setCurrentPage(1);
    setSubmittedTitle(title);
    setHasSearched(true);
  };

  useEffect(() => {
    if (!hasSearched) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, hasSearched]);

  const renderPages = () => {
    const pages = [];
    const addPage = (i) => {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          disabled={i === currentPage}
          className={
            i === currentPage
              ? 'px-3 py-1 rounded bg-blue-600 text-white'
              : 'px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }
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

  const groupCredits = (track) => {
    if (track?.credits && typeof track.credits === 'object') {
      const normalized = {};
      for (const [role, list] of Object.entries(track.credits)) {
        if (!Array.isArray(list) || list.length === 0) continue;
        normalized[role] = list
          .map((item) => ({
            id: item?.id ?? null,
            public_id: item?.public_id ?? null,
            name: item?.name ?? '',
          }))
          .filter((item) => String(item.name).trim() !== '');
      }
      if (Object.keys(normalized).length > 0) {
        return normalized;
      }
    }

    const artists = Array.isArray(track?.artists) ? track.artists : [];
    const map = {};
    for (const a of artists) {
      const role = a?.pivot?.role;
      if (!role) continue;
      if (!map[role]) map[role] = [];
      map[role].push({ id: a.id, public_id: a.public_id ?? null, name: a.name });
    }
    return map;
  };

  const showResults = hasSearched && !loading && !error;
  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-3 pb-6 pt-4 sm:p-6 text-gray-900 dark:text-gray-100 relative">
      <button
        type="button"
        onClick={onToggleTheme}
        className="absolute right-3 top-4 z-10 hidden lg:inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 sm:right-6 sm:top-6"
        title={themeTitle}
        aria-label={themeTitle}
      >
        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{themeLabel}</span>
      </button>
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">曲検索</h1>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 lg:hidden"
              title={themeTitle}
              aria-label={themeTitle}
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{themeLabel}</span>
            </button>
            <Link
              to="/"
              className="self-start px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              アルバム一覧へ
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="曲名（部分一致）"
            className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            検索
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setSubmittedTitle('');
              setCurrentPage(1);
              setItems([]);
              setLastPage(1);
              setError('');
              setHasSearched(false);
            }}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            クリア
          </button>
        </form>

        {!hasSearched && (
          <div className="mt-6 p-4 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            曲名を入力して「検索」を押すと結果が表示されます。
          </div>
        )}

        {loading && (
          <div className="mt-6 p-4 rounded bg-gray-100 dark:bg-gray-700">読み込み中...</div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {showResults && (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
                      曲名
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
                      アルバム
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-40">
                      形態
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-24">
                      曲順
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
                      クレジット
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((t) => {
                    const credits = groupCredits(t);
                    return (
                      <tr key={t.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">
                          {t.title}
                        </td>

                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                          {t.album?.id ? (
                            <Link
                              to={getAlbumRoutePath(t.album)}
                              className="text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                            >
                              {t.album.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>

                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                          {t.album?.edition ?? '-'}
                        </td>

                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                          {t.track_number ?? '-'}
                        </td>

                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
                          <div className="space-y-1">
                            {Object.keys(credits).length === 0 && (
                              <span className="text-gray-500 dark:text-gray-400">-</span>
                            )}
                            {Object.entries(credits).map(([role, list]) => (
                              <div key={role}>
                                <span className="font-semibold">{roleLabel(role)}:</span>{' '}
                                {list.map((a, idx) => (
                                  <span key={a.id}>
                                    <Link
                                      to={getArtistTracksRoutePath(a, role)}
                                      className="text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                                    >
                                      {a.name}
                                    </Link>
                                    {idx < list.length - 1 && (
                                      <span className="text-gray-500 dark:text-gray-400"> / </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {items.length === 0 && (
                    <tr>
                      <td
                        className="border border-gray-300 dark:border-gray-600 px-3 py-6 text-center text-gray-600 dark:text-gray-300"
                        colSpan={5}
                      >
                        該当する曲がありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {lastPage > 1 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  前へ
                </button>
                {renderPages()}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

