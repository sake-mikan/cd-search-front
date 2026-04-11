import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Grid2x2, Moon, Sun } from 'lucide-react';
import { fetchAllAlbums, fetchContents } from '../api/albums';
import PageHeaderCard from '../components/PageHeaderCard';
import ResponsiveResultList from '../components/ResponsiveResultList';
import SearchHeroCard from '../components/SearchHeroCard';
import SiteBrandHeader from '../components/SiteBrandHeader';
import SiteFooter from '../components/SiteFooter';
import SearchValueHighlights from '../components/SearchValueHighlights';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { formatDateDisplay } from '../utils/formatDateDisplay';
import { PageBackdrop, pageCardClass, pageShellClass, panelClass, secondaryButtonClass, floatingThemeButtonClass } from '../utils/uiTheme';

const SEARCH_PAGE_SIZE = 20;
const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

function normalizeCatalogNumber(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function compareCatalogNumbers(left, right) {
  const normalizedLeft = normalizeCatalogNumber(left);
  const normalizedRight = normalizeCatalogNumber(right);

  if (normalizedLeft === normalizedRight) {
    return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  if (!normalizedLeft) return 1;
  if (!normalizedRight) return -1;

  return normalizedLeft.localeCompare(normalizedRight, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function getSortableTimestamp(value) {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function compareVariantRepresentative(left, right) {
  const catalogComparison = compareCatalogNumbers(left?.catalog_number, right?.catalog_number);
  if (catalogComparison !== 0) return catalogComparison;

  const releaseDateComparison = getSortableTimestamp(left?.release_date) - getSortableTimestamp(right?.release_date);
  if (releaseDateComparison !== 0) return releaseDateComparison;

  return Number(left?.id ?? Number.MAX_SAFE_INTEGER) - Number(right?.id ?? Number.MAX_SAFE_INTEGER);
}

function getVariantKey(album) {
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();
  if (variantGroupKey !== '') {
    return `variant:${variantGroupKey}`;
  }
  return `album:${album?.id ?? ''}`;
}

function collapseEditionVariants(albums) {
  const representativeByGroup = new Map();

  for (const album of albums) {
    const key = getVariantKey(album);
    const current = representativeByGroup.get(key);
    if (!current || compareVariantRepresentative(album, current) < 0) {
      representativeByGroup.set(key, album);
    }
  }

  const representativeIds = new Set(
    [...representativeByGroup.values()].map((album) => album?.id).filter((id) => id != null)
  );

  return albums.filter((album) => representativeIds.has(album?.id));
}

function formatAlbumTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();

  if (variantGroupKey !== '' && edition !== '' && edition !== '-') {
    return `${title} [${edition}]`;
  }

  return title;
}

export default function ContentSearch({ isDarkMode = false, onToggleTheme = () => {} }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [contentTree, setContentTree] = useState([]);
  const [loadingContents, setLoadingContents] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [selectedContentName, setSelectedContentName] = useState('');
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [sort, setSort] = useState('release_date');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    let active = true;

    const loadContents = async () => {
      setLoadingContents(true);
      setError('');
      try {
        const items = await fetchContents();
        if (active) {
          setContentTree(items);
        }
      } catch {
        if (active) {
          setContentTree([]);
          setError('作品一覧の取得に失敗しました。');
        }
      } finally {
        if (active) {
          setLoadingContents(false);
        }
      }
    };

    loadContents();
    return () => {
      active = false;
    };
  }, []);

  const contentNameMap = useMemo(() => {
    const map = new Map();
    contentTree.forEach((parent) => {
      map.set(String(parent.id), parent.name);
      (Array.isArray(parent.children) ? parent.children : []).forEach((child) => {
        map.set(String(child.id), child.name);
      });
    });
    return map;
  }, [contentTree]);

  const visibleContentTree = useMemo(() => {
    if (selectedContentId === '') return contentTree;
    return contentTree.filter((parent) =>
      String(parent.id) === selectedContentId ||
      (Array.isArray(parent.children) ? parent.children : []).some((child) => String(child.id) === selectedContentId)
    );
  }, [contentTree, selectedContentId]);

  useEffect(() => {
    const nextContentId = String(searchParams.get('content_id') ?? '').trim();
    setSelectedContentId(nextContentId);
    setSelectedContentName(nextContentId !== '' ? contentNameMap.get(nextContentId) ?? '' : '');

    if (nextContentId === '') {
      setAlbums([]);
      setCurrentPage(1);
      setLastPage(1);
      return;
    }

    let active = true;
    const loadAlbums = async () => {
      setLoadingAlbums(true);
      setError('');
      try {
        const response = await fetchAllAlbums({ content_id: nextContentId, sort, order });
        const items = Array.isArray(response.data) ? response.data : [];
        const collapsed = collapseEditionVariants(items);
        const nextLastPage = Math.max(1, Math.ceil(Math.max(collapsed.length, 1) / SEARCH_PAGE_SIZE));
        if (active) {
          setAlbums(collapsed);
          setCurrentPage(1);
          setLastPage(nextLastPage);
        }
      } catch {
        if (active) {
          setAlbums([]);
          setCurrentPage(1);
          setLastPage(1);
          setError('作品別アルバムの取得に失敗しました。');
        }
      } finally {
        if (active) {
          setLoadingAlbums(false);
        }
      }
    };

    loadAlbums();
    return () => {
      active = false;
    };
  }, [searchParams, contentNameMap, sort, order]);

  const visibleAlbums = useMemo(
    () => albums.slice((currentPage - 1) * SEARCH_PAGE_SIZE, currentPage * SEARCH_PAGE_SIZE),
    [albums, currentPage]
  );

  const setPage = (page) => {
    const nextPage = Math.max(1, page);
    setCurrentPage(nextPage);
  };

  const selectContent = (id) => setSearchParams({ content_id: String(id) });
  const clearSelection = () => setSearchParams({});

  const handleSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(nextSort);
    setOrder(nextOrder);
  };

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const columns = [
    { key: 'cover', header: 'ジャケット', className: 'w-24 whitespace-nowrap' },
    {
      key: 'title',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('title')} aria-label="タイトルでソート">
          タイトル
          {sortIcon('title')}
        </button>
      ),
    },
    {
      key: 'artist',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('artist')} aria-label="アーティストでソート">
          アーティスト
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
  ];

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
      <div className={`${pageCardClass} max-w-7xl space-y-1`}>
        <SiteBrandHeader />
        <SearchValueHighlights />
        <PageHeaderCard
          maxWidthClass="max-w-7xl"
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          showFloatingThemeButton={false}
          showMobileThemeButton={false}
          sectionClassName="mb-0 overflow-visible rounded-none border-0 bg-none bg-transparent px-0 py-0 shadow-none"
        >
          <SearchHeroCard
            current="content"
            badge="CONTENT NAVI"
            badgeIcon={Grid2x2}
            title={'\u4f5c\u54c1\u304b\u3089\u63a2\u3059'}
            subtitle={'作品名を選択すると関連アルバムが表示されます。'}
          >
            <div className="mb-4 space-y-1">
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">{'登録コンテンツ一覧'}</h2>
            </div>
            {loadingContents ? <p className="text-sm text-slate-500 dark:text-slate-300">{'\u4f5c\u54c1\u4e00\u89a7\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u3067\u3059\u3002'}</p> : null}
            {!loadingContents && contentTree.length === 0 ? <p className="text-sm text-red-600 dark:text-red-300">{error || '\u4f5c\u54c1\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002'}</p> : null}
            {!loadingContents && visibleContentTree.length > 0 ? (
              <div className="space-y-5">
                {visibleContentTree.map((parent) => (
                  <section
                    key={parent.id}
                    className="rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-slate-50/90 via-white to-white p-4 shadow-sm dark:border-slate-700/70 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-900"
                  >
                    <div className="mb-4 space-y-1">
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{parent.name}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                      {(Array.isArray(parent.children) ? parent.children : []).map((child) => {
                        const active = selectedContentId === String(child.id);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => selectContent(child.id)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                              active
                                ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400/70 dark:bg-sky-500/10 dark:text-sky-200'
                                : 'border-slate-200 bg-white/90 text-slate-700 hover:border-sky-300 hover:bg-sky-50/70 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-700/70'
                            }`}
                          >
                            {child.name}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => selectContent(parent.id)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          selectedContentId === String(parent.id)
                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400/70 dark:bg-sky-500/10 dark:text-sky-200'
                            : 'border-slate-200 bg-white/90 text-slate-700 hover:border-sky-300 hover:bg-sky-50/70 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-700/70'
                        }`}
                      >
                        {'\u5168\u3066'}
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </SearchHeroCard>
        </PageHeaderCard>

        {selectedContentId !== '' ? (
          <section className={panelClass}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {selectedContentName || '作品別アルバム一覧'}
                </h2>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{`検索結果 ${albums.length}件`}</p>
              </div>
              <button type="button" onClick={clearSelection} className={secondaryButtonClass}>
                選択をクリア
              </button>
            </div>

            {loadingAlbums ? <p className="text-sm text-slate-500 dark:text-slate-300">アルバムを読み込み中です。</p> : null}
            {!loadingAlbums && error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
            {!loadingAlbums && !error ? (
              <>
                <ResponsiveResultList
                  items={visibleAlbums}
                  columns={columns}
                  emptyText="この作品に紐づくアルバムは見つかりませんでした。"
                  renderDesktopRow={(album, index, rowClass) => (
                    <tr key={album.id ?? index} className={rowClass}>
                      <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-600">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                          {album.cover_image_url ? (
                            <img
                              src={album.cover_image_url}
                              alt={formatAlbumTitle(album)}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-500">No Image</span>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 font-medium dark:border-slate-600">
                        <Link
                          to={getAlbumRoutePath(album)}
                          state={{ title: album.title }}
                          className="text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
                        >
                          {formatAlbumTitle(album)}
                        </Link>
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                        {album.album_artist?.name ?? '-'}
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600">
                        {album.catalog_number_display || album.catalog_number || '-'}
                      </td>
                      <td className="border-b px-4 py-3 whitespace-nowrap text-slate-600 dark:border-slate-600 dark:text-slate-300">
                        {formatDateDisplay(album.release_date) || '-'}
                      </td>
                    </tr>
                  )}
                  renderMobileCard={(album) => (
                    <Link
                      key={album.id}
                      to={getAlbumRoutePath(album)}
                      state={{ title: album.title }}
                      className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:border-sky-300 dark:border-slate-700/70 dark:bg-slate-800/90 dark:hover:border-sky-500/40"
                    >
                      <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
                        <div className="flex aspect-square w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-700">
                          {album.cover_image_url ? (
                            <img
                              src={album.cover_image_url}
                              alt={formatAlbumTitle(album)}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-500">No Image</span>
                          )}
                        </div>
                        <div className="min-w-0 space-y-2">
                          <h3 className="line-clamp-3 text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
                            {formatAlbumTitle(album)}
                          </h3>
                          <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{album.album_artist?.name ?? '-'}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono dark:bg-slate-700">
                              {album.catalog_number_display || album.catalog_number || '-'}
                            </span>
                            <span>{formatDateDisplay(album.release_date) || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                />

                {lastPage > 1 ? (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={`${secondaryButtonClass} disabled:opacity-50`}>
                      前へ
                    </button>
                    {Array.from({ length: lastPage }, (_, index) => index + 1)
                      .filter((page) => Math.abs(page - currentPage) <= 2 || page === 1 || page === lastPage)
                      .map((page, index, list) => (
                        <span key={page}>
                          {index > 0 && list[index - 1] !== page - 1 ? <span className="px-2 py-1 text-slate-500 dark:text-slate-400">...</span> : null}
                          <button
                            type="button"
                            onClick={() => setPage(page)}
                            disabled={page === currentPage}
                            className={
                              page === currentPage
                                ? 'rounded-full bg-sky-600 px-3 py-1 text-white'
                                : 'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
                            }
                          >
                            {page}
                          </button>
                        </span>
                      ))}
                    <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === lastPage} className={`${secondaryButtonClass} disabled:opacity-50`}>
                      次へ
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        ) : null}
      </div>
      <SiteFooter />
    </div>
  );
}