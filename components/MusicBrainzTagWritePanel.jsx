'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { File, FolderOpen, Loader2, RotateCcw, WandSparkles } from 'lucide-react';
import {
  tableCardClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tableRowClass,
  panelClass,
  primaryButtonClass,
} from '@/utils/uiTheme';

const MAX_ARTWORK_BYTES = 2 * 1024 * 1024;
const MSG_ENV_UNAVAILABLE = 'この環境では利用できません。';
const MSG_SAFARI = 'Safari系ブラウザではタグ書き込みに対応していません。ChromeまたはEdgeをご利用ください。';
const MSG_CHROMIUM_ONLY = 'タグ書き込みは Chrome / Edge 系ブラウザでご利用ください。';
const MSG_NO_FS = 'このブラウザではローカルファイルへの直接書き込みに対応していません。PC版ChromeまたはEdgeをご利用ください。';
const MSG_WORKER_PREPARING = 'タグ書き込みエンジンを準備中です。しばらく待って再実行してください。';
const MSG_NO_TRACKS = 'トラック情報がないため、タグ書き込みができません。';
const MSG_NO_CD_TRACKS = 'タグ書き込み対象のCDディスクがありません。';
const MSG_NO_FILES = '先にファイルを選択してください。';
const MSG_NEED_ASSIGN = '少なくとも1件はトラックを割り当ててください。';
const MSG_SELECT_FAILED = 'ファイル選択に失敗しました。';
const MSG_FOLDER_FAILED = 'フォルダ選択に失敗しました。';
const MSG_UNSUPPORTED_FILES = '対応形式のファイルが選択されていません。';
const MSG_FOLDER_EMPTY = 'フォルダ内に対応形式の音声ファイルが見つかりませんでした。';
const MSG_DIRECTORY_UNSUPPORTED = 'このブラウザではフォルダ選択に対応していません。';
const MSG_DISC_CANCELLED = 'ディスク番号の選択をキャンセルしました。';
const MSG_START_WRITE = '書き込みを開始します...';
const MSG_FINISHED = 'タグ書き込みが完了しました。';
const LABEL_FILE = 'ファイル';
const LABEL_ASSIGN = '割り当てトラック';
const LABEL_STATUS = '状態';
const LABEL_FILE_SELECT = 'ファイル選択';
const LABEL_FOLDER_SELECT = 'フォルダ選択';
const LABEL_RESET = 'リセット';
const LABEL_OPEN_OPTIONS = '▼ 詳細設定を開く';
const LABEL_CLOSE_OPTIONS = '▲ 詳細設定を閉じる';
const LABEL_EMBED_COVER = 'ジャケット画像を埋め込む (2MBまで)';
const LABEL_RENAME = 'タグ書き込み時にファイル名をリネームする';
const LABEL_UNASSIGNED = '未割り当て';
const LABEL_PENDING = '待機中';
const LABEL_NOT_ASSIGNED = 'トラック未割り当て';
const LABEL_SKIPPED = 'スキップ';
const LABEL_NOT_FOUND = '割り当てトラックが見つかりません';
const LABEL_PROCESSING = '処理中...';
const LABEL_DONE = '書き込み完了';
const LABEL_WRITE = 'タグ書き込み';
const PANEL_TITLE = 'このアルバム情報でタグを書き込み';
const PANEL_DESCRIPTION = 'このアルバム情報を使ってローカル音楽ファイルへタグを書き込めます。音楽ファイルはサーバーへアップロードされません。';
const PANEL_RENAME_HELP = '利用可能: %track%, %disc%, %title%, %artist%, %album%, %album_artist%, %year%, %catalog_number% と $num(%track%,2) のようなゼロ埋め関数。';
const PANEL_SINGLE_HELP = '単体ファイル選択時は、タグ書き込み開始後に曲数分の保存ダイアログが表示されます。キャンセルした曲はスキップされます。';
const PANEL_FOLDER_HELP = 'フォルダ選択時は、各楽曲と同じ階層に「アルバム名」フォルダを作成し、その中へタグ書き込み済みファイルを出力します（元ファイルは保持）。';
const PANEL_DANGER = 'ファイルが破損しても当サイトは一切の責任を負いません。必ず元のファイルをバックアップしてから実行してください。';

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const support = useMemo(() => mounted ? detectTagWriteSupport() : { supported: false, reason: '' }, [mounted]);
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
    if (typeof window === 'undefined') return '/taglib-web.wasm';
    return new URL('/taglib-web.wasm', window.location.origin).toString();
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
    const worker = new Worker(new URL('@/lib/workers/tagWriter.worker.js', import.meta.url));
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
    worker.onerror = () => setWorkerError('タグ書き込みエンジンの起動に失敗しました。ページを再読み込みしてからお試しください。');

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
    if (!response.ok) throw new Error(`ジャケット画像の取得に失敗しました。 (HTTP ${response.status})`);
    const blob = await response.blob();
    if (blob.size > MAX_ARTWORK_BYTES) throw new Error('ジャケット画像が大きすぎます。2MB以下にしてください。');
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
          setTagError('このブラウザは単体ファイル選択時のリネーム保存ダイアログに対応していません。');
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
            setTagError(`リネーム結果が空です（${row.name}）。リネーム形式を見直してください。`);
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
          setTagMessage(`${row.name} の保存先を選択してください...`);
          try {
            const saveHandle = await window.showSaveFilePicker({ suggestedName, excludeAcceptAllOption: true, types: [{ description: 'Audio files', accept: { 'audio/mpeg': ['.mp3'], 'audio/flac': ['.flac'], 'audio/mp4': ['.m4a'] } }] });
            singleFileSavePlans.set(row.key, { saveHandle, suggestedName });
          } catch (pickerError) {
            if (pickerError?.name === 'AbortError') singleFileSavePlans.set(row.key, { skipReason: '保存先の選択をキャンセルしたためスキップ' });
            else {
              const detail = pickerError instanceof Error ? pickerError.message : String(pickerError ?? '');
              singleFileSavePlans.set(row.key, { skipReason: `保存ダイアログを開けなかったためスキップ${detail ? ` (${detail})` : ''}` });
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
      setTagMessage(`${row.name} を処理中...`);
      try {
        const permissionMode = renameOnWrite && !row.directoryHandle ? 'read' : 'readwrite';
        const permission = await row.handle.requestPermission?.({ mode: permissionMode });
        if (permission && permission !== 'granted') throw new Error(permissionMode === 'read' ? '読み取り権限が許可されませんでした。' : '書き込み権限が許可されませんでした。');
        const file = await row.handle.getFile();
        const fileBuffer = await file.arrayBuffer();
        const tags = buildTagPayload(album, track, releaseYear, trackTotalByDisk, discTotal);
        const result = await callWorker('WRITE_TAGS', { fileBytes: fileBuffer, fileName: file.name, tags, artwork: artwork ? { mimeType: artwork.mimeType, bytes: artwork.bytes.slice() } : null }, (payload) => setTagMessage(`${row.name}: ${payload?.message ?? LABEL_PROCESSING}`), [fileBuffer]);
        const outputBytes = result?.fileBytes instanceof Uint8Array ? result.fileBytes : new Uint8Array(result?.fileBytes ?? []);
        let renamedTo = '';
        let renameSuffixApplied = false;
        let outputName = row.name;
        let outputRelativePath = row.relativePath || row.name;
        let outputLocationMessage = '';

        if (row.directoryHandle) {
          const dirPermission = await row.directoryHandle.requestPermission?.({ mode: 'readwrite' });
          if (dirPermission && dirPermission !== 'granted') throw new Error('保存先フォルダの書き込み権限が許可されませんでした。');
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
            if (!sanitized) throw new Error('リネーム結果が空です。リネーム形式を見直してください。');
            const ext = row.name.includes('.') ? `.${row.name.split('.').pop()}` : '';
            desiredOutputName = `${sanitized}${ext}`;
          }
          const outputDir = await row.directoryHandle.getDirectoryHandle(outputAlbumFolderName, { create: true });
          const targetName = await resolveUniqueFileName(outputDir, desiredOutputName, '');
          if (targetName !== desiredOutputName) renameSuffixApplied = true;
          const targetHandle = await outputDir.getFileHandle(targetName, { create: true });
          const writable = await targetHandle.createWritable();
          await writable.write(outputBytes); await writable.close(); 
          outputName = targetName;
          if (renameOnWrite && targetName.toLowerCase() !== String(row.name ?? '').toLowerCase()) {
            renamedTo = targetName;
          }
          const normalizedRelative = String(row.relativePath || row.name || '').replace(/\\/g, '/');
          const slashIndex = normalizedRelative.lastIndexOf('/');
          const parentPath = slashIndex >= 0 ? normalizedRelative.slice(0, slashIndex) : '';
          outputRelativePath = parentPath ? `${parentPath}/${outputAlbumFolderName}/${targetName}` : `${outputAlbumFolderName}/${targetName}`;
          outputLocationMessage = ` / 出力先: ${outputRelativePath}`;
        } else {
          const plan = singleFileSavePlans.get(row.key);
          if (plan?.skipReason) {
            updateTagFile(row.key, { status: 'skipped', message: plan.skipReason });
            done += 1; setTagProgress(Math.round((done / targets.length) * 100));
            continue;
          }
          if (plan?.saveHandle) {
            const writable = await plan.saveHandle.createWritable();
            await writable.write(outputBytes); await writable.close(); 
            outputName = plan.suggestedName || row.name;
            outputRelativePath = outputName;
            outputLocationMessage = ` / 出力先: ${outputName}`;
            renamedTo = outputName;
          } else {
            const permissionResult = await row.handle.requestPermission?.({ mode: 'readwrite' });
            if (permissionResult && permissionResult !== 'granted') throw new Error('書き込み権限が許可されませんでした。');
            const writable = await row.handle.createWritable();
            await writable.write(outputBytes); await writable.close();
          }
        }
        const warningCount = Array.isArray(result?.warnings) ? result.warnings.length : 0;
        const renameMessage = renamedTo ? ` / リネーム: ${renamedTo}${renameSuffixApplied ? '（連番付与）' : ''}` : '';
        updateTagFile(row.key, { 
          status: warningCount > 0 ? 'warning' : 'success', 
          message: warningCount > 0 
            ? `完了（警告 ${warningCount} 件）${renameMessage}${outputLocationMessage}` 
            : `書き込み完了${renameMessage}${outputLocationMessage}`
        });
      } catch (caughtError) {
        console.error(caughtError);
        updateTagFile(row.key, { status: 'error', message: caughtError instanceof Error ? caughtError.message : '書き込みに失敗しました。' });
      }
      done += 1;
      setTagProgress(Math.round((done / targets.length) * 100));
    }
    setTagMessage(MSG_FINISHED);
    setIsWriting(false);
  };

  if (!album) return null;

  return (
    <div className={panelClass + " mt-6"}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{PANEL_TITLE}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {PANEL_DESCRIPTION}
          </p>
          {support.supported && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsTagOptionExpanded((prev) => !prev)}
                disabled={isWriting}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                {shouldShowTagOptionDetails ? LABEL_CLOSE_OPTIONS : LABEL_OPEN_OPTIONS}
              </button>
            </div>
          )}
        </div>

        {support.supported && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSelectFiles}
              disabled={!workerReady || isWriting}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 text-sm font-black text-emerald-600 shadow-sm transition hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
            >
              <File className="h-5 w-5" />
              {LABEL_FILE_SELECT}
            </button>
            <button
              type="button"
              onClick={handleSelectFolder}
              disabled={!workerReady || isWriting}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-6 text-sm font-black text-sky-600 shadow-sm transition hover:bg-sky-500/20 disabled:opacity-50 dark:text-sky-400"
            >
              <FolderOpen className="h-5 w-5" />
              {LABEL_FOLDER_SELECT}
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
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-200 dark:bg-white/5 px-5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {LABEL_RESET}
            </button>
          </div>
        )}
      </div>

      {support.supported && shouldShowTagOptionDetails && (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="space-y-4 shrink-0">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 dark:border-white/10 bg-white/20 text-sky-500 focus:ring-sky-500/20"
                  checked={embedCover}
                  onChange={(e) => setEmbedCover(e.target.checked)}
                  disabled={!album?.cover_image_url || isWriting}
                />
                <span className="text-sm font-bold text-slate-700 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{LABEL_EMBED_COVER}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group pt-2">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 dark:border-white/10 bg-white/20 text-sky-500 focus:ring-sky-500/20"
                  checked={renameOnWrite}
                  onChange={(e) => setRenameOnWrite(e.target.checked)}
                  disabled={isWriting}
                />
                <span className="text-sm font-bold text-slate-700 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{LABEL_RENAME}</span>
              </label>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-3">
                <input
                  type="text"
                  value={renamePattern}
                  onChange={(e) => setRenamePattern(e.target.value)}
                  disabled={!renameOnWrite || isWriting}
                  className="w-full h-14 rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-black/40 px-6 text-base font-bold backdrop-blur-xl focus:ring-4 focus:ring-sky-500/10 transition-all outline-none disabled:opacity-30"
                  placeholder="$num(%track%,2) %title%"
                />
                <p className="text-xs font-bold text-slate-500 dark:text-white/40 leading-relaxed">
                  {PANEL_RENAME_HELP}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {renameOnWrite && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400/80 leading-relaxed">
                {PANEL_SINGLE_HELP}
              </p>
            )}
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400/80 leading-relaxed">
              {PANEL_FOLDER_HELP}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 dark:bg-red-900/10">
            <p className="text-xs font-bold text-red-600 dark:text-red-400/80 leading-relaxed text-center sm:text-left">
              {PANEL_DANGER}
            </p>
          </div>
        </div>
      )}

      {!support.supported && <div className="mt-8 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 text-sm font-bold text-amber-600 dark:text-amber-400">{support.reason}</div>}
      {workerError && <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-black text-red-600 dark:text-red-400">{workerError}</div>}
      {tagError && <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-black text-red-600 dark:text-red-400">{tagError}</div>}
      {tagMessage && <div className="mt-4 text-xs font-black tracking-widest text-slate-500 dark:text-white/40 uppercase animate-pulse">{tagMessage}</div>}

      {(isWriting || tagProgress > 0) && (
        <div className="mt-6 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
          <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-300" style={{ width: `${tagProgress}%` }} />
        </div>
      )}

      {support.supported && tagFiles.length > 0 && (
        <div className="mt-10 space-y-6">
          <div className={tableCardClass}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className={tableHeadCellClass}>{LABEL_FILE}</th>
                  <th className={tableHeadCellClass}>{LABEL_ASSIGN}</th>
                  <th className={tableHeadCellClass}>{LABEL_STATUS}</th>
                </tr>
              </thead>
              <tbody>
                {tagFiles.map((f) => (
                  <tr key={f.key} className={tableRowClass}>
                    <td className={tableCellClass}>
                      <div className="font-black text-slate-700 dark:text-white/70 truncate max-w-xs" title={f.name}>{f.name}</div>
                      <div className="text-[10px] font-black text-slate-400 dark:text-white/20 mt-1 uppercase tracking-widest">{formatFileSize(f.size)}</div>
                    </td>
                    <td className={tableCellClass}>
                      <select
                        value={f.trackId}
                        disabled={isWriting}
                        onChange={(e) =>
                          updateTagFile(f.key, {
                            trackId: e.target.value,
                            status: 'pending',
                            message: e.target.value ? LABEL_PENDING : LABEL_NOT_ASSIGNED,
                          })
                        }
                        className="w-full h-10 rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-black/20 px-4 text-xs font-black backdrop-blur-xl focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                      >
                        <option value="">{LABEL_UNASSIGNED}</option>
                        {taggableTracks.map((t) => (
                          <option key={t.__tagId} value={String(t.__tagId)}>
                            Disc {t.disk_number ?? 1} / Tr {t.track_number ?? '-'}: {t.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={tableCellClass}>
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${f.status === 'success' ? 'bg-emerald-500 text-white' : f.status === 'error' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'}`}>
                          {f.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 leading-relaxed">{f.message}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleWriteTags}
              disabled={!support.supported || !workerReady || isWriting || tagFiles.length === 0}
              className="inline-flex h-14 items-center gap-3 rounded-full bg-emerald-500 px-10 text-sm font-black text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_15px_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              {isWriting ? <Loader2 className="w-5 h-5 animate-spin" /> : <WandSparkles className="w-5 h-5" />}
              {LABEL_WRITE}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
