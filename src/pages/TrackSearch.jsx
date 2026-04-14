import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Music4, Search, Moon, Sun } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';
import SiteFooter from '../components/SiteFooter';
import InfoCard from '../components/InfoCard';
import PageHeaderCard from '../components/PageHeaderCard';
import ResponsiveResultList from '../components/ResponsiveResultList';
import SearchHeroCard from '../components/SearchHeroCard';
import SiteBrandHeader from '../components/SiteBrandHeader';
import SearchValueHighlights from '../components/SearchValueHighlights';
import { getAlbumRoutePath } from '../utils/albumPublicId';
import { inputClass, pageCardClass, pageShellClass, secondaryButtonClass, PageBackdrop, floatingThemeButtonClass } from '../utils/uiTheme';

function roleLabel(role) {
  if (role === 'vocal') return '歌唱';
  if (role === 'lyricist') return '作詞';
  if (role === 'composer') return '作曲';
  if (role === 'arranger') return '編曲';
  return role;
}

function trackCredits(track) {
  if (track?.credits && typeof track.credits === 'object') {
    const normalized = {};
    for (const [role, list] of Object.entries(track.credits)) {
      if (!Array.isArray(list) || list.length === 0) continue;
      normalized[role] = list
        .map((item) => ({ id: item?.id ?? null, public_id: item?.public_id ?? null, name: item?.name ?? '' }))
        .filter((item) => String(item.name).trim() !== '');
    }
    if (Object.keys(normalized).length > 0) return normalized;
  }

  const artists = Array.isArray(track?.artists) ? track.artists : [];
  const map = {};
  for (const artist of artists) {
    const role = artist?.pivot?.role;
    if (!role) continue;
    if (!map[role]) map[role] = [];
    map[role].push({ id: artist.id, public_id: artist.public_id ?? null, name: artist.name });
  }
  return map;
}

function creditsSummary(track) {
  const groups = trackCredits(track);
  const first = Object.entries(groups)[0];
  if (!first) return '-';
  return `${roleLabel(first[0])}: ${first[1].map((item) => item.name).join(', ')}`;
}

const sortableHeaderButtonClass =
  'inline-flex items-center gap-1 whitespace-nowrap text-left font-semibold text-slate-700 transition hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300';

export default function TrackSearch({ isDarkMode = false, onToggleTheme = () => {} }) {
  const [title, setTitle] = useState('');
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState('release_date');
  const [order, setOrder] = useState('desc');
  const load = async ({ nextTitle = submittedTitle, nextPage = currentPage, nextSort = sort, nextOrder = order } = {}) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();
      if (nextTitle.trim() !== '') query.set('title', nextTitle.trim());
      query.set('page', String(nextPage));
      query.set('per_page', '20');
      query.set('sort', nextSort);
      query.set('order', nextOrder);

      const response = await fetch(buildApiUrl(`/tracks?${query.toString()}`), { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const tracks = data?.tracks;
      setItems(tracks?.data ?? []);
      setCurrentPage(tracks?.current_page ?? nextPage);
      setLastPage(tracks?.last_page ?? 1);
      setTotalCount(Number(tracks?.total ?? tracks?.data?.length ?? 0));
    } catch (caughtError) {
      console.error(caughtError);
      setItems([]);
      setTotalCount(0);
      setError('\u697d\u66f2\u691c\u7d22\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002API \u304c\u8d77\u52d5\u3057\u3066\u3044\u308b\u304b\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSearched) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sort, order, hasSearched]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (nextTitle === '') {
      setError('\u66f2\u540d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
      setHasSearched(false);
      setItems([]);
      setCurrentPage(1);
      setLastPage(1);
      setTotalCount(0);
      return;
    }
    setError('');
    setItems([]);
    setLastPage(1);
    setCurrentPage(1);
    setTotalCount(0);
    setSubmittedTitle(nextTitle);
    setHasSearched(true);
    load({ nextTitle, nextPage: 1, nextSort: sort, nextOrder: order });
  };

  const handleClear = () => {
    setTitle('');
    setSubmittedTitle('');
    setCurrentPage(1);
    setItems([]);
    setLastPage(1);
    setTotalCount(0);
    setError('');
    setHasSearched(false);
  };

  const handleSort = (nextSort) => {
    const nextOrder = sort === nextSort ? (order === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(nextSort);
    setOrder(nextOrder);
    setCurrentPage(1);
  };

  const formActionButtonClass =
    'inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';
  const searchSubmitButtonClass =
    formActionButtonClass + ' bg-sky-600 text-white shadow-sm hover:bg-sky-700';
  const clearButtonClass =
    formActionButtonClass + ' bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600';

  const sortIcon = (key) => {
    if (sort !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const renderPages = () => {
    const pages = [];
    const addPage = (page) => {
      pages.push(
        <button
          key={page}
          type="button"
          onClick={() => setCurrentPage(page)}
          disabled={page === currentPage}
          className={
            page === currentPage
              ? 'rounded-full bg-sky-600 px-3 py-1 text-white'
              : 'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
          }
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
    {
      key: 'catalog',
      header: (
        <button type="button" className={sortableHeaderButtonClass} onClick={() => handleSort('catalog_number')} aria-label="規格品番でソート">
          規格品番
          {sortIcon('catalog_number')}
        </button>
      ),
      className: 'w-40 whitespace-nowrap',
    },
    {
      key: 'release',
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
            current="track"
            badge="TRACK SEARCH"
            badgeIcon={Music4}
            title={'\u697d\u66f2\u540d\u691c\u7d22'}
            subtitle={'\u66f2\u540d\u304b\u3089\u53ce\u9332\u30a2\u30eb\u30d0\u30e0\u3084\u30af\u30ec\u30b8\u30c3\u30c8\u3092\u6a2a\u65ad\u3057\u3066\u63a2\u305b\u307e\u3059\u3002'}
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <label className="space-y-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{'\u66f2\u540d'}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={'\u4f8b: Thank You!'}
                  className={inputClass}
                  required
                />
              </label>
              <button type="submit" className={`${searchSubmitButtonClass} md:self-end`}><Search className="h-4 w-4" />{'\u691c\u7d22'}</button>
              <button type="button" onClick={handleClear} className={`${clearButtonClass} md:self-end`}>{'\u30af\u30ea\u30a2'}</button>
            </form>
          </SearchHeroCard>
        </PageHeaderCard>

        {!hasSearched ? (
          <InfoCard title="検索のヒント" description="楽曲名を入力して検索を押すと、収録アルバムと主要クレジットを表示します。" />
        ) : null}

        {loading ? <InfoCard title="検索結果" description="楽曲を検索しています。" /> : null}

        {error ? (
          <p className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {hasSearched && !loading && !error ? (
          <div className="space-y-6">
            <InfoCard title={`検索結果 ${totalCount}件`}>
              <ResponsiveResultList
                items={items}
                columns={columns}
                emptyText="該当する楽曲がありません。"
                renderDesktopRow={(track, index, rowClass) => (
                  <tr key={track.id ?? index} className={rowClass}>
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-medium dark:border-slate-600">{track.title}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 dark:border-slate-600">
                      {track.album?.id ? (
                        <Link to={getAlbumRoutePath(track.album)} className="text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300">
                          {track.album.title}
                        </Link>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 tabular-nums text-sm dark:border-slate-600">{track.album?.catalog_number_display || track.album?.catalog_number || '-'}</td>
                    <td className="border-b border-slate-200 px-4 py-3 whitespace-nowrap text-slate-600 dark:border-slate-600 dark:text-slate-300">{track.album?.release_date?.replace(/-/g, '/') || '-'}</td>
                  </tr>
                )}
                renderMobileCard={(track) => (
                  <div key={track.id} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90">
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{track.title}</h3>
                      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {track.album?.id ? (
                          <Link to={getAlbumRoutePath(track.album)} className="text-blue-600 underline-offset-4 hover:underline dark:text-sky-400">
                            {track.album.title}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 tabular-nums dark:bg-slate-700">{track.album?.catalog_number_display || track.album?.catalog_number || '-'}</span>
                      <span>{track.album?.release_date?.replace(/-/g, '/') || '-'}</span>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                      {creditsSummary(track)}
                    </div>
                  </div>
                )}
              />
              {lastPage > 1 ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className={`${secondaryButtonClass} disabled:opacity-50`}>前へ</button>
                  {renderPages()}
                  <button type="button" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage} className={`${secondaryButtonClass} disabled:opacity-50`}>次へ</button>
                </div>
              ) : null}
            </InfoCard>
          </div>
        ) : null}
      </div>
      <SiteFooter />
    </div>
  );
}
