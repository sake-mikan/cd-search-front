import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Loader2, RotateCcw, Upload, WandSparkles } from 'lucide-react';
import { getApiOrigin } from '../api/baseUrl';

const API_BASE_URL = getApiOrigin();
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
      if (typeof x === 'string') return { id: null, name: x };
      return { id: x?.id ?? null, name: x?.name ?? '' };
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

function buildTagPayload(album, track, releaseYear, trackTotalByDisk, discTotal) {
  const credits = track?.credits ?? {};
  const trackNo = Number(track?.track_number ?? 0);
  const discNo = Number(track?.disk_number ?? 1);
  const yearNo = Number(releaseYear);
  const yearText = Number.isFinite(yearNo) && yearNo > 0 ? String(yearNo) : '';

  return {
    title: String(track?.title ?? ''),
    artist: toPeopleText(credits?.vocal) || String(album?.album_artist?.name ?? ''),
    album: String(album?.title ?? ''),
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

function buildRenameContext(album, track, releaseYear) {
  const credits = track?.credits ?? {};
  return {
    track: Number(track?.track_number ?? 0) || '',
    disc: Number(track?.disk_number ?? 0) || '',
    title: track?.title ?? '',
    artist: toPeopleText(credits?.vocal),
    lyricist: toPeopleText(credits?.lyricist),
    composer: toPeopleText(credits?.composer),
    arranger: toPeopleText(credits?.arranger),
    album: album?.title ?? '',
    album_artist: album?.album_artist?.name ?? '',
    year: releaseYear ?? '',
    release_date: album?.release_date ?? '',
    catalog_number: album?.catalog_number ?? '',
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

export default function AlbumDetail() {
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
  const [renamePattern, setRenamePattern] = useState('$num(%track%,2) %title%');
  const [isTagOptionExpanded, setIsTagOptionExpanded] = useState(false);

  const [copyNotice, setCopyNotice] = useState('');
  const [copiedToken, setCopiedToken] = useState('');
  const copyTimerRef = useRef(null);

  const apiUrl = useMemo(() => {
    const base = (API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    return `${base}/api/albums/${id}`;
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

  const writeClipboard = useCallback(async (text, token, label) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else if (!copyByExecCommand(text)) throw new Error('クリップボードにコピーできませんでした。');
      setCopiedToken(token);
      setCopyNotice(`${label} をコピーしました。`);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopiedToken((prev) => (prev === token ? '' : prev));
      }, 1200);
    } catch (e) {
      setCopyNotice(e.message || 'コピーに失敗しました。');
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

  useEffect(() => {
    setTagFiles([]);
    setTagError('');
    setTagMessage('');
    setTagProgress(0);
    setIsWriting(false);
    setRenameOnWrite(false);
    setIsTagOptionExpanded(false);
    setCopyNotice('');
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

  const albumTitleEditionText = useMemo(() => {
    const title = copyValue(album?.title);
    const edition = copyValue(album?.edition);
    if (title && edition) return `${title} [${edition}]`;
    if (title) return title;
    if (edition) return `[${edition}]`;
    return '';
  }, [album?.title, album?.edition]);

  const allDisplayText = useMemo(() => {
    if (!album) return '';
    const lines = [
      `アルバム: ${showValue(album.title)}`,
      `アルバムアーティスト: ${showValue(album?.album_artist?.name)}`,
      `規格品番: ${showValue(album.catalog_number)}`,
      `形態: ${showValue(album.edition)}`,
      `レーベル: ${showValue(album.label)}`,
      `発売日: ${showValue(album.release_date)}`,
      `リリース年: ${showValue(releaseYear)}`,
      '',
      'Disc\tTr\t曲名\tアーティスト\t作詞\t作曲\t編曲\tジャンル\t時間\tコメント',
    ];
    for (const track of orderedTracks) {
      lines.push(
        [
          showValue(track?.disk_number, ''),
          showValue(track?.track_number, ''),
          showValue(track?.title, ''),
          toPeopleText(track?.credits?.vocal),
          toPeopleText(track?.credits?.lyricist),
          toPeopleText(track?.credits?.composer),
          toPeopleText(track?.credits?.arranger),
          showValue(track?.genre, ''),
          showValue(track?.duration, ''),
          showValue(track?.comment, ''),
        ].join('\t')
      );
    }
    return lines.join('\n');
  }, [album, orderedTracks, releaseYear]);

  const renderCopyIcon = (text, token, label) => {
    const copied = copiedToken === token;
    return (
      <button
        type="button"
        disabled={!text}
        onClick={() => writeClipboard(text, token, label)}
        className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        title={`${label}をコピー`}
        aria-label={`${label}をコピー`}
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
      <div className="flex items-start justify-between gap-2">
        <span className="break-words">
          {list.length === 0 && '-'}
          {list.map((person, idx) => (
            <span key={`${token}-${person.id ?? 'text'}-${idx}`}>
              {person.id ? (
                <Link
                  to={`/artists/${person.id}/tracks?role=${encodeURIComponent(role)}`}
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
    if (!embedCover || !album?.cover_image_url) return null;

    const candidates = [];
    try {
      const parsed = new URL(album.cover_image_url, window.location.origin);
      if (/^\/(images|storage)\//.test(parsed.pathname)) {
        candidates.push(new URL(`${parsed.pathname}${parsed.search}`, window.location.origin).toString());
      }
      candidates.push(parsed.toString());
    } catch {
      candidates.push(String(album.cover_image_url));
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
          throw new Error('ジャケット画像が大きすぎます。2MB以下にしてください。');
        }

        return { mimeType: blob.type || 'image/jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
      } catch (e) {
        lastError = e;
      }
    }

    throw new Error(
      `ジャケット画像の取得に失敗しました。CORSまたは画像URLを確認してください。(${lastError?.message || 'Failed to fetch'})`
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
        const tags = buildTagPayload(album, track, releaseYear, trackTotalByDisk, discTotal);
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
            const context = buildRenameContext(album, track, releaseYear);
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
          const context = buildRenameContext(album, track, releaseYear);
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-2xl font-bold break-words min-w-0">{album?.title ?? `アルバム ID: ${id}`}</h1>
            <div className="inline-flex items-center gap-1 shrink-0">
              <div className="inline-flex items-center rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm">
                <span>形態: {showValue(album?.edition)}</span>
              </div>
              {renderCopyIcon(albumTitleEditionText, 'album-title-edition', 'アルバム名+形態')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => writeClipboard(allDisplayText, 'all', '画面表示データ')}
              disabled={!allDisplayText}
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              <Copy className="w-4 h-4" />
              表示データをコピー
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              一覧へ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4 mb-6">
          <div className="w-40 h-40 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            {album?.cover_image_url ? (
              <img
                src={album.cover_image_url}
                alt={album.title ?? 'album cover'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-300">No Image</span>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
              <span className="text-left text-gray-500 dark:text-gray-300">アルバムアーティスト</span>
              <div className="inline-flex max-w-full items-start gap-2">
                <span className="min-w-0 break-words text-left">{showValue(album?.album_artist?.name)}</span>
                {renderCopyIcon(copyValue(album?.album_artist?.name), 'album-artist', 'アルバムアーティスト')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">規格品番</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(album?.catalog_number)}</span>
                  {renderCopyIcon(copyValue(album?.catalog_number), 'album-catalog', '規格品番')}
                </div>
              </div>
              <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">レーベル</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(album?.label)}</span>
                  {renderCopyIcon(copyValue(album?.label), 'album-label', 'レーベル')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">発売日</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(album?.release_date)}</span>
                  {renderCopyIcon(copyValue(album?.release_date), 'album-release-date', '発売日')}
                </div>
              </div>
              <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 items-start border-b border-gray-200/70 dark:border-gray-700/70 py-1">
                <span className="text-left text-gray-500 dark:text-gray-300">リリース年</span>
                <div className="inline-flex max-w-full items-start gap-2">
                  <span className="min-w-0 break-words text-left">{showValue(releaseYear)}</span>
                  {renderCopyIcon(copyValue(releaseYear), 'album-release-year', 'リリース年')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {copyNotice && (
          <div className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">{copyNotice}</div>
        )}

        <div className="rounded border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <h2 className="text-lg font-bold">このアルバム情報でタグを書き込み</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectFiles}
                disabled={!support.supported || !workerReady || isWriting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                ファイル選択
              </button>
              <button
                type="button"
                onClick={handleSelectFolder}
                disabled={!support.supported || !workerReady || isWriting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" />
                リセット
              </button>
            </div>
          </div>

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

          {shouldShowTagOptionDetails && (
            <>
              <div className="mt-3 flex flex-col items-start gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={embedCover}
                    onChange={(e) => setEmbedCover(e.target.checked)}
                    disabled={!album?.cover_image_url || isWriting}
                  />
                  ジャケット画像を埋め込む（2MBまで）
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={renameOnWrite}
                    onChange={(e) => setRenameOnWrite(e.target.checked)}
                    disabled={isWriting}
                  />
                  タグ書き込み時にファイル名をリネームする
                </label>

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

          {tagFiles.length > 0 && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="border px-2 py-2 text-left min-w-[260px]">ファイル</th>
                      <th className="border px-2 py-2 text-left min-w-[260px]">割り当てトラック</th>
                      <th className="border px-2 py-2 text-left min-w-[200px]">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagFiles.map((f) => (
                      <tr key={f.key} className="hover:bg-gray-100 dark:hover:bg-gray-700 align-top">
                        <td className="border px-2 py-2">
                          <div className="font-medium">{f.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(f.size)}</div>
                        </td>
                        <td className="border px-2 py-2">
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
                        <td className="border px-2 py-2">
                          <div className="font-semibold">{f.status}</div>
                          <div className="text-gray-700 dark:text-gray-300">{f.message}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleWriteTags}
                  disabled={!support.supported || !workerReady || isWriting || tagFiles.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border px-3 py-2 text-left w-16">Tr</th>
                        <th className="border px-3 py-2 text-left min-w-[220px]">曲名</th>
                        <th className="border px-3 py-2 text-left min-w-[180px]">アーティスト</th>
                        <th className="border px-3 py-2 text-left min-w-[180px]">作詞</th>
                        <th className="border px-3 py-2 text-left min-w-[180px]">作曲</th>
                        <th className="border px-3 py-2 text-left min-w-[180px]">編曲</th>
                        <th className="border px-3 py-2 text-left min-w-[140px]">ジャンル</th>
                        <th className="border px-3 py-2 text-left w-24">時間</th>
                        <th className="border px-3 py-2 text-left min-w-[200px]">コメント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track) => (
                        <tr key={track.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          <td className="border px-3 py-2">{showValue(track.track_number)}</td>
                          <td className="border px-3 py-2">{renderTrackField(track.title, `t-${track.id}-title`, '曲名')}</td>
                          <td className="border px-3 py-2">{renderLinkedPeopleField(track?.credits?.vocal, `t-${track.id}-artist`, 'アーティスト', 'vocal')}</td>
                          <td className="border px-3 py-2">{renderLinkedPeopleField(track?.credits?.lyricist, `t-${track.id}-lyricist`, '作詞', 'lyricist')}</td>
                          <td className="border px-3 py-2">{renderLinkedPeopleField(track?.credits?.composer, `t-${track.id}-composer`, '作曲', 'composer')}</td>
                          <td className="border px-3 py-2">{renderLinkedPeopleField(track?.credits?.arranger, `t-${track.id}-arranger`, '編曲', 'arranger')}</td>
                          <td className="border px-3 py-2 whitespace-nowrap">{renderTrackField(track.genre, `t-${track.id}-genre`, 'ジャンル')}</td>
                          <td className="border px-3 py-2">{showValue(track.duration)}</td>
                          <td className="border px-3 py-2">{renderTrackField(track.comment, `t-${track.id}-comment`, 'コメント')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && !error && discGroups.length === 0 && (
          <div className="border px-3 py-6 text-center text-gray-600 dark:text-gray-300">トラック情報がありません</div>
        )}
      </div>
    </div>
  );
}
