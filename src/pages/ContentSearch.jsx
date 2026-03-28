import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Grid2x2, Moon, Sun } from 'lucide-react';
import { fetchAllAlbums, fetchContents } from '../api/albums';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { formatDateDisplay } from '../utils/formatDateDisplay';

const SEARCH_PAGE_SIZE = 20;

const TEXT = {
  themeLight: 'ライト',
  themeDark: 'ダーク',
  themeToLight: 'ライトモードに切り替え',
  themeToDark: 'ダークモードに切り替え',
  backToTop: 'トップへ戻る',
  pageTitle: '作品から探す',
  pageSubtitle: '登録済みの作品分類から、関連するアルバムをまとめて確認できます。',
  loadingContents: '作品一覧を読み込み中です。',
  contentLoadError: '作品一覧の取得に失敗しました。',
  parentCaption: '登録済みの関連作品を表示します。',
  all: '全て',
  resultsFallback: '作品別アルバム一覧',
  resultCount: '検索結果',
  clearSelection: '選択をクリア',
  loadingAlbums: 'アルバム一覧を読み込み中です。',
  albumLoadError: '作品別アルバムの取得に失敗しました。',
  emptyAlbums: 'この作品に紐づくアルバムはまだありません。',
  jacket: 'ジャケット',
  title: 'タイトル',
  artist: 'アーティスト',
  catalogNumber: '規格品番',
  releaseDate: '発売日',
  previous: '前へ',
  next: '次へ',
};

const normalizeCatalogNumber = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const compareCatalogNumbers = (left, right) => {
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
};

const getSortableTimestamp = (value) => {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const compareVariantRepresentative = (left, right) => {
  const catalogComparison = compareCatalogNumbers(left?.catalog_number, right?.catalog_number);
  if (catalogComparison !== 0) return catalogComparison;

  const releaseDateComparison =
    getSortableTimestamp(left?.release_date) - getSortableTimestamp(right?.release_date);
  if (releaseDateComparison !== 0) return releaseDateComparison;

  return Number(left?.id ?? Number.MAX_SAFE_INTEGER) - Number(right?.id ?? Number.MAX_SAFE_INTEGER);
};

const getVariantKey = (album) => {
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();
  if (variantGroupKey !== '') {
    return `variant:${variantGroupKey}`;
  }
  return `album:${album?.id ?? ''}`;
};

const collapseEditionVariants = (albums) => {
  const representativeByGroup = new Map();

  for (const album of albums) {
    const key = getVariantKey(album);
    const current = representativeByGroup.get(key);
    if (!current || compareVariantRepresentative(album, current) < 0) {
      representativeByGroup.set(key, album);
    }
  }

  const representativeIds = new Set(
    [...representativeByGroup.values()]
      .map((album) => album?.id)
      .filter((id) => id !== undefined && id !== null)
  );

  return albums.filter((album) => representativeIds.has(album?.id));
};

const formatAlbumListTitle = (album) => {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();
  const variantGroupKey = String(album?.variant_group_key ?? '').trim();

  if (variantGroupKey !== '' && edition !== '' && edition !== '-') {
    return title !== '' ? `${title}【${edition}】` : `【${edition}】`;
  }

  return title;
};

const buttonClass =
  'rounded-full bg-slate-200 px-3 py-1 text-slate-700 transition hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600';

function ContentSearch({ isDarkMode, onToggleTheme }) {
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

  useEffect(() => {
    let active = true;

    const loadContents = async () => {
      setLoadingContents(true);
      try {
        const items = await fetchContents();
        if (active) setContentTree(items);
      } catch {
        if (active) {
          setContentTree([]);
          setError(TEXT.contentLoadError);
        }
      } finally {
        if (active) setLoadingContents(false);
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
        const response = await fetchAllAlbums({
          content_id: nextContentId,
          sort: 'release_date',
          order: 'desc',
        });
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
          setError(TEXT.albumLoadError);
        }
      } finally {
        if (active) setLoadingAlbums(false);
      }
    };

    loadAlbums();

    return () => {
      active = false;
    };
  }, [searchParams, contentNameMap]);

  const visibleAlbums = albums.slice((currentPage - 1) * SEARCH_PAGE_SIZE, currentPage * SEARCH_PAGE_SIZE);

  const changePage = (page) => {
    if (page < 1 || page > lastPage) return;
    setCurrentPage(page);
  };

  const renderPages = () => {
    const pages = [];

    const addPage = (i) => {
      pages.push(
        <button
          key={i}
          onClick={() => changePage(i)}
          disabled={i === currentPage}
          className={`rounded-full px-3 py-1 ${
            i === currentPage
              ? 'bg-sky-600 text-white cursor-default'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
          }`}
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

  const selectContent = (id) => {
    setSearchParams({ content_id: String(id) });
  };

  const clearSelection = () => {
    setSearchParams({});
  };

  const themeLabel = isDarkMode ? TEXT.themeLight : TEXT.themeDark;
  const themeTitle = isDarkMode ? TEXT.themeToLight : TEXT.themeToDark;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-100 px-3 pb-6 pt-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute bottom-8 left-1/3 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
      </div>

      <button
        type="button"
        onClick={onToggleTheme}
        className="absolute right-3 top-4 z-10 hidden items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 sm:right-6 sm:top-6 lg:inline-flex"
        title={themeTitle}
        aria-label={themeTitle}
      >
        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{themeLabel}</span>
      </button>

      <div className="relative mx-auto max-w-7xl rounded-[28px] bg-white/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/95 dark:ring-white/10 sm:p-6">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {TEXT.backToTop}
          </Link>
        </div>

        <div className="mb-6 overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/80 px-4 py-5 shadow-sm dark:border-slate-700/70 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                <Grid2x2 className="h-3.5 w-3.5" />
                CONTENT NAVI
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">{TEXT.pageTitle}</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{TEXT.pageSubtitle}</p>
              </div>
            </div>

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
          </div>
        </div>

        {loadingContents && <p className="text-sm text-slate-500 dark:text-slate-300">{TEXT.loadingContents}</p>}
        {!loadingContents && contentTree.length === 0 && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error || TEXT.contentLoadError}
          </p>
        )}

        {!loadingContents && contentTree.length > 0 && (
          <div className="space-y-5">
            {contentTree.map((parent) => (
              <section
                key={parent.id}
                className="rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-slate-50/90 via-white to-white p-4 shadow-sm dark:border-slate-700/70 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-900"
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">{parent.name}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {(Array.isArray(parent.children) ? parent.children : []).map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => selectContent(child.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        selectedContentId === String(child.id)
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400/70 dark:bg-sky-500/10 dark:text-sky-200'
                          : 'border-slate-200 bg-white/90 text-slate-700 hover:border-sky-300 hover:bg-sky-50/70 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-700/70'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => selectContent(parent.id)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      selectedContentId === String(parent.id)
                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-400/70 dark:bg-sky-500/10 dark:text-sky-200'
                        : 'border-slate-200 bg-white/90 text-slate-700 hover:border-sky-300 hover:bg-sky-50/70 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-700/70'
                    }`}
                  >
                    {TEXT.all}
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}

        {selectedContentId !== '' && (
          <section className="mt-8 rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{selectedContentName || TEXT.resultsFallback}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{TEXT.resultCount}: {albums.length}件</p>
              </div>
              <button type="button" onClick={clearSelection} className={buttonClass}>
                {TEXT.clearSelection}
              </button>
            </div>

            {loadingAlbums && <p className="text-sm text-slate-500 dark:text-slate-300">{TEXT.loadingAlbums}</p>}
            {!loadingAlbums && error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            )}
            {!loadingAlbums && !error && albums.length === 0 && (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {TEXT.emptyAlbums}
              </p>
            )}

            {!loadingAlbums && !error && albums.length > 0 && (
              <>
                <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-700/80">
                          <th className="last:border-r-0 w-20 whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-600">{TEXT.jacket}</th>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-left text-sm font-semibold dark:border-slate-600">{TEXT.title}</th>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-left text-sm font-semibold dark:border-slate-600">{TEXT.artist}</th>
                          <th className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-left text-sm font-semibold dark:border-slate-600">{TEXT.catalogNumber}</th>
                          <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-sm font-semibold dark:border-slate-600">{TEXT.releaseDate}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleAlbums.map((album) => (
                          <tr key={album.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            <td className="last:border-r-0 border-b border-r border-slate-200 px-2 py-2 dark:border-slate-600">
                              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                                {album.cover_image_url ? (
                                  <img
                                    src={album.cover_image_url}
                                    alt={formatAlbumListTitle(album)}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextSibling) {
                                        e.currentTarget.nextSibling.style.display = 'block';
                                      }
                                    }}
                                  />
                                ) : null}
                                <span
                                  className="text-xs text-gray-500 dark:text-gray-300"
                                  style={{ display: album.cover_image_url ? 'none' : 'block' }}
                                >
                                  No Image
                                </span>
                              </div>
                            </td>
                            <td className="border-b border-r border-slate-200 px-4 py-2 dark:border-slate-600">
                              <Link
                                to={getAlbumRoutePath(album)}
                                state={{ title: album.title }}
                                className="text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
                              >
                                {formatAlbumListTitle(album)}
                              </Link>
                            </td>
                            <td className="border-b border-r border-slate-200 px-4 py-2 dark:border-slate-600">{album.album_artist?.name ?? '-'}</td>
                            <td className="whitespace-nowrap border-b border-r border-slate-200 px-4 py-2 dark:border-slate-600">{album.catalog_number || '-'}</td>
                            <td className="whitespace-nowrap border-b border-slate-200 px-4 py-2 dark:border-slate-600">{formatDateDisplay(album.release_date) || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {lastPage > 1 && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={buttonClass}
                    >
                      {TEXT.previous}
                    </button>
                    {renderPages()}
                    <button
                      type="button"
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === lastPage}
                      className={buttonClass}
                    >
                      {TEXT.next}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <SiteFooter />
      </div>
    </div>
  );
}

export default ContentSearch;
