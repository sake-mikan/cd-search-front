import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ListMusic } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';
import InfoCard from '../components/InfoCard';
import PageHeaderCard from '../components/PageHeaderCard';
import ResponsiveResultList from '../components/ResponsiveResultList';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { getArtistRouteId } from '../utils/artistPublicId';
import { formatDateDisplay } from '../utils/formatDateDisplay';
import { PageBackdrop, pageCardClass, pageShellClass, secondaryButtonClass } from '../utils/uiTheme';

function formatAlbumTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  return edition && edition !== '-' ? `${title} [${edition}]` : title;
}

function formatTrackDisc(track) {
  const trackNumber = Number.isFinite(Number(track?.track_number)) ? String(track.track_number) : '-';
  const discNumber = Number.isFinite(Number(track?.disk_number)) ? String(track.disk_number) : '-';
  return `${trackNumber} / ${discNumber}`;
}

function roleLabel(role) {
  if (role === 'vocal') return '歌唱';
  if (role === 'lyricist') return '作詞';
  if (role === 'composer') return '作曲';
  if (role === 'arranger') return '編曲';
  return '';
}

const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

export default function ArtistTracks({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get('role') || '';
  const currentPage = useMemo(() => {
    const raw = Number.parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);
  const sort = useMemo(() => String(searchParams.get('sort') ?? 'release_date'), [searchParams]);
  const order = useMemo(() => String(searchParams.get('order') ?? 'desc'), [searchParams]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const apiUrl = useMemo(() => {
    const query = new URLSearchParams();
    if (role) query.set('role', role);
    query.set('page', String(currentPage));
    query.set('per_page', '20');
    query.set('sort', sort);
    query.set('order', order);
    return buildApiUrl(`/artists/${id}/tracks?${query.toString()}`);
  }, [currentPage, id, order, role, sort]);

  const canonicalArtistId = useMemo(() => getArtistRouteId(data?.artist, id), [data?.artist, id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        setData(payload);
        setItems(payload?.tracks?.data ?? []);
        setLastPage(payload?.tracks?.last_page ?? 1);
        setTotalCount(Number(payload?.tracks?.total ?? payload?.tracks?.data?.length ?? 0));
      } catch {
        setError('関連楽曲一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiUrl]);

  useEffect(() => {
    if (!data?.artist) return;
    if (String(id ?? '').trim() === '') return;
    if (String(id) !== String(data.artist.id ?? '')) return;
    if (String(canonicalArtistId) === '' || String(id) === String(canonicalArtistId)) return;
    const query = new URLSearchParams();
    if (role) query.set('role', role);
    if (sort) query.set('sort', sort);
    if (order) query.set('order', order);
    if (currentPage > 1) query.set('page', String(currentPage));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    navigate(`/artists/${canonicalArtistId}/tracks${suffix}`, { replace: true });
  }, [canonicalArtistId, currentPage, data?.artist, id, navigate, order, role, sort]);

  const artistName = data?.artist?.name ?? `Artist ID: ${id}`;

  const setPage = (page) => {
    const nextPage = Math.max(1, page);
    const next = new URLSearchParams(searchParams);
    if (role) next.set('role', role);
    next.set('sort', sort);
    next.set('order', order);
    if (nextPage === 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const handleSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    const next = new URLSearchParams(searchParams);
    if (role) next.set('role', role);
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
      key: 'title',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('title')} aria-label="曲名でソート">
          曲名
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'album',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('album')} aria-label="アルバムでソート">
          アルバム
          {sortIcon('album')}
        </button>
      ),
    },
    { key: 'trackDisc', header: 'Tr / Disc', className: 'w-28 whitespace-nowrap' },
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
  ];

  const pageButtons = Array.from({ length: lastPage }, (_, index) => index + 1).filter(
    (page) => Math.abs(page - currentPage) <= 2 || page === 1 || page === lastPage
  );

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <div className={`${pageCardClass} max-w-6xl space-y-6`}>
        <PageHeaderCard
          maxWidthClass="max-w-6xl"
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          backLabel="戻る"
          onBack={() => navigate(-1)}
          badge="TRACK RELATION"
          badgeIcon={ListMusic}
          title={`${artistName} の関連曲`}
          subtitle={role ? `絞り込み: ${roleLabel(role)} (${role})` : 'このアーティストに紐づく楽曲一覧です。'}
        />

        <InfoCard title="関連曲一覧" description={`検索結果 ${totalCount}件`}>
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-300">関連曲を読み込み中です。</p> : null}
          {!loading && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
          {!loading && !error ? (
            <>
              <ResponsiveResultList
                items={items}
                columns={columns}
                emptyText="関連曲は見つかりませんでした。"
                renderDesktopRow={(track, index, rowClass) => (
                  <tr key={track.id ?? index} className={rowClass}>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-medium dark:border-slate-600">{track.title}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 dark:border-slate-600">
                      {track.album?.id ? <Link to={getAlbumRoutePath(track.album)} className="text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300">{formatAlbumTitle(track.album)}</Link> : '-'}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 whitespace-nowrap dark:border-slate-600">{formatTrackDisc(track)}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600">{track.album?.catalog_number_display || track.album?.catalog_number || '-'}</td>
                    <td className="border-b px-4 py-3 whitespace-nowrap text-slate-600 dark:border-slate-600 dark:text-slate-300">{formatDateDisplay(track.album?.release_date) || '-'}</td>
                  </tr>
                )}
                renderMobileCard={(track) => (
                  <Link key={track.id} to={track.album?.id ? getAlbumRoutePath(track.album) : '#'} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40">
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{track.title}</h3>
                      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{track.album?.id ? formatAlbumTitle(track.album) : '-'}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-700">{formatTrackDisc(track)}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono dark:bg-slate-700">{track.album?.catalog_number_display || track.album?.catalog_number || '-'}</span>
                        <span>{formatDateDisplay(track.album?.release_date) || '-'}</span>
                      </div>
                    </div>
                  </Link>
                )}
              />
              {lastPage > 1 ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={`${secondaryButtonClass} disabled:opacity-50`}>前へ</button>
                  {pageButtons.map((page, index) => (
                    <span key={page}>
                      {index > 0 && pageButtons[index - 1] !== page - 1 ? <span className="px-2 py-1 text-slate-500 dark:text-slate-400">...</span> : null}
                      <button type="button" onClick={() => setPage(page)} disabled={page === currentPage} className={page === currentPage ? 'rounded-full bg-sky-600 px-3 py-1 text-white' : 'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'}>{page}</button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === lastPage} className={`${secondaryButtonClass} disabled:opacity-50`}>次へ</button>
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
