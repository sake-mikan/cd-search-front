'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import InfoCard from './InfoCard';
import PageHeaderCard from './PageHeaderCard';
import ResponsiveResultList from './ResponsiveResultList';
import SiteBrandHeader from './SiteBrandHeader';
import SiteFooter from './SiteFooter';
import { getAlbumRoutePath } from '@/utils/albumPublicId';
import { formatDateDisplay } from '@/utils/formatDateDisplay';
import { PageBackdrop, pageCardClass, pageShellClass, ThemeToggle, tableCellClass } from '@/utils/uiTheme';
import { useTheme } from './ThemeProvider';
import { buildApiUrl } from '@/utils/baseUrl';

function formatAlbumTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  return edition && edition !== '-' ? `${title} [${edition}]` : title;
}

const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

export default function SeriesAlbumsClient() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode, toggleTheme } = useTheme();

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
    return buildApiUrl(`/series/${id}/albums?${qs.toString()}`);
  }, [currentPage, id, order, sort]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        setData(payload);
      } catch {
        setError('シリーズ情報の取得に失敗しました。');
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
    router.replace(`/series/${canonicalSeriesId}/albums${suffix}`);
  }, [canonicalSeriesId, currentPage, data?.series?.id, id, router, order, sort]);

  const setPage = (page) => {
    const nextPage = Math.max(1, page);
    const next = new URLSearchParams(searchParams);
    next.set('sort', sort);
    next.set('order', order);
    if (nextPage === 1) next.delete('page');
    else next.set('page', String(nextPage));
    router.push(`/series/${id}/albums?${next.toString()}`);
  };

  const handleSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    const next = new URLSearchParams(searchParams);
    next.set('sort', nextSort);
    next.set('order', nextOrder);
    next.delete('page');
    router.push(`/series/${id}/albums?${next.toString()}`);
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const columns = [
    { key: 'cover', header: 'ジャケット', className: 'w-24' },
    {
      key: 'title',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('title')}>
          アルバム
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'artist',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('artist')}>
          アルバムアーティスト
          {sortIcon('artist')}
        </button>
      ),
    },
    {
      key: 'catalog',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('catalog_number')}>
          規格品番
          {sortIcon('catalog_number')}
        </button>
      ),
      className: 'w-40 whitespace-nowrap tabular-nums',
    },
    {
      key: 'releaseDate',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('release_date')}>
          発売日
          {sortIcon('release_date')}
        </button>
      ),
      className: 'w-32 whitespace-nowrap',
    },
  ];

  const pageButtons = Array.from({ length: lastPage }, (_, index) => index + 1).filter(
    (page) => Math.abs(page - currentPageFromData) <= 2 || page === 1 || page === lastPage
  );

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <ThemeToggle />

      <div className={`${pageCardClass} max-w-6xl space-y-6`}>
        <SiteBrandHeader
          actions={<>
            <button type="button" onClick={() => router.back()} className="inline-flex h-12 items-center justify-center rounded-full bg-sky-500 px-8 text-sm font-black text-white shadow-[0_10px_20px_rgba(14,165,233,0.3)] transition-all hover:bg-sky-400 hover:shadow-[0_15px_30px_rgba(14,165,233,0.5)] active:scale-95">
              戻る
            </button>
          </>}
        />
        <PageHeaderCard
          maxWidthClass="max-w-6xl"
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          showFloatingThemeButton={false}
          showMobileThemeButton={false}
          badge="SERIES COLLECTIONS"
          title={`${seriesName} のアルバム一覧`}
          subtitle={'シリーズに紐づくアルバムをまとめて確認できます。'}
        />

        <InfoCard title="シリーズ配下アルバム一覧" description={`検索結果 ${totalCount}件`}>
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-300">アルバムを読み込み中です。</p> : null}
          {!loading && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
          {!loading && !error ? (
            <>
              <ResponsiveResultList
                items={albums}
                columns={columns}
                emptyText="このシリーズに紐づくアルバムは見つかりませんでした。"
                desktopMinWidthClass="min-w-[1000px]"
                renderDesktopRow={(album, index, rowClass) => (
                  <tr key={album.id ?? index} className={rowClass}>
                    <td className={tableCellClass}>
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                        {album.cover_image_url ? <img src={album.cover_image_url} alt={formatAlbumTitle(album)} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <Link href={getAlbumRoutePath(album)} className="text-blue-600 font-medium underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300">{formatAlbumTitle(album)}</Link>
                    </td>
                    <td className={tableCellClass}>{album.album_artist?.name ?? '-'}</td>
                    <td className={tableCellClass}>{album.catalog_number_display || album.catalog_number || '-'}</td>
                    <td className={tableCellClass}>{formatDateDisplay(album.release_date) || '-'}</td>
                  </tr>
                )}
                renderMobileCard={(album) => (
                  <Link key={album.id} href={getAlbumRoutePath(album)} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40">
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
                <div className="mt-16 flex items-center justify-center gap-5">
                  <button type="button" onClick={() => setPage(currentPageFromData - 1)} disabled={currentPageFromData === 1} className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronLeft className="h-5 w-5" /></button>
                  <div className="flex items-center gap-4 px-10 py-3 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 font-black text-sm tracking-widest backdrop-blur-3xl shadow-sm">
                    {pageButtons.map((page, index) => (
                      <span key={page}>
                        {index > 0 && pageButtons[index - 1] !== page - 1 ? <span className="px-2 text-slate-400">...</span> : null}
                        <button
                          type="button"
                          onClick={() => setPage(page)}
                          disabled={page === currentPageFromData}
                          className={
                            page === currentPageFromData
                              ? 'rounded-full bg-sky-600 px-3 py-1 text-white shadow-lg shadow-sky-500/20 font-black'
                              : 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-all font-bold px-3 py-1'
                          }
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPage(currentPageFromData + 1)} disabled={currentPageFromData === lastPage} className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:bg-sky-500 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:pointer-events-none"><ChevronRight className="h-5 w-5" /></button>
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
