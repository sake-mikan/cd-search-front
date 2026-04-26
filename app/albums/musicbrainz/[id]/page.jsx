'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExternalLink, Moon, Sun } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import MusicBrainzTagWritePanel from '@/components/MusicBrainzTagWritePanel';
import SiteBrandHeader from '@/components/SiteBrandHeader';
import { fetchMusicBrainzAlbumDetail, registerMusicBrainzAlbum } from '@/lib/api';
import { formatDateDisplay } from '@/utils/formatDateDisplay';
import { formatReleaseTypeLabel } from '@/utils/releaseTypeLabel';
import {
  PageBackdrop,
  floatingThemeButtonClass,
  heroPanelClass,
  mobileThemeButtonClass,
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
  ThemeToggle,
} from '@/utils/uiTheme';
import { useTheme } from '@/components/ThemeProvider';

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

const registerRequestButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/90 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-200/90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/22';

export default function MusicBrainzAlbumDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      setRequestError('');
      setRequestMessage('');
      try {
        const data = await fetchMusicBrainzAlbumDetail(id);
        if (active) {
          setAlbum(data);
        }
      } catch {
        if (active) {
          setAlbum(null);
          setError('MusicBrainz の詳細取得に失敗しました。');
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

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  const handleRequestRegister = async () => {
    if (!id || requesting) return;

    setRequesting(true);
    setRequestError('');
    setRequestMessage('');
    try {
      await registerMusicBrainzAlbum(id);
      setRequestMessage('登録依頼を送信しました。');
    } catch (caughtError) {
      if (caughtError?.response?.status === 429) {
        setRequestError('短時間に操作が集中したため、少し待ってからもう一度お試しください。');
      } else {
        setRequestError('登録依頼に失敗しました。時間をおいてもくはもう一度お試しください。');
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <ThemeToggle />

      <div className={`${pageCardClass} max-w-7xl`}>
        <SiteBrandHeader
          actions={
            <>
              <button type="button" onClick={handleBack} className="inline-flex h-12 items-center justify-center rounded-full bg-sky-500 px-8 text-sm font-black text-white shadow-[0_10px_20px_rgba(14,165,233,0.3)] transition-all hover:bg-sky-400 hover:shadow-[0_15px_30px_rgba(14,165,233,0.5)] active:scale-95">
                {'一覧へ戻る'}
              </button>
            </>
          }
        />

        <section className={heroPanelClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400 shadow-sm">
                  MUSICBRAINZ PREVIEW
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  サイト内データが見つからなかったため、MusicBrainz の情報を表示しています。
                </p>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">
                  {loading ? '読み込み中...' : showValue(album?.title)}
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
                MusicBrainz を開く
              </a>
            ) : null}
          </div>
        </section>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-300">読み込み中...</p>}
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
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">アルバムアーティスト</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.album_artist)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">発売日</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{formatDateDisplay(album.release_date) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">種別</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(formatReleaseTypeLabel(album.release_type, album.release_type_label))}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">規格品番</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.catalog_number_display || album.catalog_number)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">JAN</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.jan)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">レーベル</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{showValue(album.label)}</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200/70 pt-4 dark:border-slate-700/70">
                  <button
                    type="button"
                    onClick={handleRequestRegister}
                    disabled={requesting}
                    className={registerRequestButtonClass}
                  >
                    {requesting ? '登録依頼中...' : 'このCD情報を登録依頼する'}
                  </button>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    現在表示しているCD情報をサイト内に登録するための依頼を出すことができます。
                  </p>
                  {requestMessage ? (
                    <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {requestMessage}
                    </p>
                  ) : null}
                  {requestError ? (
                    <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                      {requestError}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <MusicBrainzTagWritePanel album={album} />

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
                              <th className={tableHeadCellClass}>タイトル</th>
                              <th className={tableHeadCellClass}>アーティスト</th>
                              <th className={tableHeadCellClass}>作詞</th>
                              <th className={tableHeadCellClass}>作曲</th>
                              <th className={tableHeadCellClass}>編曲</th>
                              <th className={`${tableHeadCellClass} w-24 whitespace-nowrap`}>長さ</th>
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
                          <th className={tableHeadCellClass}>タイトル</th>
                          <th className={tableHeadCellClass}>アーティスト</th>
                          <th className={tableHeadCellClass}>作詞</th>
                          <th className={tableHeadCellClass}>作曲</th>
                          <th className={tableHeadCellClass}>編曲</th>
                          <th className={`${tableHeadCellClass} w-24 whitespace-nowrap`}>長さ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={tableRowClass}>
                          <td className={tableCellClass} colSpan={7}>
                            トラック情報は取得できませんでした。
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
