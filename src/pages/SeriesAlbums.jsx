import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';
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

export default function SeriesAlbums({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPage = useMemo(() => {
    const raw = Number.parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);

  const apiUrl = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('page', String(currentPage));
    qs.set('per_page', '20');
    return buildApiUrl(`/series/${id}/albums?${qs.toString()}`);
  }, [currentPage, id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (e) {
        console.error(e);
        setError('シリーズ一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiUrl]);

  const albums = Array.isArray(data?.albums?.data) ? data.albums.data : [];
  const currentPageFromData = Number(data?.albums?.current_page ?? currentPage) || 1;
  const lastPage = Number(data?.albums?.last_page ?? 1) || 1;
  const canonicalSeriesId = String(data?.series?.public_id ?? data?.series?.id ?? '').trim();
  const seriesName = data?.series?.name ?? `Series ID: ${id}`;

  const setPage = (page) => {
    const nextPage = Math.max(1, page);
    const next = new URLSearchParams(searchParams);
    if (nextPage === 1) {
      next.delete('page');
    } else {
      next.set('page', String(nextPage));
    }
    setSearchParams(next);
  };

  useEffect(() => {
    if (!canonicalSeriesId) return;
    if (String(id ?? '').trim() === '') return;
    if (String(id) !== String(data?.series?.id ?? '')) return;
    if (String(id) === canonicalSeriesId) return;
    const qs = currentPage > 1 ? `?page=${encodeURIComponent(String(currentPage))}` : '';
    navigate('/series/' + canonicalSeriesId + '/albums' + qs, { replace: true });
  }, [canonicalSeriesId, currentPage, data?.series?.id, id, navigate]);

  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

  const renderPages = () => {
    const pages = [];
    const addPage = (page) => {
      pages.push(
        <button
          key={page}
          type="button"
          onClick={() => setPage(page)}
          disabled={page === currentPageFromData}
          className={page === currentPageFromData ? paginationActiveButtonClass : paginationButtonClass}
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
    const start = Math.max(1, currentPageFromData - windowSize);
    const end = Math.min(lastPage, currentPageFromData + windowSize);

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
              <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">{seriesName} のアルバム一覧</h1>
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
          <div className={tableCardClass}>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeadCellClass}>アルバム</th>
                    <th className={`${tableHeadCellClass} w-44`}>アルバムアーティスト</th>
                    <th className={`${tableHeadCellClass} w-36`}>規格品番</th>
                    <th className={`${tableHeadCellClass} w-32`}>発売日</th>
                    <th className={`${tableHeadCellClass} w-40`}>JAN</th>
                  </tr>
                </thead>

                <tbody>
                  {albums.map((album) => (
                    <tr key={album.id} className={tableRowClass}>
                      <td className={tableCellClass}>
                        <Link
                          to={getAlbumRoutePath(album)}
                          className="text-blue-600 hover:underline underline-offset-4 dark:text-sky-400"
                        >
                          {formatAlbumTitle(album)}
                        </Link>
                      </td>
                      <td className={tableCellClass}>{album.album_artist?.name ?? '-'}</td>
                      <td className={tableCellClass}>{album.catalog_number ?? '-'}</td>
                      <td className={tableCellClass}>{formatDateDisplay(album.release_date) || '-'}</td>
                      <td className={tableCellClass}>{album.jan ?? '-'}</td>
                    </tr>
                  ))}

                  {albums.length === 0 && (
                    <tr>
                      <td className={`${tableCellClass} py-6 text-center text-slate-600 dark:text-slate-300`} colSpan={5}>
                        データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {lastPage > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/70 px-4 py-4 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => setPage(currentPageFromData - 1)}
                  disabled={currentPageFromData === 1}
                  className={`${paginationButtonClass} disabled:opacity-50`}
                >
                  {'前へ'}
                </button>
                {renderPages()}
                <button
                  type="button"
                  onClick={() => setPage(currentPageFromData + 1)}
                  disabled={currentPageFromData === lastPage}
                  className={`${paginationButtonClass} disabled:opacity-50`}
                >
                  {'次へ'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
