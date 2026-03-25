import { buildApiUrl } from '../api/baseUrl';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Music4, Sun } from 'lucide-react';
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
      setError('楽曲検索の取得に失敗しました。API が起動しているか確認してください。');
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
              ? 'rounded-full bg-sky-600 px-3 py-1 text-white'
              : 'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
          }
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#f8fafc_45%,_#eef2ff_100%)] px-3 pb-6 pt-4 text-gray-900 dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#111827_45%,_#020617_100%)] dark:text-gray-100 sm:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <button
        type="button"
        onClick={onToggleTheme}
        className="absolute right-3 top-4 z-10 hidden items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 lg:inline-flex sm:right-6 sm:top-6"
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
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                <Music4 className="h-3.5 w-3.5" />
                TRACK SEARCH
              </p>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">楽曲名検索</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  楽曲名を入力して、収録アルバムやクレジットを横断検索できます。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
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
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
              >
                CD検索へ
              </Link>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="楽曲名を入力"
              className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800/90"
            />
            <button
              type="submit"
              className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
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
              className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            >
              クリア
            </button>
          </form>
        </div>

        {!hasSearched && (
          <div className="rounded-[24px] border border-slate-200/70 bg-white/80 px-4 py-5 text-sm text-slate-600 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-300 sm:px-5">
            楽曲名を入力して「検索」を押すと結果が表示されます。
          </div>
        )}

        {loading && (
          <div className="rounded-[24px] border border-slate-200/70 bg-white/80 px-4 py-5 text-sm text-slate-600 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-300 sm:px-5">
            読み込み中...
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 sm:px-5">
            {error}
          </div>
        )}

        {showResults && (
          <>
            <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700/80">
                      <th className="border-b border-r border-slate-200 px-3 py-2 text-left font-semibold last:border-r-0 dark:border-slate-600">
                        楽曲名
                      </th>
                      <th className="border-b border-r border-slate-200 px-3 py-2 text-left font-semibold last:border-r-0 dark:border-slate-600">
                        アルバム
                      </th>
                      <th className="border-b border-r border-slate-200 px-3 py-2 text-left font-semibold w-40 last:border-r-0 dark:border-slate-600">
                        形態
                      </th>
                      <th className="border-b border-r border-slate-200 px-3 py-2 text-left font-semibold w-24 last:border-r-0 dark:border-slate-600">
                        Tr
                      </th>
                      <th className="border-b border-r border-slate-200 px-3 py-2 text-left font-semibold last:border-r-0 dark:border-slate-600">
                        クレジット
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((t) => {
                      const credits = groupCredits(t);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                          <td className="border-b border-r border-slate-200 px-3 py-2 font-medium last:border-r-0 dark:border-slate-600">
                            {t.title}
                          </td>

                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">
                            {t.album?.id ? (
                              <Link
                                to={getAlbumRoutePath(t.album)}
                                className="text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                              >
                                {t.album.title}
                              </Link>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">-</span>
                            )}
                          </td>

                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">
                            {t.album?.edition ?? '-'}
                          </td>

                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">
                            {t.track_number ?? '-'}
                          </td>

                          <td className="border-b border-r border-slate-200 px-3 py-2 text-sm last:border-r-0 dark:border-slate-600">
                            <div className="space-y-1">
                              {Object.keys(credits).length === 0 && (
                                <span className="text-slate-400 dark:text-slate-500">-</span>
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
                                        <span className="text-slate-400 dark:text-slate-500"> / </span>
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
                          className="border-b border-r border-slate-200 px-3 py-6 text-center text-slate-600 last:border-r-0 dark:border-slate-600 dark:text-slate-300"
                          colSpan={5}
                        >
                          該当する楽曲がありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {lastPage > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  前へ
                </button>
                {renderPages()}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                  className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
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
