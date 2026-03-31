import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Moon, Sun } from 'lucide-react';
import SiteFooter from '../components/SiteFooter';
import { fetchMusicBrainzAlbumDetail, registerMusicBrainzAlbum } from '../api/albums';
import { formatDateDisplay } from '../utils/formatDateDisplay';
import {
  PageBackdrop,
  floatingThemeButtonClass,
  heroPanelClass,
  outlineButtonClass,
  pageCardClass,
  pageShellClass,
  panelClass,
  primaryButtonClass,
  tableCardClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tableRowClass,
} from '../utils/uiTheme';

function showValue(value) {
  const text = String(value ?? '').trim();
  return text === '' ? '-' : text;
}

function creditsText(value) {
  const items = Array.isArray(value) ? value : [];
  const filtered = items.map((item) => String(item ?? '').trim()).filter(Boolean);
  return filtered.length > 0 ? filtered.join(', ') : '';
}

function trackArtistText(track, albumArtist) {
  const vocal = creditsText(track?.credits?.vocal);
  if (vocal !== '') {
    return vocal;
  }

  const fallback = String(albumArtist ?? '').trim();
  return fallback !== '' ? fallback : '-';
}

function groupTracksByDisc(tracks) {
  const rows = Array.isArray(tracks) ? tracks : [];
  const map = new Map();

  rows.forEach((track, index) => {
    const discNumber = Math.max(1, Number(track?.disk_number ?? 1) || 1);
    if (!map.has(discNumber)) {
      map.set(discNumber, []);
    }

    map.get(discNumber).push({
      ...track,
      __rowKey: `${discNumber}-${track?.track_number ?? 'x'}-${index}`,
    });
  });

  return Array.from(map.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([discNumber, discTracks]) => ({ discNumber, tracks: discTracks }));
}

const registerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/90 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-200/90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/22';

export default function MusicBrainzAlbumDetail({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      setRegisterError('');
      try {
        const data = await fetchMusicBrainzAlbumDetail(id);
        if (active) {
          setAlbum(data);
        }
      } catch {
        if (active) {
          setAlbum(null);
          setError('\u004d\u0075\u0073\u0069\u0063\u0042\u0072\u0061\u0069\u006e\u007a \u306e\u8a73\u7d30\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const discGroups = useMemo(() => groupTracksByDisc(album?.tracks), [album?.tracks]);

  const themeLabel = isDarkMode ? '\u30e9\u30a4\u30c8' : '\u30c0\u30fc\u30af';
  const themeTitle = isDarkMode ? '\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048' : '\u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const handleRegister = async () => {
    if (!id || registering) return;

    setRegistering(true);
    setRegisterError('');
    try {
      const result = await registerMusicBrainzAlbum(id);
      const path = String(result?.path ?? '').trim();
      if (path !== '') {
        navigate(path);
        return;
      }

      const albumId = String(result?.album_public_id ?? '').trim() || String(result?.album_id ?? '').trim();
      if (albumId !== '') {
        navigate(`/albums/${albumId}`);
        return;
      }

      throw new Error('Album path was not returned.');
    } catch (error) {
      if (error?.response?.status === 429) {
        setRegisterError('短時間に操作が集中したため、少し待ってからもう一度お試しください。');
      } else {
        setRegisterError('登録に失敗しました。時間をおいてもう一度お試しください。');
      }
    } finally {
      setRegistering(false);
    }
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

      <div className={`${pageCardClass} max-w-7xl`}>
        <div className="mb-4">
          <button type="button" onClick={handleBack} className={primaryButtonClass}>
            {'\u4e00\u89a7\u3078\u623b\u308b'}
          </button>
        </div>

        <section className={heroPanelClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                MUSICBRAINZ PREVIEW
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">
                  {loading ? '\u8aad\u307f\u8fbc\u307f\u4e2d...' : showValue(album?.title)}
                </h1>
              </div>
            </div>

            {!loading && !error && album?.release_url ? (
              <a
                href={album.release_url}
                target="_blank"
                rel="noreferrer"
                className={outlineButtonClass}
              >
                <ExternalLink className="h-4 w-4" />
                {'\u004d\u0075\u0073\u0069\u0063\u0042\u0072\u0061\u0069\u006e\u007a \u3092\u958b\u304f'}
              </a>
            ) : null}
          </div>
        </section>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-300">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</p>}
        {!loading && error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && album && (
          <>
            <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className={panelClass}>
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    className="w-full rounded-lg border border-slate-200/70 object-cover shadow-sm dark:border-slate-700/70"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-300">
                    No Image
                  </div>
                )}
              </div>

              <div className={panelClass}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{'\u30a2\u30eb\u30d0\u30e0\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8'}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.album_artist)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{'\u767a\u58f2\u65e5'}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{formatDateDisplay(album.release_date) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{'\u898f\u683c\u54c1\u756a'}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.catalog_number_display || album.catalog_number)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">JAN</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.jan)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{'\u30ec\u30fc\u30d9\u30eb'}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.label)}</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200/70 pt-4 dark:border-slate-700/70">
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={registering}
                    className={registerButtonClass}
                  >
                    {registering ? '\u767b\u9332\u4e2d...' : '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u6a5f\u80fd\u3092\u6709\u52b9\u306b\u3059\u308b'}
                  </button>
                  {registerError ? (
                    <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                      {registerError}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="mt-6 space-y-6">
              {discGroups.length > 0 ? (
                discGroups.map((discGroup) => (
                  <div key={`disc-${discGroup.discNumber}`}>
                    {discGroups.length > 1 ? (
                      <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        {`Disc ${discGroup.discNumber}`}
                      </h2>
                    ) : null}
                    <div className={tableCardClass}>
                      <div className="overflow-x-auto">
                        <table className={`${tableClass} min-w-[920px]`}>
                          <thead>
                            <tr className={tableHeadRowClass}>
                              <th className={`${tableHeadCellClass} w-20 whitespace-nowrap`}>Tr</th>
                              <th className={tableHeadCellClass}>{'\u30bf\u30a4\u30c8\u30eb'}</th>
                              <th className={tableHeadCellClass}>{'\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8'}</th>
                              <th className={tableHeadCellClass}>{'\u4f5c\u8a5e'}</th>
                              <th className={tableHeadCellClass}>{'\u4f5c\u66f2'}</th>
                              <th className={tableHeadCellClass}>{'\u7de8\u66f2'}</th>
                              <th className={`${tableHeadCellClass} w-24 whitespace-nowrap`}>{'\u9577\u3055'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discGroup.tracks.map((track) => (
                              <tr key={track.__rowKey} className={tableRowClass}>
                                <td className={`${tableCellClass} whitespace-nowrap`}>{track.track_number}</td>
                                <td className={tableCellClass}>{showValue(track.title)}</td>
                                <td className={tableCellClass}>{trackArtistText(track, album.album_artist)}</td>
                                <td className={tableCellClass}>{showValue(creditsText(track.credits?.lyricist))}</td>
                                <td className={tableCellClass}>{showValue(creditsText(track.credits?.composer))}</td>
                                <td className={tableCellClass}>{showValue(creditsText(track.credits?.arranger))}</td>
                                <td className={`${tableCellClass} whitespace-nowrap`}>{showValue(track.duration)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={tableCardClass}>
                  <div className="overflow-x-auto">
                    <table className={`${tableClass} min-w-[920px]`}>
                      <thead>
                        <tr className={tableHeadRowClass}>
                          <th className={`${tableHeadCellClass} w-20 whitespace-nowrap`}>Tr</th>
                          <th className={tableHeadCellClass}>{'\u30bf\u30a4\u30c8\u30eb'}</th>
                          <th className={tableHeadCellClass}>{'\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8'}</th>
                          <th className={tableHeadCellClass}>{'\u4f5c\u8a5e'}</th>
                          <th className={tableHeadCellClass}>{'\u4f5c\u66f2'}</th>
                          <th className={tableHeadCellClass}>{'\u7de8\u66f2'}</th>
                          <th className={`${tableHeadCellClass} w-24 whitespace-nowrap`}>{'\u9577\u3055'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={tableRowClass}>
                          <td className={tableCellClass} colSpan={7}>
                            {'\u30c8\u30e9\u30c3\u30af\u60c5\u5831\u306f\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

