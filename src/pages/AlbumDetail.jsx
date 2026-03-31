import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, File, FolderOpen, Loader2, Moon, RotateCcw, Sun, WandSparkles } from 'lucide-react';
import { buildApiUrl } from "../api/baseUrl";
import SiteFooter from "../components/SiteFooter";
import { formatInfoTimestamp } from "../utils/formatDateTime";
import { formatDateDisplay } from "../utils/formatDateDisplay";
import { getAlbumRouteId, getAlbumRoutePath } from "../utils/albumPublicId";
import { getArtistAlbumsRoutePath, getArtistTracksRoutePath } from "../utils/artistPublicId";
import {
  PageBackdrop,
  floatingThemeButtonClass,
  pageCardClass,
  panelClass,
  pageShellClass,
  primaryButtonClass,
} from '../utils/uiTheme';

const MAX_ARTWORK_BYTES = 2 * 1024 * 1024;

function detectTagWriteSupport() {
  if (typeof window === 'undefined') return { supported: false, reason: 'この環境では利用できません。' };

  const hasOpenPicker = typeof window.showOpenFilePicker === 'function';
  const hasWritable =
    typeof window.FileSystemFileHandle !== 'undefined' &&
    typeof window.FileSystemFileHandle.prototype?.createWritable === 'function';

  const ua = navigator.userAgent;
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg\//i.test(ua);
  const isChromiumFamily = /Chrome|Chromium|Edg\//i.test(ua);

  if (isSafari) return { supported: false, reason: 'Safariは非対応です。ChromeまたはEdgeをご利用ください。' };
  if (!isChromiumFamily) return { supported: false, reason: '現在はChrome / Edgeのみ対応しています。' };
  if (!hasOpenPicker || !hasWritable) return { supported: false, reason: 'File System Access APIが利用できません。' };

  return { supported: true, reason: '' };
}

function normalizeTracks(items) {
  const list = Array.isArray(items) ? items.slice() : [];
  return list.sort((a, b) => {
    const ad = Number(a?.disk_number ?? 1);
    const bd = Number(b?.disk_number ?? 1);
    if (ad !== bd) return ad - bd;
    const at = Number(a?.track_number ?? 0);
    const bt = Number(b?.track_number ?? 0);
    if (at !== bt) return at - bt;
    return Number(a?.id ?? 0) - Number(b?.id ?? 0);
  });
}

function toPeopleText(value) {
  if (value == null) return '';
  const list = Array.isArray(value) ? value : typeof value === 'object' ? Object.values(value) : [value];
  return list
    .map((x) => (typeof x === 'string' ? x : x?.name))
    .filter(Boolean)
    .join(', ');
}

function toPeopleList(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : typeof value === 'object' ? Object.values(value) : [value];
  return list
    .map((x) => {
      if (typeof x === 'string') return { id: null, public_id: null, name: x };
      return { id: x?.id ?? null, public_id: x?.public_id ?? null, name: x?.name ?? '' };
    })
    .filter((x) => String(x.name ?? '').trim() !== '');
}

function releaseYearText(album) {
  if (album?.release_year != null && album.release_year !== '') return String(album.release_year);
  const m = String(album?.release_date ?? '').match(/^(\d{4})/);
  return m ? m[1] : '';
}

function extractTrackNoFromFilename(name) {
  const m = String(name ?? '').match(/(?:^|[^\d])(\d{1,2})(?:[^\d]|$)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractDiscTrackFromFilename(name) {
  const raw = String(name ?? '').replace(/\.[^.]+$/, '');

  const byDiscWord = raw.match(/(?:disc|cd)\s*0?(\d{1,2})[^0-9]+(?:tr|track)?\s*0?(\d{1,2})/i);
  if (byDiscWord) {
    return {
      disc: Number(byDiscWord[1]),
      track: Number(byDiscWord[2]),
    };
  }

  const byPair = raw.match(/(?:^|[^\d])0?(\d{1,2})[-_ ]0?(\d{1,2})(?:[^\d]|$)/);
  if (byPair) {
    return {
      disc: Number(byPair[1]),
      track: Number(byPair[2]),
    };
  }

  const track = extractTrackNoFromFilename(raw);
  if (track != null) return { disc: null, track };
  return { disc: null, track: null };
}

function formatFileSize(bytes) {
  const value = Number(bytes ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function showValue(value) {
  if (value == null) return '-';
  const text = String(value).trim();
  return text === '' ? '-' : text;
}

function copyValue(value) {
  if (value == null) return '';
  return String(value).trim();
}

function albumLinkTypeLabel(type) {
  switch (String(type ?? '').toLowerCase()) {
    case 'official':
      return '公式';
    case 'streaming':
      return '配信';
    case 'youtube':
      return 'YouTube';
    case 'store':
      return '販売';
    case 'wiki':
      return 'Wiki';
    default:
      return 'その他';
  }
}

function albumLinkTitle(link) {
  const title = String(link?.title ?? '').trim();
  if (title !== '') return title;
  const provider = String(link?.provider ?? '').trim();
  if (provider !== '') return provider;
  return String(link?.url ?? '');
}

function albumEditionOptionLabel(variant) {
  const edition = copyValue(variant?.edition);
  if (edition !== '' && edition !== '-') {
    return edition;
  }
  return '\u5f62\u614b\u306a\u3057';
}

function buildAlbumTitleWithEdition(album, includeEdition = false) {
  const title = copyValue(album?.title);
  const edition = copyValue(album?.edition);
  const shouldIncludeEdition = includeEdition && edition !== '' && edition !== '-';

  if (title && shouldIncludeEdition) return `${title} [${edition}]`;
  if (title) return title;
  if (shouldIncludeEdition) return `[${edition}]`;
  return '';
}

function normalizeAlbumCovers(album) {
  const raw = Array.isArray(album?.covers) ? album.covers : [];
  const normalized = raw
    .map((cover, index) => ({
      key: String(cover?.id ?? cover?.file_name ?? `cover-${index}`),
      id: cover?.id ?? null,
      title: copyValue(cover?.title),
      url: String(cover?.url ?? '').trim(),
      sort_order: Number(cover?.sort_order ?? index + 1) || index + 1,
      is_primary: Boolean(cover?.is_primary),
      meta: cover?.meta ?? null,
    }))
    .filter((cover) => cover.url !== '')
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return String(a.key).localeCompare(String(b.key), 'ja');
    });

  if (normalized.length > 0) return normalized;

  const legacyUrl = String(album?.cover_image_url ?? '').trim();
  if (legacyUrl === '') return [];

  return [
    {
      key: 'legacy-primary',
      id: null,
      title: '',
      url: legacyUrl,
      sort_order: 1,
      is_primary: true,
      meta: album?.cover_image_meta ?? null,
    },
  ];
}

function coverOptionLabel(cover, index) {
  const title = copyValue(cover?.title);
  if (title !== '') return title;
  return index === 0 ? '\u30b8\u30e3\u30b1\u30c3\u30c8' : `\u30b8\u30e3\u30b1\u30c3\u30c8 ${index + 1}`;
}
function buildTagPayload(album, track, releaseYear, trackTotalByDisk, discTotal, albumTitle = '') {
  const credits = track?.credits ?? {};
  const trackNo = Number(track?.track_number ?? 0);
  const discNo = Number(track?.disk_number ?? 1);
  const yearNo = Number(releaseYear);
  const yearText = Number.isFinite(yearNo) && yearNo > 0 ? String(yearNo) : '';

  return {
    title: String(track?.title ?? ''),
    artist: toPeopleText(credits?.vocal) || String(album?.album_artist?.name ?? ''),
    album: albumTitle || String(album?.title ?? ''),
    albumArtist: String(album?.album_artist?.name ?? ''),
    track: trackNo > 0 ? String(trackNo) : '',
    trackTotal:
      Number(trackTotalByDisk?.[discNo] ?? 0) > 0 ? String(trackTotalByDisk[discNo]) : '',
    disc: discNo > 0 ? String(discNo) : '',
    discTotal: discTotal > 0 ? String(discTotal) : '',
    year: yearText,
    date: yearText,
    genre: String(track?.genre ?? ''),
    lyricist: toPeopleText(credits?.lyricist),
    composer: toPeopleText(credits?.composer),
    arranger: toPeopleText(credits?.arranger),
    publisher: String(album?.label ?? ''),
    comment: String(track?.comment ?? ''),
    isrc: '',
  };
}

function copyByExecCommand(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

async function collectAudioFilesFromDirectory(rootHandle) {
  const items = [];

  const walk = async (dirHandle, prefix = '') => {
    for await (const entry of dirHandle.values()) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        await walk(entry, relativePath);
        continue;
      }

      if (entry.kind === 'file' && /\.(mp3|flac|m4a)$/i.test(entry.name)) {
        items.push({
          handle: entry,
          directoryHandle: dirHandle,
          fileName: entry.name,
          relativePath,
        });
      }
    }
  };

  await walk(rootHandle);
  items.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'ja'));
  return items;
}

function sanitizeFileName(name) {
  const filtered = String(name ?? '')
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code <= 31) return '_';
      if ('<>:"/\\|?*'.includes(ch)) return '_';
      return ch;
    })
    .join('');

  return filtered.replace(/[. ]+$/g, '').trim();
}

function buildRenameContext(album, track, releaseYear, albumTitle = '') {
  const credits = track?.credits ?? {};
  return {
    track: Number(track?.track_number ?? 0) || '',
    disc: Number(track?.disk_number ?? 0) || '',
    title: track?.title ?? '',
    artist: toPeopleText(credits?.vocal),
    lyricist: toPeopleText(credits?.lyricist),
    composer: toPeopleText(credits?.composer),
    arranger: toPeopleText(credits?.arranger),
    album: albumTitle || (album?.title ?? ''),
    album_artist: album?.album_artist?.name ?? '',
    year: releaseYear ?? '',
    release_date: album?.release_date ?? '',
    catalog_number: album?.catalog_number_display ?? album?.catalog_number_display ?? album?.catalog_number ?? '',
  };
}
function renderRenameTemplate(template, context) {
  let out = String(template ?? '');

  out = out.replace(/\$num\(%([a-z0-9_]+)%\s*,\s*(\d+)\)/gi, (_, key, widthText) => {
    const width = Math.max(1, Math.min(10, Number(widthText) || 1));
    const n = Number(context[String(key).toLowerCase()]);
    if (!Number.isFinite(n)) return '';
    return String(Math.trunc(n)).padStart(width, '0');
  });

  out = out.replace(/%([a-z0-9_]+)%/gi, (_, key) => {
    const value = context[String(key).toLowerCase()];
    return value == null ? '' : String(value);
  });

  return out.replace(/\s+/g, ' ').trim();
}

async function resolveUniqueFileName(directoryHandle, desiredName, currentName) {
  const desiredLower = String(desiredName).toLowerCase();
  const currentLower = String(currentName ?? '').toLowerCase();
  if (desiredLower === currentLower) return currentName;

  const dot = desiredName.lastIndexOf('.');
  const base = dot > 0 ? desiredName.slice(0, dot) : desiredName;
  const ext = dot > 0 ? desiredName.slice(dot) : '';

  let candidate = desiredName;
  let index = 1;
  while (true) {
    try {
      await directoryHandle.getFileHandle(candidate);
      candidate = `${base} (${index})${ext}`;
      index += 1;
    } catch {
      return candidate;
    }
  }
}

export default function AlbumDetail({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const support = useMemo(() => detectTagWriteSupport(), []);
  const workerRef = useRef(null);
  const workerReqIdRef = useRef(1);
  const workerPendingRef = useRef(new Map());
  const [workerReady, setWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState('');

  const [tagFiles, setTagFiles] = useState([]);
  const [tagError, setTagError] = useState('');
  const [tagMessage, setTagMessage] = useState('');
  const [tagProgress, setTagProgress] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [embedCover, setEmbedCover] = useState(false);
  const [renameOnWrite, setRenameOnWrite] = useState(false);
  const [includeEditionInAlbumName, setIncludeEditionInAlbumName] = useState(false);
  const [selectedCoverKey, setSelectedCoverKey] = useState('');
  const [tagCoverKey, setTagCoverKey] = useState('');
  const [renamePattern, setRenamePattern] = useState('$num(%track%,2) %title%');
  const [isTagOptionExpanded, setIsTagOptionExpanded] = useState(false);

  const [copiedToken, setCopiedToken] = useState('');
  const copyTimerRef = useRef(null);

  const apiUrl = useMemo(() => {
    return buildApiUrl(`/albums/${id}`);
  }, [id]);
  const workerWasmUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/taglib.wasm';
    const basePath = String(import.meta.env.BASE_URL || '/').replace(/\/+$/, '/');
    return new URL(`${basePath}taglib.wasm`, window.location.origin).toString();
  }, []);

  const callWorker = useCallback((type, payload = {}, onProgress = null, transferList = []) => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error('タグ書き込みエンジンが初期化されていません。'));

    const reqId = workerReqIdRef.current++;
    return new Promise((resolve, reject) => {
      workerPendingRef.current.set(reqId, { resolve, reject, onProgress });
      worker.postMessage({ id: reqId, type, payload }, transferList);
    });
  }, []);

  const updateTagFile = useCallback((key, patch) => {
    setTagFiles((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }, []);

  const writeClipboard = useCallback(async (text, token) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else if (!copyByExecCommand(text)) throw new Error('クリップボードにコピーできませんでした。');
      setCopiedToken(token);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopiedToken((prev) => (prev === token ? '' : prev));
      }, 1200);
    } catch {
      // no-op: copy result is represented by the icon state only
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setAlbum(await res.json());
      } catch (e) {
        console.error(e);
        setError('アルバム詳細の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiUrl]);

  const canonicalAlbumId = useMemo(() => getAlbumRouteId(album, id), [album, id]);

  useEffect(() => {
    if (!album?.public_id) return;
    if (String(id ?? '').trim() === '') return;
    if (String(id) !== String(album.id)) return;
    if (String(id) === String(album.public_id)) return;
    navigate(getAlbumRoutePath(album, id), { replace: true });
  }, [album, id, navigate]);

  useEffect(() => {
    setTagFiles([]);
    setTagError('');
    setTagMessage('');
    setTagProgress(0);
    setIsWriting(false);
    setEmbedCover(false);
    setRenameOnWrite(true);
    setIncludeEditionInAlbumName(false);
    setIsTagOptionExpanded(false);
    setCopiedToken('');
  }, [id]);

  const shouldShowTagOptionDetails = tagFiles.length > 0 || isTagOptionExpanded;

  useEffect(() => {
    if (!support.supported) return undefined;

    const pendingMap = workerPendingRef.current;
    const worker = new Worker(new URL('../workers/tagWriter.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { id: reqId, type, payload, error: workerErr } = event.data ?? {};
      const pending = pendingMap.get(reqId);
      if (!pending) return;
      if (type === 'PROGRESS') {
        if (typeof pending.onProgress === 'function') pending.onProgress(payload);
        return;
      }
      pendingMap.delete(reqId);
      if (type === 'DONE') pending.resolve(payload);
      else if (type === 'ERROR') pending.reject(new Error(workerErr?.message || 'Worker error'));
      else pending.reject(new Error('Unknown worker response'));
    };

    worker.onerror = () => {
      setWorkerError('タグ書き込みエンジンの起動に失敗しました。ページを再読み込みしてください。');
    };

    callWorker('INIT', { wasmUrl: workerWasmUrl })
      .then(() => {
        setWorkerReady(true);
        setWorkerError('');
      })
      .catch((e) => {
        setWorkerError(`${e.message} (WASM: ${workerWasmUrl})`);
      });

    return () => {
      for (const [, pending] of pendingMap.entries()) pending.reject(new Error('Worker処理が中断されました。'));
      pendingMap.clear();
      worker.terminate();
      workerRef.current = null;
      setWorkerReady(false);
    };
  }, [callWorker, support.supported, workerWasmUrl]);

  const orderedTracks = useMemo(() => normalizeTracks(album?.tracks), [album?.tracks]);
  const releaseYear = useMemo(() => releaseYearText(album), [album]);
  const albumLinks = useMemo(() => {
    const rawLinks = Array.isArray(album?.links)
      ? album.links
      : Array.isArray(album?.album_links)
      ? album.album_links
      : Array.isArray(album?.albumLinks)
      ? album.albumLinks
      : Array.isArray(album?.related_links)
      ? album.related_links
      : [];

    return rawLinks
      .map((link, index) => ({
        id: link?.id ?? `album-link-${index}-${String(link?.url ?? '').trim()}`,
        type: link?.type ?? '',
        provider: link?.provider ?? '',
        title: link?.title ?? '',
        url: String(link?.url ?? '').trim(),
      }))
      .filter((link) => link.url !== '' || albumLinkTitle(link).trim() !== '')
      .sort((a, b) => {
        const aType = String(a?.type ?? '').toLowerCase();
        const bType = String(b?.type ?? '').toLowerCase();
        const aRank = aType === 'official' ? 0 : 1;
        const bRank = bType === 'official' ? 0 : 1;
        if (aRank !== bRank) return aRank - bRank;
        return aType.localeCompare(bType, 'ja');
      });
  }, [album]);

  const editionVariants = useMemo(() => {
    const list = Array.isArray(album?.edition_variants) ? album.edition_variants : [];
    return list
      .map((variant) => ({
        id: Number(variant?.id ?? 0),
        public_id: String(variant?.public_id ?? '').trim(),
        edition: variant?.edition ?? '',
        catalog_number: variant?.catalog_number ?? '',
        catalog_number_display: variant?.catalog_number_display ?? '',
        release_date: variant?.release_date ?? '',
      }))
      .filter((variant) => Number.isFinite(variant.id) && variant.id > 0)
      .sort((a, b) => {
        const aEdition = copyValue(a.edition);
        const bEdition = copyValue(b.edition);
        const aBlank = aEdition === '' || aEdition === '-';
        const bBlank = bEdition === '' || bEdition === '-';
        if (aBlank !== bBlank) return aBlank ? 1 : -1;
        return aEdition.localeCompare(bEdition, 'ja');
      });
  }, [album?.edition_variants]);

  const coverOptions = useMemo(() => normalizeAlbumCovers(album), [album]);
  const primaryCoverKey = useMemo(() => {
    const primary = coverOptions.find((cover) => cover.is_primary) ?? coverOptions[0];
    return primary?.key ?? '';
  }, [coverOptions]);
  const currentCover = useMemo(
    () => coverOptions.find((cover) => cover.key === selectedCoverKey) ?? coverOptions.find((cover) => cover.key === primaryCoverKey) ?? null,
    [coverOptions, selectedCoverKey, primaryCoverKey]
  );
  const tagCover = useMemo(
    () => coverOptions.find((cover) => cover.key === tagCoverKey) ?? currentCover,
    [coverOptions, tagCoverKey, currentCover]
  );
  const hasMultipleCovers = coverOptions.length > 1;

  useEffect(() => {
    if (coverOptions.length === 0) {
      setSelectedCoverKey('');
      setTagCoverKey('');
      return;
    }

    setSelectedCoverKey((prev) => (coverOptions.some((cover) => cover.key === prev) ? prev : primaryCoverKey));
    setTagCoverKey((prev) => (coverOptions.some((cover) => cover.key === prev) ? prev : primaryCoverKey));
  }, [coverOptions, primaryCoverKey]);
  const selectedEditionAlbumId = useMemo(() => {
    const hasCurrent = editionVariants.some((variant) => getAlbumRouteId(variant) === canonicalAlbumId);
    if (hasCurrent) return canonicalAlbumId;
    const first = editionVariants[0];
    return first ? getAlbumRouteId(first) : '';
  }, [canonicalAlbumId, editionVariants]);

  const handleEditionChange = useCallback(
    (event) => {
      const nextId = String(event.target.value ?? '').trim();
      if (nextId === '' || nextId === canonicalAlbumId) return;
      navigate(`/albums/${nextId}`);
    },
    [canonicalAlbumId, navigate]
  );

  const trackTotalByDisk = useMemo(() => {
    const map = {};
    for (const track of orderedTracks) {
      const disk = Number(track?.disk_number ?? 1);
      map[disk] = Math.max(map[disk] ?? 0, Number(track?.track_number ?? 0));
    }
    return map;
  }, [orderedTracks]);

  const discTotal = useMemo(() => Math.max(1, new Set(orderedTracks.map((t) => Number(t?.disk_number ?? 1))).size), [orderedTracks]);

  const discGroups = useMemo(() => {
    const map = new Map();
    for (const track of orderedTracks) {
      const disc = Number(track?.disk_number ?? 1);
      if (!map.has(disc)) map.set(disc, []);
      map.get(disc).push(track);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [orderedTracks]);

  const availableDiscNumbers = useMemo(() => {
    const values = Array.from(
      new Set(
        orderedTracks
          .map((track) => Number(track?.disk_number ?? 1))
          .filter((disc) => Number.isInteger(disc) && disc > 0)
      )
    ).sort((a, b) => a - b);
    return values;
  }, [orderedTracks]);

  const buildTagRowsFromPickedFiles = useCallback(
    async (pickedItems, options = {}) => {
      const preferredDisc = Number(options?.preferredDisc ?? 0);
      const hasPreferredDisc = Number.isInteger(preferredDisc) && preferredDisc > 0;
      const candidateTracks = hasPreferredDisc
        ? orderedTracks.filter((track) => Number(track?.disk_number ?? 1) === preferredDisc)
        : orderedTracks;
      const sourceTracks = candidateTracks.length > 0 ? candidateTracks : orderedTracks;
      const files = await Promise.all(pickedItems.map((item) => item.handle.getFile()));
      const rows = [];
      const usedTrackIds = new Set();

      for (let i = 0; i < pickedItems.length; i++) {
        const picked = pickedItems[i];
        const file = files[i];
        if (!/\.(mp3|flac|m4a)$/i.test(file.name)) continue;

        let trackId = '';
        const guessed = extractDiscTrackFromFilename(file.name);
        if (guessed.track != null) {
          const expectedDisc = guessed.disc == null && hasPreferredDisc ? preferredDisc : guessed.disc;
          const match =
            sourceTracks.find(
              (track) =>
                Number(track?.track_number ?? 0) === guessed.track &&
                (expectedDisc == null || Number(track?.disk_number ?? 1) === expectedDisc) &&
                !usedTrackIds.has(String(track.id))
            ) ||
            sourceTracks.find(
              (track) =>
                Number(track?.track_number ?? 0) === guessed.track &&
                (expectedDisc == null || Number(track?.disk_number ?? 1) === expectedDisc)
            );

          if (match) {
            trackId = String(match.id);
            usedTrackIds.add(String(match.id));
          }
        }

        if (!trackId) {
          const next = sourceTracks.find((track) => !usedTrackIds.has(String(track.id)));
          if (next) {
            trackId = String(next.id);
            usedTrackIds.add(String(next.id));
          }
        }

        rows.push({
          key: `${picked.relativePath || file.name}-${file.size}-${Date.now()}-${i}`,
          handle: picked.handle,
          directoryHandle: picked.directoryHandle ?? null,
          originalName: picked.fileName || file.name,
          name: file.name,
          relativePath: picked.relativePath || file.name,
          size: file.size,
          trackId,
          status: 'pending',
          message: trackId ? '待機中' : 'トラック未割り当て',
        });
      }

      return rows;
    },
    [orderedTracks]
  );

  const editionText = useMemo(() => copyValue(album?.edition), [album?.edition]);
  const hasEdition = editionText !== '' && editionText !== '-';
  const hasCoverImage = Boolean(currentCover?.url);
  const coverMetaText = useMemo(() => {
    const width = Number(currentCover?.meta?.width ?? 0);
    const height = Number(currentCover?.meta?.height ?? 0);
    const bytes = Number(currentCover?.meta?.bytes ?? 0);
    const parts = [];
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      parts.push(`${width}x${height}px`);
    }
    if (Number.isFinite(bytes) && bytes > 0) {
      parts.push(formatFileSize(bytes));
    }
    return parts.join(' / ');
  }, [currentCover?.meta?.bytes, currentCover?.meta?.height, currentCover?.meta?.width]);
  const coverCopyrightText = useMemo(() => {
    const label = copyValue(album?.label);
    return hasCoverImage && label !== '' ? '(C) ' + label : '';
  }, [album?.label, hasCoverImage]);
  const hasMultipleEditionVariants = editionVariants.length > 1;
  const seriesName = useMemo(() => String(album?.series?.name ?? '').trim(), [album?.series?.name]);
  const shouldShowSeries = Boolean(album?.series?.id) && seriesName !== '';
  const contentName = useMemo(() => String(album?.content?.name ?? '').trim(), [album?.content?.name]);
  const shouldShowContent = Boolean(album?.content?.id) && contentName !== '';
  const shouldShowEditionInAlbumNameOption = hasEdition;
  const albumTitleForTags = useMemo(
    () => buildAlbumTitleWithEdition(album, includeEditionInAlbumName),
    [album, includeEditionInAlbumName]
  );

  useEffect(() => {
    if (!album?.id) return;
    setEmbedCover(hasCoverImage);
    setRenameOnWrite(true);
    setIncludeEditionInAlbumName(hasEdition && !hasMultipleEditionVariants);
  }, [album?.id, hasCoverImage, hasEdition, hasMultipleEditionVariants]);

  const albumTitleText = useMemo(() => copyValue(album?.title), [album?.title]);
  const titleContextText = useMemo(() => copyValue(album?.title_context), [album?.title_context]);
  const albumCommentText = useMemo(() => copyValue(album?.comment), [album?.comment]);
  const catalogNumberText = useMemo(
    () => copyValue(album?.catalog_number_display) || copyValue(album?.catalog_number),
    [album?.catalog_number, album?.catalog_number_display]
  );

  const albumTitleEditionText = useMemo(() => {
    const title = copyValue(album?.title);
    if (title && hasEdition) return `${title} [${editionText}]`;
    if (title) return title;
    if (hasEdition) return `[${editionText}]`;
    return '';
  }, [album?.title, editionText, hasEdition]);


  const renderCopyIcon = (text, token, label, tooltip = `${label}をコピー`) => {
    const copied = copiedToken === token;
    return (
      <button
        type="button"
        disabled={!text}
        onClick={() => writeClipboard(text, token)}
        className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        title={tooltip}
        aria-label={tooltip}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    );
  };
  const renderTrackField = (value, token, label) => {
    const text = showValue(value);
    const clip = text === '-' ? '' : text;
    return (
      <div className="flex items-start justify-between gap-2">
        <span className="break-words">{text}</span>
        {renderCopyIcon(clip, token, label)}
      </div>
    );
  };

  const renderLinkedPeopleField = (value, token, label, role) => {
    const list = toPeopleList(value);
    const text = list.map((x) => x.name).join(', ');
    return (
      <div className="inline-flex max-w-full items-start gap-2">
        <span className="min-w-0 break-words text-left">
          {list.length === 0 && '-'}
          {list.map((person, idx) => (
            <span key={`${token}-${person.id ?? 'text'}-${idx}`}>
              {person.id ? (
                <Link
                  to={getArtistTracksRoutePath(person, role)}
                  className="text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                >
                  {person.name}
                </Link>
              ) : (
                person.name
              )}
              {idx < list.length - 1 && ', '}
            </span>
          ))}
        </span>
        {renderCopyIcon(text, token, label)}
      </div>
    );
  };

  const handleSelectFiles = async () => {
    if (!support.supported) return setTagError(support.reason);
    if (!workerReady) return setTagError('タグ書き込みエンジンを準備中です。しばらく待って再実行してください。');
    if (orderedTracks.length === 0) return setTagError('トラック情報がないため、タグ書き込みができません。');
    setTagError('');
    setTagMessage('');
    setTagProgress(0);
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        excludeAcceptAllOption: true,
        types: [{ description: 'Audio files', accept: { 'audio/mpeg': ['.mp3'], 'audio/flac': ['.flac'], 'audio/mp4': ['.m4a'] } }],
      });
      const rows = await buildTagRowsFromPickedFiles(
        handles.map((handle) => ({
          handle,
          directoryHandle: null,
          fileName: handle.name,
          relativePath: handle.name,
        }))
      );
      if (rows.length === 0) return setTagError('対応形式のファイルが選択されていません。');
      setTagFiles(rows);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error(e);
        setTagError('ファイル選択に失敗しました。');
      }
    }
  };

  const handleSelectFolder = async () => {
    if (!support.supported) return setTagError(support.reason);
    if (!workerReady) return setTagError('タグ書き込みエンジンを準備中です。しばらく待って再実行してください。');
    if (orderedTracks.length === 0) return setTagError('トラック情報がないため、タグ書き込みができません。');
    if (typeof window.showDirectoryPicker !== 'function') {
      return setTagError('このブラウザではフォルダ選択に対応していません。');
    }

    setTagError('');
    setTagMessage('');
    setTagProgress(0);
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const picked = await collectAudioFilesFromDirectory(dirHandle);
      if (picked.length === 0) {
        return setTagError('フォルダ内に対応形式の音声ファイルが見つかりませんでした。');
      }

      let preferredDisc = null;
      if (availableDiscNumbers.length > 1) {
        const defaultDisc = String(availableDiscNumbers[0]);
        const answer = window.prompt(
          `このアルバムは複数ディスクです。\nフォルダ内ファイルを割り当てるディスク番号を入力してください。\n選択可能: ${availableDiscNumbers.join(', ')}`,
          defaultDisc
        );
        if (answer === null) {
          setTagMessage('ディスク番号の選択をキャンセルしました。');
          return;
        }

        const selectedDisc = Number(String(answer).trim());
        if (!Number.isInteger(selectedDisc) || !availableDiscNumbers.includes(selectedDisc)) {
          setTagError(`ディスク番号は ${availableDiscNumbers.join(', ')} のいずれかを入力してください。`);
          return;
        }
        preferredDisc = selectedDisc;
      }

      const rows = await buildTagRowsFromPickedFiles(picked, { preferredDisc });
      if (rows.length === 0) {
        return setTagError('フォルダ内に対応形式の音声ファイルが見つかりませんでした。');
      }
      setTagFiles(rows);
      setTagMessage(
        `${rows.length}件のファイルを読み込みました。${preferredDisc ? `（Disc ${preferredDisc} で自動割り当て）` : ''}`
      );
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error(e);
        setTagError('フォルダ選択に失敗しました。');
      }
    }
  };

  const loadCoverArtwork = async () => {
    const coverUrl = String(tagCover?.url ?? '').trim();
    if (!embedCover || coverUrl === '') return null;

    const candidates = [];
    try {
      const parsed = new URL(coverUrl, window.location.origin);
      if (/^\/(images|storage)\//.test(parsed.pathname)) {
        candidates.push(new URL(`${parsed.pathname}${parsed.search}`, window.location.origin).toString());
      }
      candidates.push(parsed.toString());
    } catch {
      candidates.push(coverUrl);
    }

    const uniqueUrls = [...new Set(candidates)];
    let lastError = null;

    for (const url of uniqueUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        }

        const blob = await res.blob();
        if (blob.size > MAX_ARTWORK_BYTES) {
          throw new Error('\u30b8\u30e3\u30b1\u30c3\u30c8\u753b\u50cf\u304c\u5927\u304d\u3059\u304e\u307e\u3059\u3002MB\u4ee5\u4e0b\u306b\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
        }

        return { mimeType: blob.type || 'image/jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
      } catch (e) {
        lastError = e;
      }
    }

    throw new Error(
      `\u30b8\u30e3\u30b1\u30c3\u30c8\u753b\u50cf\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002CORS\u307e\u305f\u306f\u753b\u50cfURL\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002 (${lastError?.message || 'Failed to fetch'})`
    );
  };
  const handleWriteTags = async () => {
    if (isWriting) return;
    if (!workerReady) return setTagError('タグ書き込みエンジンを準備中です。しばらく待って再実行してください。');
    if (tagFiles.length === 0) return setTagError('先にファイルを選択してください。');
    const targets = tagFiles.filter((f) => f.trackId);
    if (targets.length === 0) return setTagError('少なくとも1件はトラックを割り当ててください。');

    setTagError('');
    setTagMessage('書き込みを開始します...');
    setTagProgress(0);
    setIsWriting(true);
    const outputAlbumFolderName = sanitizeFileName(copyValue(album?.title)) || `album-${id}`;
    const albumTitleForWrite = albumTitleForTags || copyValue(album?.title);

    const singleFileSavePlans = new Map();
    if (renameOnWrite) {
      const singleFileRows = tagFiles.filter((f) => f.trackId && !f.directoryHandle);
      if (singleFileRows.length > 0) {
        if (typeof window.showSaveFilePicker !== 'function') {
          setTagError('このブラウザは単体ファイル選択時のリネーム保存ダイアログに対応していません。');
          setIsWriting(false);
          return;
        }

        const reservedNames = new Set();
        for (const row of singleFileRows) {
          const track = orderedTracks.find((t) => String(t.id) === String(row.trackId));
          if (!track) continue;

          const context = buildRenameContext(album, track, releaseYear, albumTitleForWrite);
          const rendered = renderRenameTemplate(renamePattern, context);
          const sanitized = sanitizeFileName(rendered);
          if (!sanitized) {
            setTagError(`リネーム結果が空です（${row.name}）。リネーム形式を見直してください。`);
            setIsWriting(false);
            return;
          }

          const ext = row.name.includes('.') ? `.${row.name.split('.').pop()}` : '';
          const desiredName = `${sanitized}${ext}`;
          let suggestedName = desiredName;
          let suffixApplied = false;

          if (reservedNames.has(suggestedName.toLowerCase())) {
            const dotIndex = desiredName.lastIndexOf('.');
            const baseName = dotIndex > 0 ? desiredName.slice(0, dotIndex) : desiredName;
            const extName = dotIndex > 0 ? desiredName.slice(dotIndex) : '';
            let index = 1;
            while (reservedNames.has(`${baseName} (${index})${extName}`.toLowerCase())) {
              index += 1;
            }
            suggestedName = `${baseName} (${index})${extName}`;
            suffixApplied = true;
          }
          reservedNames.add(suggestedName.toLowerCase());

          setTagMessage(`${row.name} の保存先を選択してください...`);
          try {
            const saveHandle = await window.showSaveFilePicker({
              suggestedName,
              excludeAcceptAllOption: true,
              types: [{ description: 'Audio files', accept: { 'audio/mpeg': ['.mp3'], 'audio/flac': ['.flac'], 'audio/mp4': ['.m4a'] } }],
            });
            singleFileSavePlans.set(row.key, {
              saveHandle,
              suggestedName,
              suffixApplied,
            });
          } catch (pickerError) {
            if (pickerError?.name === 'AbortError') {
              singleFileSavePlans.set(row.key, {
                skipReason: '保存先選択をキャンセルしたためスキップ',
              });
            } else {
              const detail = pickerError instanceof Error ? pickerError.message : String(pickerError ?? '');
              singleFileSavePlans.set(row.key, {
                skipReason: `保存ダイアログを開けなかったためスキップ${detail ? ` (${detail})` : ''}`,
              });
            }
          }
        }
      }
    }

    let artwork = null;
    try {
      artwork = await loadCoverArtwork();
    } catch (e) {
      setTagError(e.message);
      setIsWriting(false);
      return;
    }

    let done = 0;
    for (const row of tagFiles) {
      if (!row.trackId) {
        updateTagFile(row.key, { status: 'skipped', message: 'トラック未割り当てのためスキップ' });
        continue;
      }
      const track = orderedTracks.find((t) => String(t.id) === String(row.trackId));
      if (!track) {
        updateTagFile(row.key, { status: 'error', message: '割り当てトラックが見つかりません' });
        done += 1;
        setTagProgress(Math.round((done / targets.length) * 100));
        continue;
      }
      updateTagFile(row.key, { status: 'processing', message: '書き込み中...' });
      setTagMessage(`${row.name} を処理中...`);
      try {
        const permissionMode = renameOnWrite && !row.directoryHandle ? 'read' : 'readwrite';
        const permission = await row.handle.requestPermission?.({ mode: permissionMode });
        if (permission && permission !== 'granted') {
          throw new Error(permissionMode === 'read' ? '読み取り権限が許可されませんでした。' : '書き込み権限が許可されませんでした。');
        }
        const file = await row.handle.getFile();
        const fileBuffer = await file.arrayBuffer();
        const tags = buildTagPayload(album, track, releaseYear, trackTotalByDisk, discTotal, albumTitleForWrite);
        const result = await callWorker(
          'WRITE_TAGS',
          { fileBytes: fileBuffer, fileName: file.name, tags, artwork: artwork ? { mimeType: artwork.mimeType, bytes: artwork.bytes.slice() } : null },
          (payload) => setTagMessage(`${row.name}: ${payload?.message ?? '書き込み中...'}`),
          [fileBuffer]
        );
        const outputBytes = result?.fileBytes instanceof Uint8Array ? result.fileBytes : new Uint8Array(result?.fileBytes ?? []);
        let renamedTo = '';
        let renameSkippedReason = '';
        let renameSuffixApplied = false;
        let writeSkipped = false;
        let outputHandle = row.handle;
        let outputDirectoryHandle = row.directoryHandle ?? null;
        let outputName = row.name;
        let outputRelativePath = row.relativePath || row.name;
        let outputLocationMessage = '';

        if (row.directoryHandle) {
          const dirPermission = await row.directoryHandle.requestPermission?.({ mode: 'readwrite' });
          if (dirPermission && dirPermission !== 'granted') {
            throw new Error('保存先フォルダの書き込み権限が許可されませんでした。');
          }

          let desiredOutputName = row.name;
          if (renameOnWrite) {
            const context = buildRenameContext(album, track, releaseYear, albumTitleForWrite);
            const rendered = renderRenameTemplate(renamePattern, context);
            const sanitized = sanitizeFileName(rendered);

            if (!sanitized) {
              throw new Error('リネーム結果が空です。リネーム形式を見直してください。');
            }

            const ext = row.name.includes('.') ? `.${row.name.split('.').pop()}` : '';
            desiredOutputName = `${sanitized}${ext}`;
          }

          const outputDir = await row.directoryHandle.getDirectoryHandle(outputAlbumFolderName, { create: true });
          const targetName = await resolveUniqueFileName(outputDir, desiredOutputName, '');
          if (targetName !== desiredOutputName) {
            renameSuffixApplied = true;
          }

          const targetHandle = await outputDir.getFileHandle(targetName, { create: true });
          const writable = await targetHandle.createWritable();
          await writable.write(outputBytes);
          await writable.close();

          outputHandle = targetHandle;
          outputDirectoryHandle = outputDir;
          outputName = targetName;
          if (renameOnWrite && targetName.toLowerCase() !== String(row.name ?? '').toLowerCase()) {
            renamedTo = targetName;
          }

          const normalizedRelative = String(row.relativePath || row.name || '').replace(/\\/g, '/');
          const slashIndex = normalizedRelative.lastIndexOf('/');
          const parentPath = slashIndex >= 0 ? normalizedRelative.slice(0, slashIndex) : '';
          outputRelativePath = parentPath
            ? `${parentPath}/${outputAlbumFolderName}/${targetName}`
            : `${outputAlbumFolderName}/${targetName}`;
          outputLocationMessage = ` / 出力先: ${outputRelativePath}`;
        } else if (renameOnWrite) {
          const context = buildRenameContext(album, track, releaseYear, albumTitleForWrite);
          const rendered = renderRenameTemplate(renamePattern, context);
          const sanitized = sanitizeFileName(rendered);

          if (!sanitized) {
            throw new Error('リネーム結果が空です。リネーム形式を見直してください。');
          }

          const ext = row.name.includes('.') ? `.${row.name.split('.').pop()}` : '';
          const desiredName = `${sanitized}${ext}`;
          const plan = singleFileSavePlans.get(row.key);
          if (!plan) {
            renameSkippedReason = '保存先情報が見つからないためスキップ';
            writeSkipped = true;
          } else if (plan.skipReason) {
            renameSkippedReason = plan.skipReason;
            writeSkipped = true;
          } else {
            const writable = await plan.saveHandle.createWritable();
            await writable.write(outputBytes);
            await writable.close();
            outputHandle = plan.saveHandle;
            outputDirectoryHandle = null;
            outputName = plan.saveHandle.name || plan.suggestedName || desiredName;
            outputRelativePath = outputName;
            outputLocationMessage = ` / 出力先: ${outputName}`;
            renamedTo = outputName;
            renameSuffixApplied = Boolean(plan.suffixApplied);
          }
        } else {
          const writable = await row.handle.createWritable();
          await writable.write(outputBytes);
          await writable.close();
        }

        const warningCount = Array.isArray(result?.warnings) ? result.warnings.length : 0;
        const renameMessage = renamedTo
          ? ` / リネーム: ${renamedTo}${renameSuffixApplied ? '（同名のため連番付与）' : ''}`
          : renameSkippedReason
            ? ` / ${renameSkippedReason}`
            : '';
        const outConflictMessage =
          row.directoryHandle && !renameOnWrite && renameSuffixApplied
            ? ` / 出力名調整: ${outputName}（同名のため連番付与）`
            : '';
        updateTagFile(row.key, {
          handle: outputHandle,
          directoryHandle: outputDirectoryHandle,
          name: outputName,
          originalName: outputName,
          relativePath: outputRelativePath,
          status: writeSkipped ? 'skipped' : warningCount > 0 || Boolean(renameSkippedReason) ? 'warning' : 'success',
          message:
            writeSkipped
              ? `スキップ${renameMessage}${outputLocationMessage}`
              : warningCount > 0
              ? `完了（警告 ${warningCount} 件）${renameMessage}${outConflictMessage}${outputLocationMessage}`
              : `書き込み完了${renameMessage}${outConflictMessage}${outputLocationMessage}`,
        });
      } catch (e) {
        updateTagFile(row.key, { status: 'error', message: e.message || '書き込みに失敗しました' });
      }
      done += 1;
      setTagProgress(Math.round((done / targets.length) * 100));
    }
    setTagMessage('タグ書き込みが完了しました。');
    setIsWriting(false);
  };

  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
  const albumArtistName = String(album?.album_artist?.name ?? '').trim();
  const unitMembers = useMemo(() => toPeopleList(album?.album_artist_members), [album?.album_artist_members]);
  const shouldLinkAlbumArtist =
    Boolean(album?.album_artist?.id) && albumArtistName.toLowerCase() !== 'various artists';
  const shouldShowUnitMembers = unitMembers.length > 0;
  const shouldShowRelatedLinks = Boolean(album) && !loading && !error;
  const informationUpdatedAtText = useMemo(
    () => formatInfoTimestamp(album?.information_updated_at),
    [album?.information_updated_at]
  );

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
      <div className="mx-auto mb-3 flex max-w-7xl items-center justify-between gap-2 lg:justify-start">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={primaryButtonClass}
        >
          一覧へ戻る
        </button>
      </div>

      <div className={`${pageCardClass} max-w-7xl`}>
        <div className="mb-6 grid grid-cols-1 gap-5 items-start lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className={`${panelClass} w-fit justify-self-start`}>
            <div className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {currentCover?.url ? (
                <img
                  src={currentCover.url}
                  alt={album.title ?? 'album cover'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-300">No Image</span>
              )}
            </div>
            {(coverMetaText || coverCopyrightText) && (
              <div className="mt-1 flex items-start justify-between gap-3 text-[10px] leading-tight text-gray-400 dark:text-gray-500">
                <div className="min-w-0 flex-1 text-left">{coverMetaText && <p>{coverMetaText}</p>}</div>
                <div className="shrink-0 text-right">{coverCopyrightText && <p>{coverCopyrightText}</p>}</div>
              </div>
            )}
            {hasMultipleCovers && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {coverOptions.map((cover, index) => {
                  const selected = currentCover?.key === cover.key;
                  const label = coverOptionLabel(cover, index);
                  return (
                    <button
                      key={cover.key}
                      type="button"
                      onClick={() => setSelectedCoverKey(cover.key)}
                      className="text-left"
                      title={label}
                    >
                      <div
                        className={[
                          'aspect-square overflow-hidden rounded-lg border bg-gray-100 dark:bg-gray-700',
                          selected
                            ? 'border-sky-500 ring-2 ring-sky-300/70 dark:border-sky-400 dark:ring-sky-500/40'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500',
                        ].join(' ')}
                      >
                        <img src={cover.url} alt={label} className="h-full w-full object-cover" />
                      </div>
                      <span className="mt-1 block truncate text-[10px] text-gray-500 dark:text-gray-300">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className={`${panelClass} space-y-2 text-sm text-gray-700 dark:text-gray-200`}>
            <div className="flex flex-wrap items-start gap-2 min-w-0 border-b border-gray-200/70 dark:border-gray-700/70 pb-2">
              <h1 className="text-xl sm:text-2xl font-bold break-words min-w-0">{album?.title ?? `アルバム ID: ${id}`}</h1>
              <div className="inline-flex items-center gap-2 shrink-0 flex-wrap">
                {hasEdition &&
                  (editionVariants.length > 1 ? (
                    <label className="inline-flex items-center text-sm shrink-0">
                      <select
                        value={selectedEditionAlbumId}
                        onChange={handleEditionChange}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
                      >
                        {editionVariants.map((variant) => (
                          <option key={variant.public_id || variant.id} value={getAlbumRouteId(variant)}>
                            {albumEditionOptionLabel(variant)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className="text-sm shrink-0">{editionText}</span>
                  ))}
                {renderCopyIcon(albumTitleText, 'album-title', 'アルバム名', 'アルバム名をコピー')}
                {hasEdition && renderCopyIcon(albumTitleEditionText, 'album-title-edition', 'アルバム名+形態', 'アルバム名+形態をコピー')}
              </div>
            </div>

            {(titleContextText !== '' || albumCommentText !== '') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {titleContextText !== '' && (
                  <div className="border-b border-gray-200/70 py-1 text-sm font-semibold leading-relaxed text-gray-700 dark:border-gray-700/70 dark:text-gray-100">
                    {titleContextText}
                  </div>
                )}
                {albumCommentText !== '' && (
                  <div className="border-b border-gray-200/70 py-1 text-sm font-semibold leading-relaxed text-gray-700 dark:border-gray-700/70 dark:text-gray-100 whitespace-pre-wrap break-words">
                    {albumCommentText}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
              <span className="text-left text-gray-500 dark:text-gray-300">アルバムアーティスト</span>
              <div className="inline-flex max-w-full items-start gap-2">
                {shouldLinkAlbumArtist ? (
                  <Link
                    to={getArtistAlbumsRoutePath(album.album_artist)}
                    className="min-w-0 break-words text-left text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                  >
                    {showValue(albumArtistName)}
                  </Link>
                ) : (
                  <span className="min-w-0 break-words text-left">{showValue(albumArtistName)}</span>
                )}
                {renderCopyIcon(copyValue(album?.album_artist?.name), 'album-artist', 'アルバムアーティスト')}
              </div>
            </div>

            {shouldShowUnitMembers && (
              <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">ユニットメンバー</span>
                {renderLinkedPeopleField(unitMembers, 'album-unit-members', 'ユニットメンバー', 'vocal')}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">発売日</span>
                <div className="inline-flex max-w-full items-start gap-2 flex-wrap">
                  <span className="min-w-0 break-words text-left">{showValue(formatDateDisplay(album?.release_date))}</span>
                  <div className="inline-flex items-center gap-2 flex-wrap">
                    {renderCopyIcon(copyValue(album?.release_date), 'album-release-date', '発売日', '発売日をコピー')}
                    {renderCopyIcon(copyValue(releaseYear), 'album-release-year', 'リリース年', 'リリース年のみコピー')}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">レーベル</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(album?.label)}</span>
                  {renderCopyIcon(copyValue(album?.label), 'album-label', 'レーベル')}
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">規格品番</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(catalogNumberText)}</span>
                  {renderCopyIcon(catalogNumberText, 'album-catalog', '規格品番')}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">JAN</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(album?.jan)}</span>
                  {renderCopyIcon(copyValue(album?.jan), 'album-jan', 'JAN')}
                </div>
              </div>
            </div>
            {shouldShowSeries && (
              <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">シリーズ</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <Link
                    to={`/series/${album.series.public_id ?? album.series.id}/albums`}
                    className="min-w-0 break-words text-left text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                  >
                    {showValue(seriesName)}
                  </Link>
                  {renderCopyIcon(copyValue(seriesName), 'album-series', 'シリーズ')}
                </div>
              </div>
            )}
            {shouldShowContent && (
              <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">コンテンツ</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(contentName)}</span>
                  {renderCopyIcon(copyValue(contentName), 'album-content', 'コンテンツ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {shouldShowRelatedLinks && (
          <div className="mb-6 rounded border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-start gap-3">
              <h2 className="shrink-0 pt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">関連リンク</h2>
              {albumLinks.length > 0 ? (
                <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
                  {albumLinks.map((link) => (
                    <li key={link.id} className="inline-flex items-center gap-2 rounded border border-gray-200 dark:border-gray-700 px-2 py-1">
                      <span className="inline-flex items-center rounded border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                        {albumLinkTypeLabel(link.type)}
                      </span>
                      {link.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-sky-400 hover:underline break-all"
                        >
                          {albumLinkTitle(link)}
                        </a>
                      ) : (
                        <span className="break-all text-gray-700 dark:text-gray-200">{albumLinkTitle(link)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="min-w-0 flex-1 pt-1 text-sm text-gray-500 dark:text-gray-300">関連リンクはありません。</div>
              )}
            </div>
          </div>
        )}


        <div className="rounded border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <h2 className="text-lg font-bold">このアルバム情報でタグを書き込み</h2>
            {support.supported && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectFiles}
                  disabled={!workerReady || isWriting}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-100/85 px-3 py-2 text-emerald-900 shadow-sm transition hover:bg-emerald-200/90 disabled:opacity-60 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/22"
                >
                  <File className="h-4 w-4" />
                  ファイル選択
                </button>
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  disabled={!workerReady || isWriting}
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-200/80 bg-violet-100/85 px-3 py-2 text-violet-900 shadow-sm transition hover:bg-violet-200/90 disabled:opacity-60 dark:border-violet-400/20 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/22"
                >
                  <FolderOpen className="h-4 w-4" />
                  フォルダ選択
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTagFiles([]);
                    setTagError('');
                    setTagMessage('');
                    setTagProgress(0);
                    setIsTagOptionExpanded(false);
                  }}
                  disabled={isWriting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-3 py-2 text-slate-700 shadow-sm transition hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  <RotateCcw className="w-4 h-4" />
                  リセット
                </button>
              </div>
            )}
          </div>

          {support.supported && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsTagOptionExpanded((prev) => !prev)}
                disabled={isWriting}
                className="inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-60"
              >
                {shouldShowTagOptionDetails ? '▲ 詳細設定を閉じる' : '▼ 詳細設定を開く'}
              </button>
            </div>
          )}

          {support.supported && shouldShowTagOptionDetails && (
            <>
              <div className="mt-3 flex flex-col items-start gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={embedCover}
                    onChange={(e) => setEmbedCover(e.target.checked)}
                    disabled={!hasCoverImage || isWriting}
                  />
                  ジャケット画像を埋め込む（2MBまで）
                </label>

                {embedCover && hasMultipleCovers && (
                  <label className="flex w-full max-w-xs flex-col gap-1 text-sm">
                    <span>{'\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u306b\u4f7f\u3046\u30b8\u30e3\u30b1\u30c3\u30c8'}</span>
                    <select
                      value={tagCover?.key ?? ''}
                      onChange={(e) => setTagCoverKey(String(e.target.value ?? ''))}
                      disabled={isWriting}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                    >
                      {coverOptions.map((cover, index) => (
                        <option key={cover.key} value={cover.key}>
                          {coverOptionLabel(cover, index)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}



                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={renameOnWrite}
                    onChange={(e) => setRenameOnWrite(e.target.checked)}
                    disabled={isWriting}
                  />
                  タグ書き込み時にファイル名をリネームする
                </label>

                {shouldShowEditionInAlbumNameOption && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includeEditionInAlbumName}
                      onChange={(e) => setIncludeEditionInAlbumName(e.target.checked)}
                      disabled={isWriting}
                    />
                    アルバム名に形態を含める
                  </label>
                )}

                <input
                  type="text"
                  value={renamePattern}
                  onChange={(e) => setRenamePattern(e.target.value)}
                  disabled={!renameOnWrite || isWriting}
                  className="w-full max-w-xl px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 disabled:opacity-60"
                  placeholder="$num(%track%,2) %title%"
                />

                <div className="text-xs text-gray-600 dark:text-gray-300">
                  利用可能: `%track%`, `%disc%`, `%title%`, `%artist%`, `%album%`, `%album_artist%`,
                  `%year%`, `%catalog_number%` と `$num(%track%,2)` のようなゼロ埋め関数。
                </div>
                {renameOnWrite && (
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    単体ファイル選択時は、タグ書き込み開始後に曲数分の保存ダイアログが表示されます。キャンセルした曲はスキップされます。
                  </div>
                )}
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  フォルダ選択時は、各楽曲と同じ階層に「アルバム名」フォルダを作成し、その中へタグ書き込み済みファイルを出力します（元ファイルは保持）。
                </div>
              </div>

              <div className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
                ファイルが破損しても当サイトは一切の責任を負いません。必ず元のファイルをバックアップしてから実行してください。
              </div>
            </>
          )}

          {!support.supported && <div className="mt-3 text-sm text-amber-700">{support.reason}</div>}
          {workerError && <div className="mt-2 text-sm text-red-600">{workerError}</div>}
          {tagError && <div className="mt-2 text-sm text-red-600">{tagError}</div>}
          {tagMessage && <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">{tagMessage}</div>}

          {(isWriting || tagProgress > 0) && (
            <div className="mt-2 w-full h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${tagProgress}%` }} />
            </div>
          )}

          {support.supported && tagFiles.length > 0 && (
            <div className="mt-4">
              <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white/70 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/40">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700/80">
                      <th className="border-b border-r border-slate-200 px-2 py-2 text-left min-w-[260px] last:border-r-0 dark:border-slate-600">ファイル</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2 text-left min-w-[260px] last:border-r-0 dark:border-slate-600">割り当てトラック</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2 text-left min-w-[200px] last:border-r-0 dark:border-slate-600">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagFiles.map((f) => (
                      <tr key={f.key} className="align-top hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="border-b border-r border-slate-200 px-2 py-2 last:border-r-0 dark:border-slate-600">
                          <div className="font-medium">{f.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(f.size)}</div>
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-2 last:border-r-0 dark:border-slate-600">
                          <select
                            value={f.trackId}
                            disabled={isWriting}
                            onChange={(e) =>
                              updateTagFile(f.key, {
                                trackId: e.target.value,
                                status: 'pending',
                                message: e.target.value ? '待機中' : 'トラック未割り当て',
                              })
                            }
                            className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900 dark:border-gray-600"
                          >
                            <option value="">未割り当て</option>
                            {orderedTracks.map((t) => (
                              <option key={t.id} value={String(t.id)}>
                                Disc {t.disk_number ?? 1} / Tr {t.track_number ?? '-'}: {t.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-2 last:border-r-0 dark:border-slate-600">
                          <div className="font-semibold">{f.status}</div>
                          <div className="text-gray-700 dark:text-gray-300">{f.message}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleWriteTags}
                  disabled={!support.supported || !workerReady || isWriting || tagFiles.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isWriting ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />}
                  タグ書き込み
                </button>
              </div>
            </div>
          )}
        </div>

        {loading && <div className="text-sm text-gray-500">読み込み中...</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {!loading && !error && discGroups.length > 0 && (
          <div className="space-y-6">
            {discGroups.map(([discNo, tracks]) => (
              <section key={`disc-${discNo}`}>
                <h2 className="text-lg font-semibold mb-2">Disc {discNo}</h2>
                <div className="overflow-hidden rounded-lg border border-slate-200/70 bg-white/70 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/40">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-700/80">
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left w-16 last:border-r-0 dark:border-slate-600">Tr</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[220px] last:border-r-0 dark:border-slate-600">曲名</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[180px] last:border-r-0 dark:border-slate-600">アーティスト</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[180px] last:border-r-0 dark:border-slate-600">作詞</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[180px] last:border-r-0 dark:border-slate-600">作曲</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[180px] last:border-r-0 dark:border-slate-600">編曲</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[140px] last:border-r-0 dark:border-slate-600">ジャンル</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left w-24 last:border-r-0 dark:border-slate-600">時間</th>
                        <th className="border-b border-r border-slate-200 px-3 py-2 text-left min-w-[200px] last:border-r-0 dark:border-slate-600">コメント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track) => (
                        <tr key={track.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{showValue(track.track_number)}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{renderTrackField(track.title, `t-${track.id}-title`, '曲名')}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.vocal, `t-${track.id}-artist`, 'アーティスト', 'vocal')}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.lyricist, `t-${track.id}-lyricist`, '作詞', 'lyricist')}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.composer, `t-${track.id}-composer`, '作曲', 'composer')}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.arranger, `t-${track.id}-arranger`, '編曲', 'arranger')}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 whitespace-nowrap last:border-r-0 dark:border-slate-600">{renderTrackField(track.genre, `t-${track.id}-genre`, 'ジャンル')}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{showValue(track.duration)}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600">{renderTrackField(track.comment, `t-${track.id}-comment`, 'コメント')}</td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && !error && discGroups.length === 0 && (
          <div className="border px-3 py-6 text-center text-gray-600 dark:text-gray-300">トラック情報がありません</div>
        )}

        {!loading && !error && (
          <div className="mt-6 rounded border border-gray-200/70 bg-gray-50/60 px-3 py-3 text-xs text-gray-600 dark:border-gray-700/70 dark:bg-gray-900/20 dark:text-gray-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p>情報時点: {informationUpdatedAtText}</p>
                <p>誤りや不足がある場合のみ、参考URL付きで送信してください。</p>
              </div>
              <Link
                to={`/albums/${canonicalAlbumId}/correction-request`}
                className="inline-flex items-center justify-center self-start rounded border border-gray-300/80 bg-transparent px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-100/70 dark:border-gray-600/80 dark:text-gray-300 dark:hover:bg-gray-800/60"
              >
                修正依頼フォームへ
              </Link>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
