import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Layers3, Moon, Sun } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';
import InfoCard from '../components/InfoCard';
import PageHeaderCard from '../components/PageHeaderCard';
import ResponsiveResultList from '../components/ResponsiveResultList';
import SiteBrandHeader from '../components/SiteBrandHeader';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { formatDateDisplay } from '../utils/formatDateDisplay';
import { PageBackdrop, pageCardClass, pageShellClass, secondaryButtonClass, floatingThemeButtonClass, mobileThemeButtonClass, primaryButtonClass } from '../utils/uiTheme';

function formatAlbumTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  return edition && edition !== '-' ? `${title} [${edition}]` : title;
}

const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

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

  const sort = useMemo(() => String(searchParams.get('sort') ?? 'release_date'), [searchParams]);
  const order = useMemo(() => String(searchParams.get('order') ?? 'desc'), [searchParams]);

  const apiUrl = useMemo(() => {
    const query = new URLSearchParams();
    query.set('page', String(currentPage));
    query.set('per_page', '20');
    query.set('sort', sort);
    query.set('order', order);
    return buildApiUrl(`/series/${id}/albums?${query.toString()}`);
  }, [currentPage, id, order, sort]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setData(await response.json());
      } catch {
        setError('\u30b7\u30ea\u30fc\u30ba\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiUrl]);

  const albums = Array.isArray(data?.albums?.data) ? data.albums.data : [];
  const totalCount = Number(data?.albums?.total ?? albums.length) || 0;
  const currentPageFromData = Number(data?.albums?.current_page ?? currentPage) || 1;
  const lastPage = Number(data?.albums?.last_page ?? 1) || 1;
  const canonicalSeriesId = String(data?.series?.public_id ?? data?.series?.id ?? '').trim();
  const seriesName = data?.series?.name ?? `Series ID: ${id}`;

  useEffect(() => {
    if (!canonicalSeriesId) return;
    if (String(id ?? '').trim() === '') return;
    if (String(id) !== String(data?.series?.id ?? '')) return;
    if (String(id) === canonicalSeriesId) return;
    const next = new URLSearchParams();
    next.set('sort', sort);
    next.set('order', order);
    if (currentPage > 1) next.set('page', String(currentPage));
    const suffix = next.toString() ? `?${next.toString()}` : '';
    navigate(`/series/${canonicalSeriesId}/albums${suffix}`, { replace: true });
  }, [canonicalSeriesId, currentPage, data?.series?.id, id, navigate, order, sort]);

  const setPage = (page) => {
    const nextPage = Math.max(1, page);
    const next = new URLSearchParams(searchParams);
    next.set('sort', sort);
    next.set('order', order);
    if (nextPage === 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const handleSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    const next = new URLSearchParams(searchParams);
    next.set('sort', nextSort);
    next.set('order', nextOrder);
    next.delete('page');
    setSearchParams(next);
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const columns = [
    {
      key: 'cover',
      header: '\u30b8\u30e3\u30b1\u30c3\u30c8',
      className: 'w-24',
    },
    {
      key: 'title',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('title')} aria-label="\u30a2\u30eb\u30d0\u30e0\u3067\u30bd\u30fc\u30c8">
          {'\u30a2\u30eb\u30d0\u30e0'}
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'artist',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('artist')} aria-label="\u30a2\u30eb\u30d0\u30e0\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8\u3067\u30bd\u30fc\u30c8">
          {'\u30a2\u30eb\u30d0\u30e0\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8'}
          {sortIcon('artist')}
        </button>
      ),
    },
    {
      key: 'catalog',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('catalog_number')} aria-label="\u898f\u683c\u54c1\u756a\u3067\u30bd\u30fc\u30c8">
          {'\u898f\u683c\u54c1\u756a'}
          {sortIcon('catalog_number')}
        </button>
      ),
      className: 'w-40 whitespace-nowrap tabular-nums',
    },
    {
      key: 'releaseDate',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('release_date')} aria-label="\u767a\u58f2\u65e5\u3067\u30bd\u30fc\u30c8">
          {'\u767a\u58f2\u65e5'}
          {sortIcon('release_date')}
        </button>
      ),
      className: 'w-32 whitespace-nowrap',
    },
  ];

  const pageButtons = Array.from({ length: lastPage }, (_, index) => index + 1).filter(
    (page) => Math.abs(page - currentPageFromData) <= 2 || page === 1 || page === lastPage
  );

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
      <div className={`${pageCardClass} max-w-6xl space-y-6`}>
        <SiteBrandHeader
          actions={<>
            <button type="button" onClick={() => navigate(-1)} className={primaryButtonClass}>
              {'戻る'}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`${mobileThemeButtonClass} !hidden`}
              title={themeTitle}
              aria-label={themeTitle}
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{themeLabel}</span>
            </button>
          </>}
        />
        <PageHeaderCard
          maxWidthClass="max-w-6xl"
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          showFloatingThemeButton={false}
          showMobileThemeButton={false}
          badge="SERIES ALBUMS"
          badgeIcon={Layers3}
          title={`${seriesName} \u306e\u30a2\u30eb\u30d0\u30e0\u4e00\u89a7`}
          subtitle={'\u30b7\u30ea\u30fc\u30ba\u306b\u7d10\u3065\u304f\u30a2\u30eb\u30d0\u30e0\u3092\u307e\u3068\u3081\u3066\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002'}
        />

        <InfoCard title={'\u30b7\u30ea\u30fc\u30ba\u914d\u4e0b\u30a2\u30eb\u30d0\u30e0\u4e00\u89a7'} description={`\u691c\u7d22\u7d50\u679c ${totalCount}\u4ef6`}>
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-300">{'\u30a2\u30eb\u30d0\u30e0\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u3067\u3059\u3002'}</p> : null}
          {!loading && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
          {!loading && !error ? (
            <>
              <ResponsiveResultList
                items={albums}
                columns={columns}
                emptyText={'\u30b7\u30ea\u30fc\u30ba\u306b\u7d10\u3065\u304f\u30a2\u30eb\u30d0\u30e0\u306f\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002'}
                renderDesktopRow={(album, index, rowClass) => (
                  <tr key={album.id ?? index} className={rowClass}>
                    <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-600">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                        {album.cover_image_url ? <img src={album.cover_image_url} alt={formatAlbumTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                      </div>
                    </td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-medium dark:border-slate-600"><Link to={getAlbumRoutePath(album)} className="text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300">{formatAlbumTitle(album)}</Link></td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 dark:border-slate-600">{album.album_artist?.name ?? '-'}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 tabular-nums text-sm dark:border-slate-600">{album.catalog_number_display || album.catalog_number || '-'}</td>
                    <td className="border-b px-4 py-3 whitespace-nowrap text-slate-600 dark:border-slate-600 dark:text-slate-300">{formatDateDisplay(album.release_date) || '-'}</td>
                  </tr>
                )}
                renderMobileCard={(album) => (
                  <Link key={album.id} to={getAlbumRoutePath(album)} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40">
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                      <div className="flex aspect-square w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-700">
                        {album.cover_image_url ? <img src={album.cover_image_url} alt={formatAlbumTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{formatAlbumTitle(album)}</h3>
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
              {lastPage > 1 ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={() => setPage(currentPageFromData - 1)} disabled={currentPageFromData === 1} className={`${secondaryButtonClass} disabled:opacity-50`}>{'\u524d\u3078'}</button>
                  {pageButtons.map((page, index) => (
                    <span key={page}>
                      {index > 0 && pageButtons[index - 1] !== page - 1 ? <span className="px-2 py-1 text-slate-500 dark:text-slate-400">...</span> : null}
                      <button type="button" onClick={() => setPage(page)} disabled={page === currentPageFromData} className={page === currentPageFromData ? 'rounded-full bg-sky-600 px-3 py-1 text-white' : 'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'}>{page}</button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setPage(currentPageFromData + 1)} disabled={currentPageFromData === lastPage} className={`${secondaryButtonClass} disabled:opacity-50`}>{'\u6b21\u3078'}</button>
                </div>
              ) : null}
            </>
          ) : null}
        </InfoCard>
      </div>
      <SiteFooter />
    </div>
  );
}
