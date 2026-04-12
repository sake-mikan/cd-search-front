import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, File, FolderOpen, Loader2, Moon, RotateCcw, Sun, WandSparkles } from 'lucide-react';
import { buildApiUrl } from "../api/baseUrl";
import SiteFooter from "../components/SiteFooter";
import SiteBrandHeader from '../components/SiteBrandHeader';
import TrackList from '../components/TrackList';
import { formatInfoTimestamp } from "../utils/formatDateTime";
import { formatDateDisplay } from "../utils/formatDateDisplay";
import { getAlbumRouteId, getAlbumRoutePath } from "../utils/albumPublicId";
import { getArtistAlbumsRoutePath, getArtistTracksRoutePath } from "../utils/artistPublicId";
import { formatReleaseTypeLabel } from '../utils/releaseTypeLabel';
import {
  PageBackdrop,
  floatingThemeButtonClass,
  mobileThemeButtonClass,
  pageCardClass,
  heroPanelClass,
  panelClass,
  pageShellClass,
  primaryButtonClass,
} from '../utils/uiTheme';

const MAX_ARTWORK_BYTES = 2 * 1024 * 1024;

function detectTagWriteSupport() {
  if (typeof window === 'undefined') return { supported: false, reason: '\u3053\u306e\u74b0\u5883\u3067\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093\u3002' };

  const hasOpenPicker = typeof window.showOpenFilePicker === 'function';
  const hasWritable =
    typeof window.FileSystemFileHandle !== 'undefined' &&
    typeof window.FileSystemFileHandle.prototype?.createWritable === 'function';

  const ua = navigator.userAgent;
  const isCriOS = /CriOS/i.test(ua);
  const isEdgiOS = /EdgiOS/i.test(ua);
  const isChromeDesktop = /Chrome|Chromium|Edg\//i.test(ua);
  const isChromiumFamily = isChromeDesktop || isCriOS || isEdgiOS;
  const isSafari = /Safari/i.test(ua) && !isChromiumFamily && !/FxiOS/i.test(ua);

  if (isSafari) return { supported: false, reason: '\u0053\u0061\u0066\u0061\u0072\u0069\u7cfb\u30d6\u30e9\u30a6\u30b6\u3067\u306f\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002\u0043\u0068\u0072\u006f\u006d\u0065\u307e\u305f\u306f\u0045\u0064\u0067\u0065\u3092\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002' };
  if (!isChromiumFamily) return { supported: false, reason: '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u306f\u0043\u0068\u0072\u006f\u006d\u0065\u0020\u002f\u0020\u0045\u0064\u0067\u0065\u7cfb\u30d6\u30e9\u30a6\u30b6\u3067\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002' };
  if (!hasOpenPicker || !hasWritable) return { supported: false, reason: '\u3053\u306e\u30d6\u30e9\u30a6\u30b6\u3067\u306f\u30ed\u30fc\u30ab\u30eb\u30d5\u30a1\u30a4\u30eb\u3078\u306e\u76f4\u63a5\u66f8\u304d\u8fbc\u307f\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002\u0050\u0043\u7248\u0043\u0068\u0072\u006f\u006d\u0065\u307e\u305f\u306f\u0045\u0064\u0067\u0065\u3092\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002' };

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


function normalizeDiscType(value) {
  switch (String(value ?? '').trim().toLowerCase()) {
    case 'dvd':
      return 'dvd';
    case 'bd':
    case 'blu-ray':
    case 'bluray':
    case 'blu_ray':
      return 'bd';
    case 'other':
      return 'other';
    default:
      return 'cd';
  }
}

function inferDiscTypeFromTracks(tracks) {
  const combined = (Array.isArray(tracks) ? tracks : [])
    .flatMap((track) => {
      const displayTitle = String(track?.display_title ?? '').trim();
      const title = displayTitle || String(track?.title ?? '').trim();
      return [title, String(track?.comment ?? '').trim()];
    })
    .filter(Boolean)
    .join('\n');

  if (combined === '') return 'cd';
  if (/(?:blu[\s-]*ray|blu[\s-]*ray\s*disc|\bBD\b)/iu.test(combined)) return 'bd';
  if (/(?:\bDVD\b|music\s*video|\bMV\b|making)/iu.test(combined)) return 'dvd';
  return 'cd';
}

function buildDiscTypeMap(discs, tracks) {
  const map = new Map();

  if (Array.isArray(discs)) {
    discs.forEach((disc) => {
      const discNumber = Number(disc?.disc_number ?? disc?.disk_number ?? 0);
      if (!Number.isInteger(discNumber) || discNumber <= 0) return;
      map.set(discNumber, normalizeDiscType(disc?.disc_type));
    });
  }

  const grouped = new Map();
  for (const track of Array.isArray(tracks) ? tracks : []) {
    const discNumber = Number(track?.disk_number ?? 1);
    if (!Number.isInteger(discNumber) || discNumber <= 0) continue;
    if (!grouped.has(discNumber)) grouped.set(discNumber, []);
    grouped.get(discNumber).push(track);
  }

  grouped.forEach((discTracks, discNumber) => {
    if (!map.has(discNumber)) {
      map.set(discNumber, inferDiscTypeFromTracks(discTracks));
    }
  });

  return map;
}

function isNamedPersonObject(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (Object.prototype.hasOwnProperty.call(value, 'name') ||
        Object.prototype.hasOwnProperty.call(value, 'public_id') ||
        Object.prototype.hasOwnProperty.call(value, 'artist_type'))
  );
}

function toPeopleText(value) {
  if (value == null) return '';
  const list = Array.isArray(value)
    ? value
    : isNamedPersonObject(value)
      ? [value]
      : typeof value === 'object'
        ? Object.values(value)
        : [value];
  return list
    .map((x) => (typeof x === 'string' ? x : x?.name))
    .filter(Boolean)
    .join(', ');
}

function toPeopleList(value) {
  if (value == null) return [];
  const list = Array.isArray(value)
    ? value
    : isNamedPersonObject(value)
      ? [value]
      : typeof value === 'object'
        ? Object.values(value)
        : [value];
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

function formatEditionDisplay(editionValue, packageSpecValue) {
  const edition = copyValue(editionValue);
  const packageSpec = copyValue(packageSpecValue);

  if (edition !== '' && edition !== '-') {
    return packageSpec !== '' ? `${edition}（${packageSpec}）` : edition;
  }

  return packageSpec;
}

function albumEditionOptionLabel(variant) {
  const label = formatEditionDisplay(variant?.edition, variant?.package_spec);
  if (label !== '') {
    return label;
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

function buildOutputAlbumFolderName(baseName, discNumber, includeDiscNumber) {
  const fallbackBaseName = sanitizeFileName(baseName) || 'album';
  const resolvedDiscNumber = Number(discNumber);
  if (!includeDiscNumber || !Number.isInteger(resolvedDiscNumber) || resolvedDiscNumber <= 0) {
    return fallbackBaseName;
  }

  return sanitizeFileName(`${fallbackBaseName} [Disc${resolvedDiscNumber}]`) || fallbackBaseName;
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
  const [includeDiscNumberInFolderName, setIncludeDiscNumberInFolderName] = useState(false);
  const [includeEditionInAlbumName, setIncludeEditionInAlbumName] = useState(false);
  const [selectedCoverKey, setSelectedCoverKey] = useState('');
  const [tagCoverKey, setTagCoverKey] = useState('');
  const [renamePattern, setRenamePattern] = useState('$num(%track%,2) %title%');
  const [commentOpen, setCommentOpen] = useState(false);
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
        package_spec: variant?.package_spec ?? '',
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

  const discTypeMap = useMemo(() => buildDiscTypeMap(album?.discs, orderedTracks), [album?.discs, orderedTracks]);
  const taggableTracks = useMemo(
    () => orderedTracks.filter((track) => normalizeDiscType(discTypeMap.get(Number(track?.disk_number ?? 1))) === 'cd'),
    [discTypeMap, orderedTracks]
  );
  const taggableDiscNumbers = useMemo(() => {
    const values = Array.from(
      new Set(
        taggableTracks
          .map((track) => Number(track?.disk_number ?? 1))
          .filter((disc) => Number.isInteger(disc) && disc > 0)
      )
    ).sort((a, b) => a - b);
    return values;
  }, [taggableTracks]);
  const taggableTrackMap = useMemo(
    () => new Map(taggableTracks.map((track) => [String(track.id), track])),
    [taggableTracks]
  );
  const shouldShowDiscFolderNameOption = taggableDiscNumbers.length > 1;

  useEffect(() => {
    setIncludeDiscNumberInFolderName(shouldShowDiscFolderNameOption);
  }, [id, shouldShowDiscFolderNameOption]);

  const buildTagRowsFromPickedFiles = useCallback(
    async (pickedItems, options = {}) => {
      const preferredDisc = Number(options?.preferredDisc ?? 0);
      const hasPreferredDisc = Number.isInteger(preferredDisc) && preferredDisc > 0;
      const candidateTracks = hasPreferredDisc
        ? taggableTracks.filter((track) => Number(track?.disk_number ?? 1) === preferredDisc)
        : taggableTracks;
      const sourceTracks = candidateTracks.length > 0 ? candidateTracks : taggableTracks;
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
    [taggableTracks]
  );

  const editionText = useMemo(() => copyValue(album?.edition), [album?.edition]);
  const packageSpecText = useMemo(() => copyValue(album?.package_spec), [album?.package_spec]);
  const editionDisplayText = useMemo(() => formatEditionDisplay(editionText, packageSpecText), [editionText, packageSpecText]);
  const hasEdition = editionText !== '' && editionText !== '-';
  const hasEditionDisplay = editionDisplayText !== '' && editionDisplayText !== '-';
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
  const effectiveEditionVariants = useMemo(
    () => editionVariants.map((variant) => {
      const routeId = getAlbumRouteId(variant);
      return {
        ...variant,
        package_spec: copyValue(variant?.package_spec) || (routeId === canonicalAlbumId ? packageSpecText : ''),
      };
    }),
    [canonicalAlbumId, editionVariants, packageSpecText]
  );
  const currentEditionLabel = useMemo(() => {
    if (!hasMultipleEditionVariants) return editionDisplayText;
    const currentVariant = effectiveEditionVariants.find((variant) => getAlbumRouteId(variant) === selectedEditionAlbumId);
    return currentVariant ? albumEditionOptionLabel(currentVariant) : editionDisplayText;
  }, [editionDisplayText, effectiveEditionVariants, hasMultipleEditionVariants, selectedEditionAlbumId]);
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
  const releaseTypeText = useMemo(() => copyValue(formatReleaseTypeLabel(album?.release_type, album?.release_type_label)), [album?.release_type, album?.release_type_label]);
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


  const renderCopyIcon = (text, token, label, tooltip = `${label}\u3092\u30b3\u30d4\u30fc`) => {
    const normalized = copyValue(text);
    if (!normalized) return null;
    const copied = copiedToken === token;
    return (
      <button
        type="button"
        onClick={() => writeClipboard(normalized, token)}
        className="hidden md:inline-flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        title={tooltip}
        aria-label={tooltip}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    );
  };

  const renderTrackField = (value, token, label, allowCopy = true) => {
    const text = showValue(value);
    const clip = text === '-' ? '' : text;
    return (
      <div className="flex items-start justify-between gap-2">
        <span className="break-words">{text}</span>
        {allowCopy ? renderCopyIcon(clip, token, label) : null}
      </div>
    );
  };

  const renderLinkedPeopleField = (value, token, label, role, linkClass = linkedPeopleClass) => {
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
                  className={linkClass}
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

  const detailLabelClass = "text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";
  const detailTextClass = "text-base font-semibold text-slate-900 dark:text-slate-100";
  const detailValueWrapClass = "mt-1 flex min-w-0 items-start gap-2";
  const linkedPeopleClass = "text-sky-600 underline decoration-sky-400/60 underline-offset-4 transition hover:text-sky-700 dark:text-sky-300 dark:decoration-sky-400/60";
  const trackLinkedPeopleClass = "text-sky-600 underline decoration-sky-400/60 underline-offset-4 transition hover:text-sky-700 md:no-underline md:hover:underline md:focus-visible:underline dark:text-sky-300 dark:decoration-sky-400/60";

  const renderDetailTextCard = (label, value, token, tooltip = `${label}をコピー`) => (
    <div>
      <p className={detailLabelClass}>{label}</p>
      <div className={detailValueWrapClass}>
        <p className={`min-w-0 break-words ${detailTextClass}`}>{showValue(value)}</p>
        {renderCopyIcon(copyValue(value), token, label, tooltip)}
      </div>
    </div>
  );

  const renderDetailLinkedCard = (label, value, token, role, shouldLink = true) => {
    const list = toPeopleList(value);
    const text = list.map((x) => x.name).join(', ');

    return (
      <div>
        <p className={detailLabelClass}>{label}</p>
        <div className={detailValueWrapClass}>
          <p className={`min-w-0 break-words ${detailTextClass}`}>
            {list.length === 0 && '-'}
            {list.map((person, idx) => (
              <span key={`${token}-${person.id ?? 'text'}-${idx}`}>
                {shouldLink && person.id ? (
                  <Link
                    to={getArtistTracksRoutePath(person, role)}
                    className={linkedPeopleClass}
                  >
                    {person.name}
                  </Link>
                ) : (
                  person.name
                )}
                {idx < list.length - 1 && ', '}
              </span>
            ))}
          </p>
          {renderCopyIcon(text, token, label)}
        </div>
      </div>
    );
  };

  const renderAlbumArtistCard = () => (
    <div className="md:col-span-2">
      <p className={detailLabelClass}>アルバムアーティスト</p>
      <div className={detailValueWrapClass}>
        {shouldLinkAlbumArtist ? (
          <Link
            to={getArtistAlbumsRoutePath(album?.album_artist)}
            className={`min-w-0 break-words ${detailTextClass} ${linkedPeopleClass}`}
          >
            {showValue(albumArtistName)}
          </Link>
        ) : (
          <p className={`min-w-0 break-words ${detailTextClass}`}>{showValue(albumArtistName)}</p>
        )}
        {renderCopyIcon(copyValue(album?.album_artist?.name), 'album-artist', 'アルバムアーティスト')}
      </div>
    </div>
  );
  const handleSelectFiles = async () => {
    if (!support.supported) return setTagError(support.reason);
    if (!workerReady) return setTagError('\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u30a8\u30f3\u30b8\u30f3\u3092\u6e96\u5099\u4e2d\u3067\u3059\u3002\u3057\u3070\u3089\u304f\u5f85\u3063\u3066\u518d\u5b9f\u884c\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
    if (taggableTracks.length === 0) return setTagError('\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u5bfe\u8c61\u306eCD\u30c7\u30a3\u30b9\u30af\u304c\u3042\u308a\u307e\u305b\u3093\u3002');
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
      if (rows.length === 0) return setTagError('\u5bfe\u5fdc\u5f62\u5f0f\u306e\u30d5\u30a1\u30a4\u30eb\u304c\u9078\u629e\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002');
      setTagFiles(rows);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error(e);
        setTagError('\u30d5\u30a1\u30a4\u30eb\u9078\u629e\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002');
      }
    }
  };

  const handleSelectFolder = async () => {
    if (!support.supported) return setTagError(support.reason);
    if (!workerReady) return setTagError('\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u30a8\u30f3\u30b8\u30f3\u3092\u6e96\u5099\u4e2d\u3067\u3059\u3002\u3057\u3070\u3089\u304f\u5f85\u3063\u3066\u518d\u5b9f\u884c\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
    if (taggableTracks.length === 0) return setTagError('\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u5bfe\u8c61\u306eCD\u30c7\u30a3\u30b9\u30af\u304c\u3042\u308a\u307e\u305b\u3093\u3002');
    if (typeof window.showDirectoryPicker !== 'function') {
      return setTagError('\u3053\u306e\u30d6\u30e9\u30a6\u30b6\u3067\u306f\u30d5\u30a9\u30eb\u30c0\u9078\u629e\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002');
    }

    setTagError('');
    setTagMessage('');
    setTagProgress(0);
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const picked = await collectAudioFilesFromDirectory(dirHandle);
      if (picked.length === 0) {
        return setTagError('\u30d5\u30a9\u30eb\u30c0\u5185\u306b\u5bfe\u5fdc\u5f62\u5f0f\u306e\u97f3\u58f0\u30d5\u30a1\u30a4\u30eb\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002');
      }

      if (taggableDiscNumbers.length === 0) {
        return setTagError('\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u5bfe\u8c61\u306eCD\u30c7\u30a3\u30b9\u30af\u304c\u3042\u308a\u307e\u305b\u3093\u3002');
      }

      let preferredDisc = taggableDiscNumbers.length === 1 ? taggableDiscNumbers[0] : null;
      if (taggableDiscNumbers.length > 1) {
        const defaultDisc = String(taggableDiscNumbers[0]);
        const answer = window.prompt(
          `\u3053\u306e\u30a2\u30eb\u30d0\u30e0\u306f\u8907\u6570\u30c7\u30a3\u30b9\u30af\u3067\u3059\u3002\n\u30d5\u30a9\u30eb\u30c0\u5185\u30d5\u30a1\u30a4\u30eb\u3092\u5272\u308a\u5f53\u3066\u308b\u30c7\u30a3\u30b9\u30af\u756a\u53f7\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002\n\u9078\u629e\u53ef\u80fd: ${taggableDiscNumbers.join(', ')}`,
          defaultDisc
        );
        if (answer === null) {
          setTagMessage('\u30c7\u30a3\u30b9\u30af\u756a\u53f7\u306e\u9078\u629e\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f\u3002');
          return;
        }

        const selectedDisc = Number(String(answer).trim());
        if (!Number.isInteger(selectedDisc) || !taggableDiscNumbers.includes(selectedDisc)) {
          setTagError(`\u30c7\u30a3\u30b9\u30af\u756a\u53f7\u306f ${taggableDiscNumbers.join(', ')} \u306e\u3044\u305a\u308c\u304b\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002`);
          return;
        }
        preferredDisc = selectedDisc;
      }

      const rows = await buildTagRowsFromPickedFiles(picked, { preferredDisc });
      if (rows.length === 0) {
        return setTagError('\u30d5\u30a9\u30eb\u30c0\u5185\u306b\u5bfe\u5fdc\u5f62\u5f0f\u306e\u97f3\u58f0\u30d5\u30a1\u30a4\u30eb\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002');
      }
      setTagFiles(rows);
      setTagMessage(
        `${rows.length}\u4ef6\u306e\u30d5\u30a1\u30a4\u30eb\u3092\u8aad\u307f\u8fbc\u307f\u307e\u3057\u305f\u3002${preferredDisc ? `\uff08Disc ${preferredDisc} \u3067\u81ea\u52d5\u5272\u308a\u5f53\u3066\uff09` : ''}`
      );
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error(e);
        setTagError('\u30d5\u30a9\u30eb\u30c0\u9078\u629e\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002');
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
    if (taggableTracks.length === 0) return setTagError('\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u5bfe\u8c61\u306eCD\u30c7\u30a3\u30b9\u30af\u304c\u3042\u308a\u307e\u305b\u3093\u3002');
    const targets = tagFiles.filter((f) => f.trackId);
    if (targets.length === 0) return setTagError('少なくとも1件はトラックを割り当ててください。');

    setTagError('');
    setTagMessage('書き込みを開始します...');
    setTagProgress(0);
    setIsWriting(true);
    const baseOutputAlbumFolderName = sanitizeFileName(copyValue(album?.title)) || `album-${id}`;
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
          const track = taggableTrackMap.get(String(row.trackId));
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
      const track = taggableTrackMap.get(String(row.trackId));
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
          const outputAlbumFolderName = buildOutputAlbumFolderName(
            baseOutputAlbumFolderName,
            Number(track?.disk_number ?? 0),
            includeDiscNumberInFolderName
          );
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
  const trackListGroups = useMemo(
    () =>
      discGroups.map(([discNumber, tracks]) => ({
        discNumber,
        discLabel: `Disc ${discNumber}`,
        tracks: tracks.map((track, index) => ({
          ...track,
          __rowKey: `${discNumber}-${track.id ?? index}-${track.track_number ?? "x"}`,
        })),
      })),
    [discGroups]
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

      <div className={`${pageCardClass} max-w-7xl`}>
        <SiteBrandHeader
          actions={
            <>
              <button
                type="button"
                onClick={() => navigate('/')}
                className={primaryButtonClass}
              >
                {'一覧へ戻る'}
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
            </>
          }
        />
        <section className={heroPanelClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              {(releaseTypeText !== '' || titleContextText !== '') && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {releaseTypeText !== '' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                      {releaseTypeText}
                    </span>
                  )}
                  {titleContextText !== '' && (
                    <p className="min-w-0 break-words text-sm font-semibold text-slate-600 dark:text-slate-300">{titleContextText}</p>
                  )}
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem] break-words">{album?.title ?? `Album ID: ${id}`}</h1>
            </div>
            <div className="inline-flex items-center gap-2 shrink-0 flex-wrap">
              {(hasEditionDisplay || hasMultipleEditionVariants) &&
                (editionVariants.length > 1 ? (
                  <label className="inline-flex items-center text-sm shrink-0">
                    <select
                      value={selectedEditionAlbumId}
                      onChange={handleEditionChange}
                      className="min-w-[240px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm" title={currentEditionLabel}
                    >
                      {effectiveEditionVariants.map((variant) => (
                        <option key={variant.public_id || variant.id} value={getAlbumRouteId(variant)}>
                          {albumEditionOptionLabel(variant)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className="text-sm shrink-0">{editionDisplayText}</span>
                ))}
              {renderCopyIcon(albumTitleText, 'album-title', 'アルバム名', 'アルバム名をコピー')}
              {hasEdition && renderCopyIcon(albumTitleEditionText, 'album-title-edition', 'アルバム名+形態', 'アルバム名+形態をコピー')}
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-4 items-start lg:grid-cols-[296px_minmax(0,1fr)]">
          <div className={`${panelClass} w-fit justify-self-start`}>
            <div className="group relative w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {currentCover?.url ? (
                <>
                  <img
                    src={currentCover.url}
                    alt={album.title ?? 'album cover'}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:opacity-0"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/85 p-2 opacity-0 transition duration-300 group-hover:opacity-100">
                    <img
                      src={currentCover.url}
                      alt={album.title ?? 'album cover full view'}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </>
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
            <div className="grid gap-4 md:grid-cols-2">
              {renderAlbumArtistCard()}

              {shouldShowUnitMembers && (
                <div className="md:col-span-2">
                  {renderDetailLinkedCard('ユニットメンバー', unitMembers, 'album-unit-members', 'vocal')}
                </div>
              )}

              <div>
                <p className={detailLabelClass}>発売日</p>
                <div className={`${detailValueWrapClass} flex-wrap`}>
                  <p className={`min-w-0 break-words ${detailTextClass}`}>{showValue(formatDateDisplay(album?.release_date))}</p>
                  <div className="inline-flex items-center gap-2 flex-wrap">
                    {renderCopyIcon(copyValue(album?.release_date), 'album-release-date', '発売日', '発売日をコピー')}
                    {renderCopyIcon(copyValue(releaseYear), 'album-release-year', 'リリース年', 'リリース年のみコピー')}
                  </div>
                </div>
              </div>

              {renderDetailTextCard('レーベル', album?.label, 'album-label')}
              {renderDetailTextCard('規格品番', catalogNumberText, 'album-catalog')}
              {renderDetailTextCard('JAN', album?.jan, 'album-jan')}

              {shouldShowSeries && (
                <div>
                  <p className={detailLabelClass}>{'\u30b7\u30ea\u30fc\u30ba'}</p>
                  <div className={detailValueWrapClass}>
                    <Link
                      to={`/series/${album.series.public_id ?? album.series.id}/albums`}
                      className={`min-w-0 break-words ${detailTextClass} ${linkedPeopleClass}`}
                    >
                      {showValue(seriesName)}
                    </Link>
                  </div>
                </div>
              )}

              {shouldShowContent && (
                <div>
                  <p className={detailLabelClass}>{'\u30b3\u30f3\u30c6\u30f3\u30c4'}</p>
                  <div className={detailValueWrapClass}>
                    <p className={`min-w-0 break-words ${detailTextClass}`}>{showValue(contentName)}</p>
                  </div>
                </div>
              )}
            </div>

            {albumCommentText !== '' && (
              <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-700/70">
                <details className="group" open={commentOpen} onToggle={(event) => setCommentOpen(event.currentTarget.open)}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span>{'\u5546\u54c1\u8aac\u660e\u30fb\u30b3\u30e1\u30f3\u30c8'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{commentOpen ? '\u9589\u3058\u308b' : '\u8868\u793a\u3059\u308b'}</span>
                  </summary>
                  <div className="mt-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-200">
                    <p className="whitespace-pre-wrap break-words">{albumCommentText}</p>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {shouldShowRelatedLinks && (
          <div className="mb-6 rounded-[24px] border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70">
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
                          className="break-all text-sky-600 no-underline transition hover:text-sky-700 hover:underline hover:decoration-sky-400/60 hover:underline-offset-4 focus-visible:underline focus-visible:decoration-sky-400/60 focus-visible:underline-offset-4 dark:text-sky-300"
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


        <div className="mb-6 rounded-[24px] border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{'\u3053\u306e\u30a2\u30eb\u30d0\u30e0\u60c5\u5831\u3067\u30bf\u30b0\u3092\u66f8\u304d\u8fbc\u307f'}</h2>
              {support.supported ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">{'\u3053\u306e\u30a2\u30eb\u30d0\u30e0\u60c5\u5831\u3092\u4f7f\u3063\u3066\u30ed\u30fc\u30ab\u30eb\u97f3\u697d\u30d5\u30a1\u30a4\u30eb\u3078\u30bf\u30b0\u3092\u66f8\u304d\u8fbc\u3081\u307e\u3059\u3002\u97f3\u697d\u30d5\u30a1\u30a4\u30eb\u306f\u30b5\u30fc\u30d0\u30fc\u3078\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3055\u308c\u307e\u305b\u3093\u3002'}</p>
              ) : null}
            </div>

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

                {shouldShowDiscFolderNameOption && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includeDiscNumberInFolderName}
                      onChange={(e) => setIncludeDiscNumberInFolderName(e.target.checked)}
                      disabled={isWriting}
                    />
                    フォルダ名にディスク番号を含める
                  </label>
                )}

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
                {shouldShowDiscFolderNameOption && (
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    このオプションをONにすると、フォルダ名は「アルバム名 [Disc3]」の形式になります。
                  </div>
                )}
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
                            {taggableTracks.map((t) => (
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

        {!loading && !error && (
          <section className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{'\u30c8\u30e9\u30c3\u30af\u4e00\u89a7'}</h2>
            <TrackList
              groups={trackListGroups}
              columns={[
                { key: 'track', header: 'Tr', className: 'w-16' },
                { key: 'title', header: '\u66f2\u540d', className: 'min-w-[220px]' },
                { key: 'artist', header: '\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8', className: 'min-w-[180px]' },
                { key: 'lyricist', header: '\u4f5c\u8a5e', className: 'min-w-[180px]' },
                { key: 'composer', header: '\u4f5c\u66f2', className: 'min-w-[180px]' },
                { key: 'arranger', header: '\u7de8\u66f2', className: 'min-w-[180px]' },
                { key: 'genre', header: '\u30b8\u30e3\u30f3\u30eb', className: 'min-w-[140px]' },
                { key: 'duration', header: '\u6642\u9593', className: 'w-24' },
                { key: 'comment', header: '\u30b3\u30e1\u30f3\u30c8', className: 'min-w-[200px]' },
              ]}
              desktopMinWidthClass="min-w-[1360px]"
              renderDesktopRow={(track, index, rowClass) => (
                <tr key={track.__rowKey ?? track.id ?? index} className={rowClass}>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{showValue(track.track_number)}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderTrackField(track.title, `t-${track.id}-title`, '\u66f2\u540d')}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.vocal, `t-${track.id}-artist`, '\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8', 'vocal', trackLinkedPeopleClass)}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.lyricist, `t-${track.id}-lyricist`, '\u4f5c\u8a5e', 'lyricist', trackLinkedPeopleClass)}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.composer, `t-${track.id}-composer`, '\u4f5c\u66f2', 'composer', trackLinkedPeopleClass)}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderLinkedPeopleField(track?.credits?.arranger, `t-${track.id}-arranger`, '\u7de8\u66f2', 'arranger', trackLinkedPeopleClass)}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderTrackField(track.genre, `t-${track.id}-genre`, '\u30b8\u30e3\u30f3\u30eb')}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderTrackField(track.duration, `t-${track.id}-duration`, '\u6642\u9593', false)}</td>
                  <td className="border-b border-r border-slate-200 px-3 py-3 align-top last:border-r-0 dark:border-slate-600">{renderTrackField(track.comment, `t-${track.id}-comment`, '\u30b3\u30e1\u30f3\u30c8')}</td>
                </tr>
              )}
              renderMobileCard={(track, index) => (
                <article
                  key={track.__rowKey ?? track.id ?? index}
                  className="rounded-[20px] border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90"
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Tr {showValue(track.track_number)}</p>
                      <p className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">{showValue(track.title)}</p>
                    </div>
                    <div>
                      <p className={detailLabelClass}>{'\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8'}</p>
                      <div className={detailValueWrapClass}>{renderLinkedPeopleField(track?.credits?.vocal, `m-${track.id}-artist`, '\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8', 'vocal')}</div>
                    </div>
                    <details className="rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-700/70 dark:bg-slate-900/30">
                      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium tracking-[0.14em] text-slate-600 dark:text-slate-300">{'\u8a73\u7d30\u30af\u30ec\u30b8\u30c3\u30c8'}</summary>
                      <div className="space-y-3 border-t border-slate-200/70 px-3 py-3 dark:border-slate-700/70">
                        <div><p className={detailLabelClass}>{'\u4f5c\u8a5e'}</p><div className={detailValueWrapClass}>{renderLinkedPeopleField(track?.credits?.lyricist, `m-${track.id}-lyricist`, '\u4f5c\u8a5e', 'lyricist')}</div></div>
                        <div><p className={detailLabelClass}>{'\u4f5c\u66f2'}</p><div className={detailValueWrapClass}>{renderLinkedPeopleField(track?.credits?.composer, `m-${track.id}-composer`, '\u4f5c\u66f2', 'composer')}</div></div>
                        <div><p className={detailLabelClass}>{'\u7de8\u66f2'}</p><div className={detailValueWrapClass}>{renderLinkedPeopleField(track?.credits?.arranger, `m-${track.id}-arranger`, '\u7de8\u66f2', 'arranger')}</div></div>
                        <div><p className={detailLabelClass}>{'\u30b8\u30e3\u30f3\u30eb'}</p><div className={detailValueWrapClass}>{renderTrackField(track.genre, `m-${track.id}-genre`, '\u30b8\u30e3\u30f3\u30eb')}</div></div>
                        <div><p className={detailLabelClass}>{'\u6642\u9593'}</p><div className={detailValueWrapClass}>{renderTrackField(track.duration, `m-${track.id}-duration`, '\u6642\u9593', false)}</div></div>
                        <div><p className={detailLabelClass}>{'\u30b3\u30e1\u30f3\u30c8'}</p><div className={detailValueWrapClass}>{renderTrackField(track.comment, `m-${track.id}-comment`, '\u30b3\u30e1\u30f3\u30c8')}</div></div>
                      </div>
                    </details>
                  </div>
                </article>
              )}
            />
          </section>
        )}
        {!loading && !error && (
          <div className="mt-6 rounded-[24px] border border-slate-200/70 bg-slate-50/70 px-4 py-4 text-xs text-gray-600 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/20 dark:text-gray-300">
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
