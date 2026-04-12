import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { File, FolderOpen, Loader2, RotateCcw, WandSparkles } from 'lucide-react';
import {
  tableCardClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tableRowClass,
} from '../utils/uiTheme';

const MAX_ARTWORK_BYTES = 2 * 1024 * 1024;
const MSG_ENV_UNAVAILABLE = '\u3053\u306e\u74b0\u5883\u3067\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093\u3002';
const MSG_SAFARI = '\u0053\u0061\u0066\u0061\u0072\u0069\u7cfb\u30d6\u30e9\u30a6\u30b6\u3067\u306f\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002\u0043\u0068\u0072\u006f\u006d\u0065\u307e\u305f\u306f\u0045\u0064\u0067\u0065\u3092\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002';
const MSG_CHROMIUM_ONLY = '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u306f\u0020\u0043\u0068\u0072\u006f\u006d\u0065\u0020\u002f\u0020\u0045\u0064\u0067\u0065\u0020\u7cfb\u30d6\u30e9\u30a6\u30b6\u3067\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002';
const MSG_NO_FS = '\u3053\u306e\u30d6\u30e9\u30a6\u30b6\u3067\u306f\u30ed\u30fc\u30ab\u30eb\u30d5\u30a1\u30a4\u30eb\u3078\u306e\u76f4\u63a5\u66f8\u304d\u8fbc\u307f\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002\u0050\u0043\u7248\u0043\u0068\u0072\u006f\u006d\u0065\u307e\u305f\u306f\u0045\u0064\u0067\u0065\u3092\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002';
const MSG_WORKER_PREPARING = '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u30a8\u30f3\u30b8\u30f3\u3092\u6e96\u5099\u4e2d\u3067\u3059\u3002\u3057\u3070\u3089\u304f\u5f85\u3063\u3066\u518d\u5b9f\u884c\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
const MSG_NO_TRACKS = '\u30c8\u30e9\u30c3\u30af\u60c5\u5831\u304c\u306a\u3044\u305f\u3081\u3001\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u304c\u3067\u304d\u307e\u305b\u3093\u3002';
const MSG_NO_CD_TRACKS = '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u5bfe\u8c61\u306e\u0043\u0044\u30c7\u30a3\u30b9\u30af\u304c\u3042\u308a\u307e\u305b\u3093\u3002';
const MSG_NO_FILES = '\u5148\u306b\u30d5\u30a1\u30a4\u30eb\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
const MSG_NEED_ASSIGN = '\u5c11\u306a\u304f\u3068\u30821\u4ef6\u306f\u30c8\u30e9\u30c3\u30af\u3092\u5272\u308a\u5f53\u3066\u3066\u304f\u3060\u3055\u3044\u3002';
const MSG_SELECT_FAILED = '\u30d5\u30a1\u30a4\u30eb\u9078\u629e\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002';
const MSG_FOLDER_FAILED = '\u30d5\u30a9\u30eb\u30c0\u9078\u629e\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002';
const MSG_UNSUPPORTED_FILES = '\u5bfe\u5fdc\u5f62\u5f0f\u306e\u30d5\u30a1\u30a4\u30eb\u304c\u9078\u629e\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002';
const MSG_FOLDER_EMPTY = '\u30d5\u30a9\u30eb\u30c0\u5185\u306b\u5bfe\u5fdc\u5f62\u5f0f\u306e\u97f3\u58f0\u30d5\u30a1\u30a4\u30eb\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002';
const MSG_DIRECTORY_UNSUPPORTED = '\u3053\u306e\u30d6\u30e9\u30a6\u30b6\u3067\u306f\u30d5\u30a9\u30eb\u30c0\u9078\u629e\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002';
const MSG_DISC_CANCELLED = '\u30c7\u30a3\u30b9\u30af\u756a\u53f7\u306e\u9078\u629e\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f\u3002';
const MSG_START_WRITE = '\u66f8\u304d\u8fbc\u307f\u3092\u958b\u59cb\u3057\u307e\u3059\u002e\u002e\u002e';
const MSG_FINISHED = '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f\u3002';
const LABEL_FILE = '\u30d5\u30a1\u30a4\u30eb';
const LABEL_ASSIGN = '\u5272\u308a\u5f53\u3066\u30c8\u30e9\u30c3\u30af';
const LABEL_STATUS = '\u72b6\u614b';
const LABEL_FILE_SELECT = '\u30d5\u30a1\u30a4\u30eb\u9078\u629e';
const LABEL_FOLDER_SELECT = '\u30d5\u30a9\u30eb\u30c0\u9078\u629e';
const LABEL_RESET = '\u30ea\u30bb\u30c3\u30c8';
const LABEL_OPEN_OPTIONS = '\u25bc \u8a73\u7d30\u8a2d\u5b9a\u3092\u958b\u304f';
const LABEL_CLOSE_OPTIONS = '\u25b2 \u8a73\u7d30\u8a2d\u5b9a\u3092\u9589\u3058\u308b';
const LABEL_EMBED_COVER = '\u30b8\u30e3\u30b1\u30c3\u30c8\u753b\u50cf\u3092\u57cb\u3081\u8fbc\u3080';
const LABEL_RENAME = '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u6642\u306b\u30d5\u30a1\u30a4\u30eb\u540d\u3092\u30ea\u30cd\u30fc\u30e0\u3059\u308b';
const LABEL_UNASSIGNED = '\u672a\u5272\u308a\u5f53\u3066';
const LABEL_PENDING = '\u5272\u308a\u5f53\u3066\u6e08\u307f';
const LABEL_NOT_ASSIGNED = '\u30c8\u30e9\u30c3\u30af\u672a\u5272\u308a\u5f53\u3066';
const LABEL_SKIPPED = '\u30c8\u30e9\u30c3\u30af\u672a\u5272\u308a\u5f53\u3066\u306e\u305f\u3081\u30b9\u30ad\u30c3\u30d7';
const LABEL_NOT_FOUND = '\u5272\u308a\u5f53\u3066\u30c8\u30e9\u30c3\u30af\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093';
const LABEL_PROCESSING = '\u66f8\u304d\u8fbc\u307f\u4e2d\u002e\u002e\u002e';
const LABEL_DONE = '\u5b8c\u4e86';
const LABEL_WRITE = '\u30bf\u30b0\u66f8\u304d\u8fbc\u307f';
const PANEL_TITLE = '\u3053\u306e\u0043\u0044\u60c5\u5831\u3067\u30bf\u30b0\u3092\u66f8\u304d\u8fbc\u307f';
const PANEL_DESCRIPTION = '\u3053\u306e\u0043\u0044\u60c5\u5831\u3092\u4f7f\u3063\u3066\u30ed\u30fc\u30ab\u30eb\u97f3\u697d\u30d5\u30a1\u30a4\u30eb\u3078\u30bf\u30b0\u3092\u66f8\u304d\u8fbc\u3081\u307e\u3059\u3002\u97f3\u697d\u30d5\u30a1\u30a4\u30eb\u306f\u30b5\u30fc\u30d0\u30fc\u3078\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3055\u308c\u307e\u305b\u3093\u3002';
const PANEL_RENAME_HELP = '\u4f7f\u7528\u53ef\u80fd\u003a\u0020\u0025\u0074\u0072\u0061\u0063\u006b\u0025\u002c\u0020\u0025\u0064\u0069\u0073\u0063\u0025\u002c\u0020\u0025\u0074\u0069\u0074\u006c\u0065\u0025\u002c\u0020\u0025\u0061\u0072\u0074\u0069\u0073\u0074\u0025\u002c\u0020\u0025\u0061\u006c\u0062\u0075\u006d\u0025\u002c\u0020\u0025\u0061\u006c\u0062\u0075\u006d\u005f\u0061\u0072\u0074\u0069\u0073\u0074\u0025\u002c\u0020\u0025\u0079\u0065\u0061\u0072\u0025\u002c\u0020\u0025\u0063\u0061\u0074\u0061\u006c\u006f\u0067\u005f\u006e\u0075\u006d\u0062\u0065\u0072\u0025\u0020\u3068\u0020\u0024\u006e\u0075\u006d\u0028\u0025\u0074\u0072\u0061\u0063\u006b\u0025\u002c\u0032\u0029';
const PANEL_SINGLE_HELP = '\u5358\u4f53\u30d5\u30a1\u30a4\u30eb\u9078\u629e\u6642\u306f\u3001\u66f8\u304d\u8fbc\u307f\u524d\u306b\u4fdd\u5b58\u5148\u3092\u78ba\u8a8d\u3057\u307e\u3059\u3002';
const PANEL_FOLDER_HELP = '\u30d5\u30a9\u30eb\u30c0\u9078\u629e\u6642\u306f\u3001\u5143\u30d5\u30a9\u30eb\u30c0\u3068\u540c\u3058\u968e\u5c64\u306b\u300c\u30a2\u30eb\u30d0\u30e0\u540d\u300d\u30d5\u30a9\u30eb\u30c0\u3092\u4f5c\u6210\u3057\u3001\u305d\u306e\u4e2d\u306b\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u6e08\u307f\u30d5\u30a1\u30a4\u30eb\u3092\u4fdd\u5b58\u3057\u307e\u3059\u3002';
const PANEL_DANGER = '\u30d5\u30a1\u30a4\u30eb\u304c\u7834\u640d\u3057\u3066\u3082\u5f53\u30b5\u30a4\u30c8\u306f\u4e00\u5207\u306e\u8cac\u4efb\u3092\u8ca0\u3044\u307e\u305b\u3093\u3002\u5fc5\u305a\u5143\u306e\u30d5\u30a1\u30a4\u30eb\u3092\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u3057\u3066\u304b\u3089\u5b9f\u884c\u3057\u3066\u304f\u3060\u3055\u3044\u3002';

function showValue(value) {
  const text = String(value ?? '').trim();
  return text === '' ? '-' : text;
}

function detectTagWriteSupport() {
  if (typeof window === 'undefined') {
    return { supported: false, reason: MSG_ENV_UNAVAILABLE };
  }

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

  if (isSafari) return { supported: false, reason: MSG_SAFARI };
  if (!isChromiumFamily) return { supported: false, reason: MSG_CHROMIUM_ONLY };
  if (!hasOpenPicker || !hasWritable) return { supported: false, reason: MSG_NO_FS };

  return { supported: true, reason: '' };
}

function normalizeTracks(items) {
  const list = Array.isArray(items) ? items.slice() : [];
  return list.map((track, index) => ({
    ...track,
    __tagId: `${track?.disk_number ?? 1}-${track?.track_number ?? index + 1}-${index}`,
  })).sort((a, b) => {
    const ad = Number(a?.disk_number ?? 1);
    const bd = Number(b?.disk_number ?? 1);
    if (ad !== bd) return ad - bd;
    const at = Number(a?.track_number ?? 0);
    const bt = Number(b?.track_number ?? 0);
    if (at !== bt) return at - bt;
    return String(a.__tagId).localeCompare(String(b.__tagId), 'ja');
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
    .flatMap((track) => [String(track?.title ?? '').trim(), String(track?.comment ?? '').trim()])
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

function releaseYearText(album) {
  const matched = String(album?.release_date ?? '').match(/^(\d{4})/);
  return matched ? matched[1] : '';
}function extractTrackNoFromFilename(name) {
  const match = String(name ?? '').match(/(?:^|[^\d])(\d{1,2})(?:[^\d]|$)/);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function extractDiscTrackFromFilename(name) {
  const raw = String(name ?? '').replace(/\.[^.]+$/, '');
  const byDiscWord = raw.match(/(?:disc|cd)\s*0?(\d{1,2})[^0-9]+(?:tr|track)?\s*0?(\d{1,2})/i);
  if (byDiscWord) return { disc: Number(byDiscWord[1]), track: Number(byDiscWord[2]) };

  const byPair = raw.match(/(?:^|[^\d])0?(\d{1,2})[-_ ]0?(\d{1,2})(?:[^\d]|$)/);
  if (byPair) return { disc: Number(byPair[1]), track: Number(byPair[2]) };

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
        items.push({ handle: entry, directoryHandle: dirHandle, fileName: entry.name, relativePath });
      }
    }
  };
  await walk(rootHandle);
  items.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'ja'));
  return items;
}

function sanitizeFileName(name) {
  const filtered = String(name ?? '').split('').map((char) => {
    const code = char.charCodeAt(0);
    if (code <= 31) return '_';
    if ('<>:"/\\|?*'.includes(char)) return '_';
    return char;
  }).join('');
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

function creditsText(value) {
  const items = Array.isArray(value) ? value : [];
  const filtered = items.map((item) => String(item ?? '').trim()).filter(Boolean);
  return filtered.length > 0 ? filtered.join(', ') : '';
}

function buildTagPayload(album, track, releaseYear, trackTotalByDisk, discTotal) {
  const credits = track?.credits ?? {};
  const trackNo = Number(track?.track_number ?? 0);
  const discNo = Number(track?.disk_number ?? 1);
  return {
    title: String(track?.title ?? ''),
    artist: creditsText(credits?.vocal) || String(album?.album_artist ?? ''),
    album: String(album?.title ?? ''),
    albumArtist: String(album?.album_artist ?? ''),
    track: trackNo > 0 ? String(trackNo) : '',
    trackTotal: Number(trackTotalByDisk?.[discNo] ?? 0) > 0 ? String(trackTotalByDisk[discNo]) : '',
    disc: discNo > 0 ? String(discNo) : '',
    discTotal: discTotal > 0 ? String(discTotal) : '',
    year: releaseYear,
    date: releaseYear,
    genre: '',
    lyricist: creditsText(credits?.lyricist),
    composer: creditsText(credits?.composer),
    arranger: creditsText(credits?.arranger),
    publisher: String(album?.label ?? ''),
    comment: '',
    isrc: '',
  };
}

function buildRenameContext(album, track, releaseYear) {
  const credits = track?.credits ?? {};
  return {
    track: Number(track?.track_number ?? 0) || '',
    disc: Number(track?.disk_number ?? 0) || '',
    title: track?.title ?? '',
    artist: creditsText(credits?.vocal) || String(album?.album_artist ?? ''),
    lyricist: creditsText(credits?.lyricist),
    composer: creditsText(credits?.composer),
    arranger: creditsText(credits?.arranger),
    album: album?.title ?? '',
    album_artist: album?.album_artist ?? '',
    year: releaseYear ?? '',
    release_date: album?.release_date ?? '',
    catalog_number: album?.catalog_number_display ?? album?.catalog_number ?? '',
  };
}

function renderRenameTemplate(template, context) {
  let output = String(template ?? '');
  output = output.replace(/\$num\(%([a-z0-9_]+)%\s*,\s*(\d+)\)/gi, (_, key, widthText) => {
    const width = Math.max(1, Math.min(10, Number(widthText) || 1));
    const number = Number(context[String(key).toLowerCase()]);
    if (!Number.isFinite(number)) return '';
    return String(Math.trunc(number)).padStart(width, '0');
  });
  output = output.replace(/%([a-z0-9_]+)%/gi, (_, key) => {
    const value = context[String(key).toLowerCase()];
    return value == null ? '' : String(value);
  });
  return output.replace(/\s+/g, ' ').trim();
}

async function resolveUniqueFileName(directoryHandle, desiredName, currentName) {
  const desiredLower = String(desiredName).toLowerCase();
  const currentLower = String(currentName ?? '').toLowerCase();
  if (desiredLower === currentLower) return currentName;

  const dotIndex = desiredName.lastIndexOf('.');
  const base = dotIndex > 0 ? desiredName.slice(0, dotIndex) : desiredName;
  const ext = dotIndex > 0 ? desiredName.slice(dotIndex) : '';
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

export default function MusicBrainzTagWritePanel({ album }) {
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
  const [renameOnWrite, setRenameOnWrite] = useState(true);
  const [includeDiscNumberInFolderName, setIncludeDiscNumberInFolderName] = useState(false);
  const [renamePattern, setRenamePattern] = useState('$num(%track%,2) %title%');
  const [isTagOptionExpanded, setIsTagOptionExpanded] = useState(false);

  const orderedTracks = useMemo(() => normalizeTracks(album?.tracks), [album?.tracks]);
  const releaseYear = useMemo(() => releaseYearText(album), [album]);
  const trackTotalByDisk = useMemo(() => {
    const map = {};
    for (const track of orderedTracks) {
      const disc = Number(track?.disk_number ?? 1);
      map[disc] = Math.max(map[disc] ?? 0, Number(track?.track_number ?? 0));
    }
    return map;
  }, [orderedTracks]);
  const discTotal = useMemo(() => Math.max(1, new Set(orderedTracks.map((track) => Number(track?.disk_number ?? 1))).size), [orderedTracks]);
  const discTypeMap = useMemo(() => buildDiscTypeMap(album?.discs, orderedTracks), [album?.discs, orderedTracks]);
  const taggableTracks = useMemo(
    () => orderedTracks.filter((track) => normalizeDiscType(discTypeMap.get(Number(track?.disk_number ?? 1))) === 'cd'),
    [discTypeMap, orderedTracks]
  );
  const taggableDiscNumbers = useMemo(
    () => Array.from(new Set(taggableTracks.map((track) => Number(track?.disk_number ?? 1)).filter((disc) => Number.isInteger(disc) && disc > 0))).sort((a, b) => a - b),
    [taggableTracks]
  );
  const taggableTrackMap = useMemo(() => new Map(taggableTracks.map((track) => [String(track.__tagId), track])), [taggableTracks]);
  const shouldShowDiscFolderNameOption = taggableDiscNumbers.length > 1;
  const shouldShowTagOptionDetails = tagFiles.length > 0 || isTagOptionExpanded;
  useEffect(() => {
    setIncludeDiscNumberInFolderName(shouldShowDiscFolderNameOption);
  }, [album?.id, shouldShowDiscFolderNameOption]);

  const workerWasmUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/taglib.wasm';
    const basePath = String(import.meta.env.BASE_URL || '/').replace(/\/+$/, '/');
    return new URL(`${basePath}taglib.wasm`, window.location.origin).toString();
  }, []);

  const callWorker = useCallback((type, payload = {}, onProgress = null, transferList = []) => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error(MSG_WORKER_PREPARING));
    const reqId = workerReqIdRef.current++;
    return new Promise((resolve, reject) => {
      workerPendingRef.current.set(reqId, { resolve, reject, onProgress });
      worker.postMessage({ id: reqId, type, payload }, transferList);
    });
  }, []);

  const updateTagFile = useCallback((key, patch) => {
    setTagFiles((prev) => prev.map((file) => (file.key === key ? { ...file, ...patch } : file)));
  }, []);

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
    worker.onerror = () => setWorkerError('\u30bf\u30b0\u66f8\u304d\u8fbc\u307f\u30a8\u30f3\u30b8\u30f3\u306e\u8d77\u52d5\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u30da\u30fc\u30b8\u3092\u518d\u8aad\u307f\u8fbc\u307f\u3057\u3066\u304b\u3089\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002');

    callWorker('INIT', { wasmUrl: workerWasmUrl }).then(() => {
      setWorkerReady(true);
      setWorkerError('');
    }).catch((caughtError) => {
      setWorkerError(`${caughtError.message} (WASM: ${workerWasmUrl})`);
    });

    return () => {
      for (const [, pending] of pendingMap.entries()) pending.reject(new Error('Worker interrupted'));
      pendingMap.clear();
      worker.terminate();
      workerRef.current = null;
      setWorkerReady(false);
    };
  }, [callWorker, support.supported, workerWasmUrl]);

  useEffect(() => {
    setTagFiles([]);
    setTagError('');
    setTagMessage('');
    setTagProgress(0);
    setIsWriting(false);
    setWorkerError('');
    setIsTagOptionExpanded(false);
  }, [album?.id]);

  useEffect(() => {
    if (!album?.id) return;
    setEmbedCover(Boolean(album?.cover_image_url));
    setRenameOnWrite(true);
    setRenamePattern('$num(%track%,2) %title%');
  }, [album?.id, album?.cover_image_url]);

  const buildTagRowsFromPickedFiles = useCallback(async (pickedItems, options = {}) => {
    const preferredDisc = Number(options?.preferredDisc ?? 0);
    const hasPreferredDisc = Number.isInteger(preferredDisc) && preferredDisc > 0;
    const candidateTracks = hasPreferredDisc ? taggableTracks.filter((track) => Number(track?.disk_number ?? 1) === preferredDisc) : taggableTracks;
    const sourceTracks = candidateTracks.length > 0 ? candidateTracks : taggableTracks;
    const files = await Promise.all(pickedItems.map((item) => item.handle.getFile()));
    const rows = [];
    const usedTrackIds = new Set();

    for (let index = 0; index < pickedItems.length; index += 1) {
      const picked = pickedItems[index];
      const file = files[index];
      if (!/\.(mp3|flac|m4a)$/i.test(file.name)) continue;
      let trackId = '';
      const guessed = extractDiscTrackFromFilename(file.name);
      if (guessed.track != null) {
        const expectedDisc = guessed.disc == null && hasPreferredDisc ? preferredDisc : guessed.disc;
        const match = sourceTracks.find((track) => Number(track?.track_number ?? 0) === guessed.track && (expectedDisc == null || Number(track?.disk_number ?? 1) === expectedDisc) && !usedTrackIds.has(String(track.__tagId))) || sourceTracks.find((track) => Number(track?.track_number ?? 0) === guessed.track && (expectedDisc == null || Number(track?.disk_number ?? 1) === expectedDisc));
        if (match) {
          trackId = String(match.__tagId);
          usedTrackIds.add(String(match.__tagId));
        }
      }
      if (!trackId) {
        const next = sourceTracks.find((track) => !usedTrackIds.has(String(track.__tagId)));
        if (next) {
          trackId = String(next.__tagId);
          usedTrackIds.add(String(next.__tagId));
        }
      }
      rows.push({ key: `${picked.relativePath || file.name}-${file.size}-${Date.now()}-${index}`, handle: picked.handle, directoryHandle: picked.directoryHandle ?? null, name: file.name, size: file.size, trackId, status: 'pending', message: trackId ? LABEL_PENDING : LABEL_NOT_ASSIGNED });
    }
    return rows;
  }, [taggableTracks]);

  const handleSelectFiles = async () => {
    if (!support.supported) return setTagError(support.reason);
    if (!workerReady) return setTagError(MSG_WORKER_PREPARING);
    if (taggableTracks.length === 0) return setTagError(MSG_NO_CD_TRACKS);
    setTagError(''); setTagMessage(''); setTagProgress(0);
    try {
      const handles = await window.showOpenFilePicker({ multiple: true, excludeAcceptAllOption: true, types: [{ description: 'Audio files', accept: { 'audio/mpeg': ['.mp3'], 'audio/flac': ['.flac'], 'audio/mp4': ['.m4a'] } }] });
      const rows = await buildTagRowsFromPickedFiles(handles.map((handle) => ({ handle, directoryHandle: null, fileName: handle.name, relativePath: handle.name })));
      if (rows.length === 0) return setTagError(MSG_UNSUPPORTED_FILES);
      setTagFiles(rows);
    } catch (caughtError) { if (caughtError?.name !== 'AbortError') { console.error(caughtError); setTagError(MSG_SELECT_FAILED); } }
  };

  const handleSelectFolder = async () => {
    if (!support.supported) return setTagError(support.reason);
    if (!workerReady) return setTagError(MSG_WORKER_PREPARING);
    if (taggableTracks.length === 0) return setTagError(MSG_NO_CD_TRACKS);
    if (typeof window.showDirectoryPicker !== 'function') return setTagError(MSG_DIRECTORY_UNSUPPORTED);
    setTagError(''); setTagMessage(''); setTagProgress(0);
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const picked = await collectAudioFilesFromDirectory(dirHandle);
      if (picked.length === 0) return setTagError(MSG_FOLDER_EMPTY);
      if (taggableDiscNumbers.length === 0) return setTagError(MSG_NO_CD_TRACKS);
      let preferredDisc = taggableDiscNumbers.length === 1 ? taggableDiscNumbers[0] : null;
      if (taggableDiscNumbers.length > 1) {
        const answer = window.prompt(`このアルバムは複数ディスクです。
フォルダ内ファイルを割り当てるディスク番号を入力してください。
選択可能: ${taggableDiscNumbers.join(', ')}`, String(taggableDiscNumbers[0]));
        if (answer === null) { setTagMessage(MSG_DISC_CANCELLED); return; }
        const selectedDisc = Number(String(answer).trim());
        if (!Number.isInteger(selectedDisc) || !taggableDiscNumbers.includes(selectedDisc)) {
          setTagError(`ディスク番号は ${taggableDiscNumbers.join(', ')} のいずれかを入力してください。`);
          return;
        }
        preferredDisc = selectedDisc;
      }
      const rows = await buildTagRowsFromPickedFiles(picked, { preferredDisc });
      if (rows.length === 0) return setTagError(MSG_FOLDER_EMPTY);
      setTagFiles(rows);
    } catch (caughtError) { if (caughtError?.name !== 'AbortError') { console.error(caughtError); setTagError(MSG_FOLDER_FAILED); } }
  };

  const loadCoverArtwork = async () => {
    const coverUrl = String(album?.cover_image_url ?? '').trim();
    if (!embedCover || coverUrl === '') return null;
    const response = await fetch(coverUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`\u30b8\u30e3\u30b1\u30c3\u30c8\u753b\u50cf\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002 (HTTP ${response.status})`);
    const blob = await response.blob();
    if (blob.size > MAX_ARTWORK_BYTES) throw new Error('\u30b8\u30e3\u30b1\u30c3\u30c8\u753b\u50cf\u304c\u5927\u304d\u3059\u304e\u307e\u3059\u30022MB\u4ee5\u4e0b\u306b\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
    return { mimeType: blob.type || 'image/jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
  };

  const handleWriteTags = async () => {
    if (isWriting) return;
    if (!workerReady) return setTagError(MSG_WORKER_PREPARING);
    if (tagFiles.length === 0) return setTagError(MSG_NO_FILES);
    if (taggableTracks.length === 0) return setTagError(MSG_NO_CD_TRACKS);
    const targets = tagFiles.filter((file) => file.trackId);
    if (targets.length === 0) return setTagError(MSG_NEED_ASSIGN);

    setTagError(''); setTagMessage(MSG_START_WRITE); setTagProgress(0); setIsWriting(true);
    const baseOutputAlbumFolderName = sanitizeFileName(showValue(album?.title)) || 'album';
    const singleFileSavePlans = new Map();

    if (renameOnWrite) {
      const singleFileRows = tagFiles.filter((file) => file.trackId && !file.directoryHandle);
      if (singleFileRows.length > 0) {
        if (typeof window.showSaveFilePicker !== 'function') {
          setTagError('\u3053\u306e\u30d6\u30e9\u30a6\u30b6\u306f\u5358\u4f53\u30d5\u30a1\u30a4\u30eb\u9078\u629e\u6642\u306e\u30ea\u30cd\u30fc\u30e0\u4fdd\u5b58\u30c0\u30a4\u30a2\u30ed\u30b0\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002');
          setIsWriting(false);
          return;
        }

        const reservedNames = new Set();
        for (const row of singleFileRows) {
          const track = taggableTrackMap.get(String(row.trackId));
          if (!track) continue;
          const context = buildRenameContext(album, track, releaseYear);
          const rendered = renderRenameTemplate(renamePattern, context);
          const sanitized = sanitizeFileName(rendered);
          if (!sanitized) {
            setTagError(`\u30ea\u30cd\u30fc\u30e0\u7d50\u679c\u304c\u7a7a\u3067\u3059\uff08${row.name}\uff09\u3002\u30ea\u30cd\u30fc\u30e0\u5f62\u5f0f\u3092\u898b\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002`);
            setIsWriting(false);
            return;
          }
          const ext = row.name.includes('.') ? `.${row.name.split('.').pop()}` : '';
          const desiredName = `${sanitized}${ext}`;
          let suggestedName = desiredName;
          if (reservedNames.has(suggestedName.toLowerCase())) {
            const dotIndex = desiredName.lastIndexOf('.');
            const baseName = dotIndex > 0 ? desiredName.slice(0, dotIndex) : desiredName;
            const extName = dotIndex > 0 ? desiredName.slice(dotIndex) : '';
            let index = 1;
            while (reservedNames.has(`${baseName} (${index})${extName}`.toLowerCase())) index += 1;
            suggestedName = `${baseName} (${index})${extName}`;
          }
          reservedNames.add(suggestedName.toLowerCase());
          setTagMessage(`${row.name} \u306e\u4fdd\u5b58\u5148\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044...`);
          try {
            const saveHandle = await window.showSaveFilePicker({ suggestedName, excludeAcceptAllOption: true, types: [{ description: 'Audio files', accept: { 'audio/mpeg': ['.mp3'], 'audio/flac': ['.flac'], 'audio/mp4': ['.m4a'] } }] });
            singleFileSavePlans.set(row.key, { saveHandle, suggestedName });
          } catch (pickerError) {
            if (pickerError?.name === 'AbortError') singleFileSavePlans.set(row.key, { skipReason: '\u4fdd\u5b58\u5148\u306e\u9078\u629e\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u305f\u305f\u3081\u30b9\u30ad\u30c3\u30d7' });
            else {
              const detail = pickerError instanceof Error ? pickerError.message : String(pickerError ?? '');
              singleFileSavePlans.set(row.key, { skipReason: `\u4fdd\u5b58\u30c0\u30a4\u30a2\u30ed\u30b0\u3092\u958b\u3051\u306a\u304b\u3063\u305f\u305f\u3081\u30b9\u30ad\u30c3\u30d7${detail ? ` (${detail})` : ''}` });
            }
          }
        }
      }
    }

    let artwork = null;
    try { artwork = await loadCoverArtwork(); } catch (caughtError) { setTagError(caughtError.message); setIsWriting(false); return; }

    let done = 0;
    for (const row of tagFiles) {
      if (!row.trackId) {
        updateTagFile(row.key, { status: 'skipped', message: LABEL_SKIPPED });
        continue;
      }
      const track = taggableTrackMap.get(String(row.trackId));
      if (!track) {
        updateTagFile(row.key, { status: 'error', message: LABEL_NOT_FOUND });
        done += 1; setTagProgress(Math.round((done / targets.length) * 100));
        continue;
      }
      updateTagFile(row.key, { status: 'processing', message: LABEL_PROCESSING });
      setTagMessage(`${row.name} \u3092\u51e6\u7406\u4e2d...`);
      try {
        const permissionMode = renameOnWrite && !row.directoryHandle ? 'read' : 'readwrite';
        const permission = await row.handle.requestPermission?.({ mode: permissionMode });
        if (permission && permission !== 'granted') throw new Error(permissionMode === 'read' ? '\u8aad\u307f\u53d6\u308a\u6a29\u9650\u304c\u8a31\u53ef\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002' : '\u66f8\u304d\u8fbc\u307f\u6a29\u9650\u304c\u8a31\u53ef\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002');
        const file = await row.handle.getFile();
        const fileBuffer = await file.arrayBuffer();
        const tags = buildTagPayload(album, track, releaseYear, trackTotalByDisk, discTotal);
        const result = await callWorker('WRITE_TAGS', { fileBytes: fileBuffer, fileName: file.name, tags, artwork: artwork ? { mimeType: artwork.mimeType, bytes: artwork.bytes.slice() } : null }, (payload) => setTagMessage(`${row.name}: ${payload?.message ?? LABEL_PROCESSING}`), [fileBuffer]);
        const outputBytes = result?.fileBytes instanceof Uint8Array ? result.fileBytes : new Uint8Array(result?.fileBytes ?? []);
        let outputName = row.name;
        if (row.directoryHandle) {
          const dirPermission = await row.directoryHandle.requestPermission?.({ mode: 'readwrite' });
          if (dirPermission && dirPermission !== 'granted') throw new Error('\u4fdd\u5b58\u5148\u30d5\u30a9\u30eb\u30c0\u306e\u66f8\u304d\u8fbc\u307f\u6a29\u9650\u304c\u8a31\u53ef\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002');
          let desiredOutputName = row.name;
          const outputAlbumFolderName = buildOutputAlbumFolderName(
            baseOutputAlbumFolderName,
            Number(track?.disk_number ?? 0),
            includeDiscNumberInFolderName
          );
          if (renameOnWrite) {
            const context = buildRenameContext(album, track, releaseYear);
            const rendered = renderRenameTemplate(renamePattern, context);
            const sanitized = sanitizeFileName(rendered);
            if (!sanitized) throw new Error('\u30ea\u30cd\u30fc\u30e0\u7d50\u679c\u304c\u7a7a\u3067\u3059\u3002\u30ea\u30cd\u30fc\u30e0\u5f62\u5f0f\u3092\u898b\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
            const ext = row.name.includes('.') ? `.${row.name.split('.').pop()}` : '';
            desiredOutputName = `${sanitized}${ext}`;
          }
          const outputDir = await row.directoryHandle.getDirectoryHandle(outputAlbumFolderName, { create: true });
          const targetName = await resolveUniqueFileName(outputDir, desiredOutputName, '');
          const targetHandle = await outputDir.getFileHandle(targetName, { create: true });
          const writable = await targetHandle.createWritable();
          await writable.write(outputBytes); await writable.close(); outputName = targetName;
        } else {
          const plan = singleFileSavePlans.get(row.key);
          if (plan?.skipReason) {
            updateTagFile(row.key, { status: 'skipped', message: plan.skipReason });
            done += 1; setTagProgress(Math.round((done / targets.length) * 100));
            continue;
          }
          if (plan?.saveHandle) {
            const writable = await plan.saveHandle.createWritable();
            await writable.write(outputBytes); await writable.close(); outputName = plan.suggestedName || row.name;
          } else {
            const permissionResult = await row.handle.requestPermission?.({ mode: 'readwrite' });
            if (permissionResult && permissionResult !== 'granted') throw new Error('\u66f8\u304d\u8fbc\u307f\u6a29\u9650\u304c\u8a31\u53ef\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002');
            const writable = await row.handle.createWritable();
            await writable.write(outputBytes); await writable.close();
          }
        }
        updateTagFile(row.key, { status: 'done', message: renameOnWrite && outputName !== row.name ? `${LABEL_DONE} (${outputName})` : LABEL_DONE });
      } catch (caughtError) {
        console.error(caughtError);
        updateTagFile(row.key, { status: 'error', message: caughtError instanceof Error ? caughtError.message : '\u66f8\u304d\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002' });
      }
      done += 1;
      setTagProgress(Math.round((done / targets.length) * 100));
    }
    setTagMessage(MSG_FINISHED);
    setIsWriting(false);
  };  if (!album) return null;

  return (
    <section className="mt-6 rounded-[24px] border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">{PANEL_TITLE}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{PANEL_DESCRIPTION}</p>
        </div>
        {support.supported ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleSelectFiles} disabled={!workerReady || isWriting} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-100/85 px-3 py-2 text-emerald-900 shadow-sm transition hover:bg-emerald-200/90 disabled:opacity-60 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/22"><File className="h-4 w-4" />{LABEL_FILE_SELECT}</button>
            <button type="button" onClick={handleSelectFolder} disabled={!workerReady || isWriting} className="inline-flex items-center gap-2 rounded-2xl border border-violet-200/80 bg-violet-100/85 px-3 py-2 text-violet-900 shadow-sm transition hover:bg-violet-200/90 disabled:opacity-60 dark:border-violet-400/20 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/22"><FolderOpen className="h-4 w-4" />{LABEL_FOLDER_SELECT}</button>
            <button type="button" onClick={() => { setTagFiles([]); setTagError(''); setTagMessage(''); setTagProgress(0); setIsTagOptionExpanded(false); }} disabled={isWriting} className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-3 py-2 text-slate-700 shadow-sm transition hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"><RotateCcw className="h-4 w-4" />{LABEL_RESET}</button>
          </div>
        ) : null}
      </div>

      {support.supported ? <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setIsTagOptionExpanded((prev) => !prev)} disabled={isWriting} className="inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-60">{shouldShowTagOptionDetails ? LABEL_CLOSE_OPTIONS : LABEL_OPEN_OPTIONS}</button></div> : null}

      {support.supported && shouldShowTagOptionDetails ? (
        <>
          <div className="mt-3 flex flex-col items-start gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={embedCover} onChange={(event) => setEmbedCover(event.target.checked)} disabled={!album?.cover_image_url || isWriting} />{LABEL_EMBED_COVER}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={renameOnWrite} onChange={(event) => setRenameOnWrite(event.target.checked)} disabled={isWriting} />{LABEL_RENAME}</label>
            {shouldShowDiscFolderNameOption ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeDiscNumberInFolderName} onChange={(event) => setIncludeDiscNumberInFolderName(event.target.checked)} disabled={isWriting} />フォルダ名にディスク番号を含める</label> : null}
            <input type="text" value={renamePattern} onChange={(event) => setRenamePattern(event.target.value)} disabled={!renameOnWrite || isWriting} className="w-full max-w-xl rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900 disabled:opacity-60" placeholder="$num(%track%,2) %title%" />
            <div className="text-xs text-gray-600 dark:text-gray-300">{PANEL_RENAME_HELP}</div>
            {renameOnWrite ? <div className="text-xs text-amber-700 dark:text-amber-300">{PANEL_SINGLE_HELP}</div> : null}
            <div className="text-xs text-amber-700 dark:text-amber-300">{PANEL_FOLDER_HELP}</div>
            {shouldShowDiscFolderNameOption ? <div className="text-xs text-amber-700 dark:text-amber-300">このオプションをONにすると、フォルダ名は「アルバム名 [Disc3]」の形式になります。</div> : null}
          </div>
          <div className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">{PANEL_DANGER}</div>
        </>
      ) : null}

      {!support.supported ? <div className="mt-3 text-sm text-amber-700">{support.reason}</div> : null}
      {workerError ? <div className="mt-2 text-sm text-red-600">{workerError}</div> : null}
      {tagError ? <div className="mt-2 text-sm text-red-600">{tagError}</div> : null}
      {tagMessage ? <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{tagMessage}</div> : null}
      {isWriting || tagProgress > 0 ? <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700"><div className="h-full bg-emerald-500" style={{ width: `${tagProgress}%` }} /></div> : null}

      {support.supported && tagFiles.length > 0 ? (
        <div className="mt-4">
          <div className={tableCardClass}><div className="overflow-x-auto"><table className={`${tableClass} min-w-[920px]`}><thead><tr className={tableHeadRowClass}><th className={`${tableHeadCellClass} min-w-[260px]`}>{LABEL_FILE}</th><th className={`${tableHeadCellClass} min-w-[280px]`}>{LABEL_ASSIGN}</th><th className={`${tableHeadCellClass} min-w-[220px]`}>{LABEL_STATUS}</th></tr></thead><tbody>{tagFiles.map((file) => (<tr key={file.key} className={tableRowClass}><td className={tableCellClass}><div className="font-medium">{file.name}</div><div className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</div></td><td className={tableCellClass}><select value={file.trackId} disabled={isWriting} onChange={(event) => updateTagFile(file.key, { trackId: event.target.value, status: 'pending', message: event.target.value ? LABEL_PENDING : LABEL_NOT_ASSIGNED })} className="w-full rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-900"><option value="">{LABEL_UNASSIGNED}</option>{taggableTracks.map((track) => (<option key={track.__tagId} value={String(track.__tagId)}>{`Disc ${track.disk_number ?? 1} / Tr ${track.track_number ?? '-'}: ${track.title ?? ''}`}</option>))}</select></td><td className={tableCellClass}><div className="font-semibold">{file.status}</div><div className="text-slate-700 dark:text-slate-300">{file.message}</div></td></tr>))}</tbody></table></div></div>
          <div className="mt-3 flex justify-end"><button type="button" onClick={handleWriteTags} disabled={!support.supported || !workerReady || isWriting || tagFiles.length === 0} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-white transition hover:bg-emerald-700 disabled:opacity-60">{isWriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}{LABEL_WRITE}</button></div>
        </div>
      ) : null}
    </section>
  );
}