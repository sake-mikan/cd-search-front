import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Disc3, Moon, Sun } from 'lucide-react';
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

function membersText(value) {
  if (!Array.isArray(value)) return '';
  return value.map((row) => String(row?.name ?? '').trim()).filter(Boolean).join(', ');
}

const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

export default function ArtistAlbums({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = useMemo(() => {
    const raw = Number.parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);
  const sort = useMemo(() => String(searchParams.get('sort') ?? 'release_date'), [searchParams]);
  const order = useMemo(() => String(searchParams.get('order') ?? 'desc'), [searchParams]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('page', String(currentPage));
    qs.set('per_page', '20');
    qs.set('sort', sort);
    qs.set('order', order);
    return buildApiUrl(`/artists/${id}/albums?${qs.toString()}`);
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
        setError('アルバム一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiUrl]);

  const albums = Array.isArray(data?.albums?.data) ? data.albums.data : [];
  const currentPageFromData = Number(data?.albums?.current_page ?? currentPage) || 1;
  const lastPage = Number(data?.albums?.last_page ?? 1) || 1;
  const canonicalArtistId = String(data?.artist?.public_id ?? data?.artist?.id ?? '').trim();
  const artistName = data?.artist?.name ?? `Artist ID: ${id}`;
  const isUnit = String(data?.artist?.type ?? '') === 'unit';

  useEffect(() => {
    if (!canonicalArtistId) return;
    if (String(id ?? '').trim() === '') return;
    if (String(id) !== String(data?.artist?.id ?? '')) return;
    if (String(id) === canonicalArtistId) return;
    const next = new URLSearchParams();
    next.set('sort', sort);
    next.set('order', order);
    if (currentPage > 1) next.set('page', String(currentPage));
    const suffix = next.toString() ? `?${next.toString()}` : '';
    navigate(`/artists/${canonicalArtistId}/albums${suffix}`, { replace: true });
  }, [canonicalArtistId, currentPage, data?.artist?.id, id, navigate, order, sort]);

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
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('title')} aria-label="アルバムでソート">
          アルバム
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'artist',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('artist')} aria-label="アルバムアーティストでソート">
          アルバムアーティスト
          {sortIcon('artist')}
        </button>
      ),
    },
    {
      key: 'catalog',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('catalog_number')} aria-label="規格品番でソート">
          規格品番
          {sortIcon('catalog_number')}
        </button>
      ),
      className: 'w-40 whitespace-nowrap font-mono',
    },
    {
      key: 'releaseDate',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('release_date')} aria-label="発売日でソート">
          発売日
          {sortIcon('release_date')}
        </button>
      ),
      className: 'w-32 whitespace-nowrap',
    },
    {
      key: 'jan',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('jan')} aria-label="JANでソート">
          JAN
          {sortIcon('jan')}
        </button>
      ),
      className: 'w-40 whitespace-nowrap font-mono',
    },
  ];

  if (isUnit) {
    columns.push({ key: 'members', header: 'ユニットメンバー' });
  }

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
          badge="ARTIST ALBUMS"
          badgeIcon={Disc3}
          title={`${artistName} のアルバム一覧`}
          subtitle={isUnit ? 'ユニットで関連付けられているアルバムと、参加メンバーを確認できます。' : 'このアーティストに紐づくアルバム一覧です。'}
        />

        <InfoCard title="アルバム一覧" description={`検索結果 ${albums.length}件`}>
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-300">アルバムを読み込み中です。</p> : null}
          {!loading && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
          {!loading && !error ? (
            <>
              <ResponsiveResultList
                items={albums}
                columns={columns}
                emptyText="該当するアルバムは見つかりませんでした。"
                desktopMinWidthClass={isUnit ? 'min-w-[1080px]' : 'min-w-[920px]'}
                renderDesktopRow={(album, index, rowClass) => (
                  <tr key={album.id ?? index} className={rowClass}>
                    <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-600">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                        {album.cover_image_url ? <img src={album.cover_image_url} alt={formatAlbumTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                      </div>
                    </td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-medium dark:border-slate-600"><Link to={getAlbumRoutePath(album)} className="text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300">{formatAlbumTitle(album)}</Link></td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 dark:border-slate-600">{album.album_artist?.name ?? '-'}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600">{album.catalog_number_display || album.catalog_number || '-'}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 whitespace-nowrap text-slate-600 dark:border-slate-600 dark:text-slate-300">{formatDateDisplay(album.release_date) || '-'}</td>
                    <td className={`border-b ${isUnit ? 'border-r ' : ''}border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600`}>{album.jan ?? '-'}</td>
                    {isUnit ? <td className="border-b px-4 py-3 dark:border-slate-600">{membersText(album.unit_members) || '-'}</td> : null}
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
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono dark:bg-slate-700">{album.catalog_number_display || album.catalog_number || '-'}</span>
                          <span>{formatDateDisplay(album.release_date) || '-'}</span>
                          <span>{album.jan ?? '-'}</span>
                        </div>
                        {isUnit && membersText(album.unit_members) ? <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{membersText(album.unit_members)}</p> : null}
                      </div>
                    </div>
                  </Link>
                )}
              />
              {lastPage > 1 ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={() => setPage(currentPageFromData - 1)} disabled={currentPageFromData === 1} className={`${secondaryButtonClass} disabled:opacity-50`}>前へ</button>
                  {pageButtons.map((page, index) => (
                    <span key={page}>
                      {index > 0 && pageButtons[index - 1] !== page - 1 ? <span className="px-2 py-1 text-slate-500 dark:text-slate-400">...</span> : null}
                      <button type="button" onClick={() => setPage(page)} disabled={page === currentPageFromData} className={page === currentPageFromData ? 'rounded-full bg-sky-600 px-3 py-1 text-white' : 'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'}>{page}</button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setPage(currentPageFromData + 1)} disabled={currentPageFromData === lastPage} className={`${secondaryButtonClass} disabled:opacity-50`}>次へ</button>
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
