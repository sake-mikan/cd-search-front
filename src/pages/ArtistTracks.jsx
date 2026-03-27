import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { getArtistRouteId } from '../utils/artistPublicId';
import { formatDateDisplay } from '../utils/formatDateDisplay';
import {
  PageBackdrop,
  floatingThemeButtonClass,
  heroPanelClass,
  mobileThemeButtonClass,
  pageCardClass,
  pageShellClass,
  paginationActiveButtonClass,
  paginationButtonClass,
  primaryButtonClass,
  tableCardClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tableRowClass,
} from '../utils/uiTheme';

function formatAlbumTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();

  if (edition !== '' && edition !== '-') {
    return title !== '' ? `${title}【${edition}】` : `【${edition}】`;
  }

  return title;
}

function formatTrackDisc(track) {
  const trackNumber = Number.isFinite(Number(track?.track_number)) ? String(track.track_number) : '-';
  const discNumber = Number.isFinite(Number(track?.disk_number)) ? String(track.disk_number) : '-';
  return `${trackNumber} / ${discNumber}`;
}
export default function ArtistTracks({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get('role') || '';

  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState([]);
  const [lastPage, setLastPage] = useState(1);

  const currentPage = useMemo(() => {
    const raw = Number.parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);

  const apiUrl = useMemo(() => {
    const qs = new URLSearchParams();
    if (role) qs.set('role', role);
    qs.set('page', String(currentPage));
    qs.set('per_page', '20');
    return buildApiUrl(`/artists/${id}/tracks?${qs.toString()}`);
  }, [currentPage, id, role]);

  const canonicalArtistId = useMemo(() => getArtistRouteId(data?.artist, id), [data?.artist, id]);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      setData(payload);

      const tracks = payload?.tracks;
      setItems(tracks?.data ?? []);
      setLastPage(tracks?.last_page ?? 1);
    } catch (e) {
      console.error(e);
      setError('関連楽曲一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  useEffect(() => {
    if (!data?.artist) return;
    if (String(id ?? '').trim() === '') return;
    if (String(id) !== String(data.artist.id ?? '')) return;
    if (String(canonicalArtistId) === '' || String(id) === String(canonicalArtistId)) return;
    const qs = new URLSearchParams();
    if (role) qs.set('role', role);
    if (currentPage > 1) qs.set('page', String(currentPage));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    navigate(`/artists/${canonicalArtistId}/tracks${suffix}`, { replace: true });
  }, [canonicalArtistId, currentPage, data?.artist, id, navigate, role]);

  const tracks = items;
  const artistName = data?.artist?.name ?? `Artist ID: ${id}`;
  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

  const setPage = (page) => {
    const nextPage = Math.max(1, page);
    const next = new URLSearchParams(searchParams);
    if (role) next.set('role', role);
    if (nextPage === 1) {
      next.delete('page');
    } else {
      next.set('page', String(nextPage));
    }
    setSearchParams(next);
  };

  const renderPages = () => {
    const pages = [];
    const addPage = (page) => {
      pages.push(
        <button
          key={page}
          type="button"
          onClick={() => setPage(page)}
          disabled={page === currentPage}
          className={page === currentPage ? paginationActiveButtonClass : paginationButtonClass}
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

  const roleLabel = (value) => {
    if (value === 'vocal') return '歌唱';
    if (value === 'lyricist') return '作詞';
    if (value === 'composer') return '作曲';
    if (value === 'arranger') return '編曲';
    return '';
  };

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

      <div className="mx-auto mb-3 flex max-w-6xl items-center justify-between gap-2 lg:justify-start">
        <button type="button" onClick={() => navigate(-1)} className={primaryButtonClass}>
          戻る
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className={`${mobileThemeButtonClass} lg:hidden`}
          title={themeTitle}
          aria-label={themeTitle}
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span>{themeLabel}</span>
        </button>
      </div>

      <div className={`${pageCardClass} max-w-6xl`}>
        <div className={heroPanelClass}>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">{artistName} の関連楽曲</h1>
              {role && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  絞り込み: {roleLabel(role)} ({role})
                </p>
              )}
            </div>
          </div>
        </div>

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

        {!loading && !error && (
          <>
            <div className={tableCardClass}>
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeadRowClass}>
                      <th className={tableHeadCellClass}>曲名</th>
                      <th className={tableHeadCellClass}>アルバム</th>
                      <th className={`${tableHeadCellClass} w-32`}>Tr / Disc</th>
                      <th className={`${tableHeadCellClass} w-40`}>規格品番</th>
                      <th className={`${tableHeadCellClass} w-40`}>発売日</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tracks.map((track) => (
                      <tr key={track.id} className={tableRowClass}>
                        <td className={`${tableCellClass} font-medium`}>{track.title}</td>

                        <td className={tableCellClass}>
                          {track.album?.id ? (
                            <Link
                              to={getAlbumRoutePath(track.album)}
                              className="text-blue-600 hover:underline underline-offset-4 dark:text-sky-400"
                            >
                              {formatAlbumTitle(track.album)}
                            </Link>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">-</span>
                          )}
                        </td>

                        <td className={tableCellClass}>{formatTrackDisc(track)}</td>
                        <td className={tableCellClass}>{track.album?.catalog_number ?? '-'}</td>
                        <td className={tableCellClass}>{formatDateDisplay(track.album?.release_date) || '-'}</td>
                      </tr>
                    ))}

                    {tracks.length === 0 && (
                      <tr>
                        <td className={`${tableCellClass} py-6 text-center text-slate-600 dark:text-slate-300`} colSpan={5}>
                          データがありません
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
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`${paginationButtonClass} disabled:opacity-50`}
                >
                  {'前へ'}
                </button>
                {renderPages()}
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === lastPage}
                  className={`${paginationButtonClass} disabled:opacity-50`}
                >
                  {'次へ'}
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
