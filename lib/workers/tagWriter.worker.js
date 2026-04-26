import { PICTURE_TYPE_VALUES, TagLib } from '../vendor/taglib-browser.js';

let tagLibPromise = null;
let configuredWasmUrl = new URL('/taglib-web.wasm', self.location.origin).toString();

function resolveWasmUrl(raw) {
  if (!raw) return new URL('/taglib.wasm', self.location.origin).toString();
  try {
    return new URL(String(raw), self.location.origin).toString();
  } catch {
    return new URL('/taglib.wasm', self.location.origin).toString();
  }
}

async function verifyWasmHeader(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`WASMファイルの取得に失敗しました (HTTP ${res.status})`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  const valid =
    bytes.length >= 4 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x61 &&
    bytes[2] === 0x73 &&
    bytes[3] === 0x6d;

  if (!valid) {
    const head = Array.from(bytes.slice(0, 4))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    throw new Error(`WASMファイルが不正です (先頭: ${head}, URL: ${url})`);
  }
}

function ensureTagLib() {
  if (!tagLibPromise) {
    tagLibPromise = (async () => {
      await verifyWasmHeader(configuredWasmUrl);
      return TagLib.initialize({ wasmUrl: configuredWasmUrl });
    })();
  }
  return tagLibPromise;
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new Error('Invalid binary payload.');
}

function textOrEmpty(value) {
  if (value == null) return '';
  return String(value).trim();
}

function toPositiveIntOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

function pairValue(mainValue, totalValue) {
  const main = toPositiveIntOrNull(mainValue);
  const total = toPositiveIntOrNull(totalValue);
  if (!main && !total) return '';
  if (main && total) return `${main}/${total}`;
  if (main) return String(main);
  return `0/${total}`;
}

function setPropertySafe(audioFile, warnings, key, value) {
  const text = textOrEmpty(value);
  if (text === '') return;
  try {
    audioFile.setProperty(key, text);
  } catch (error) {
    warnings.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getFirstProperty(properties, key) {
  const value = properties?.[key];
  if (Array.isArray(value)) return value[0] ?? '';
  if (value == null) return '';
  return String(value);
}

function readTagSnapshot(audioFile) {
  const tag = audioFile.tag();
  const properties = audioFile.properties?.() ?? {};

  return {
    title: tag.title ?? '',
    artist: tag.artist ?? '',
    album: tag.album ?? '',
    comment: tag.comment ?? '',
    genre: tag.genre ?? '',
    year: tag.year ?? '',
    track: tag.track ?? '',
    albumArtist: getFirstProperty(properties, 'ALBUMARTIST'),
    composer: getFirstProperty(properties, 'COMPOSER'),
    arranger: getFirstProperty(properties, 'ARRANGER'),
    lyricist: getFirstProperty(properties, 'LYRICIST'),
    isrc: getFirstProperty(properties, 'ISRC'),
    date: getFirstProperty(properties, 'DATE'),
    disc: getFirstProperty(properties, 'DISCNUMBER'),
    trackRaw: getFirstProperty(properties, 'TRACKNUMBER'),
  };
}

function postProgress(id, percent, message, fileName = '') {
  self.postMessage({
    id,
    type: 'PROGRESS',
    payload: { percent, message, fileName },
  });
}

async function handleReadTags(id, payload) {
  const taglib = await ensureTagLib();
  const fileBytes = toUint8Array(payload?.fileBytes);
  const fileName = textOrEmpty(payload?.fileName);

  postProgress(id, 10, 'Reading tags...', fileName);
  const audioFile = await taglib.open(fileBytes);
  try {
    if (!audioFile.isValid()) {
      throw new Error('File is not recognized as a supported audio file.');
    }
    postProgress(id, 70, 'Parsing metadata...', fileName);
    const tags = readTagSnapshot(audioFile);
    return {
      format: audioFile.getFormat(),
      tags,
    };
  } finally {
    audioFile.dispose();
  }
}

async function handleWriteTags(id, payload) {
  const taglib = await ensureTagLib();
  const fileBytes = toUint8Array(payload?.fileBytes);
  const tags = payload?.tags ?? {};
  const artwork = payload?.artwork ?? null;
  const fileName = textOrEmpty(payload?.fileName);
  const warnings = [];

  postProgress(id, 5, 'Loading file...', fileName);
  const audioFile = await taglib.open(fileBytes);

  try {
    if (!audioFile.isValid()) {
      throw new Error('File is not recognized as a supported audio file.');
    }

    postProgress(id, 25, 'Writing metadata...', fileName);
    const tag = audioFile.tag();

    tag.setTitle(textOrEmpty(tags.title));
    tag.setArtist(textOrEmpty(tags.artist));
    tag.setAlbum(textOrEmpty(tags.album));
    tag.setComment(textOrEmpty(tags.comment));
    tag.setGenre(textOrEmpty(tags.genre));

    const yearValue = toPositiveIntOrNull(tags.year);
    if (yearValue) tag.setYear(yearValue);

    const trackValue = toPositiveIntOrNull(tags.track);
    if (trackValue) tag.setTrack(trackValue);

    setPropertySafe(audioFile, warnings, 'ALBUMARTIST', tags.albumArtist);
    setPropertySafe(audioFile, warnings, 'PUBLISHER', tags.publisher);
    setPropertySafe(audioFile, warnings, 'COMPOSER', tags.composer);
    setPropertySafe(audioFile, warnings, 'ARRANGER', tags.arranger);
    setPropertySafe(audioFile, warnings, 'LYRICIST', tags.lyricist);
    setPropertySafe(audioFile, warnings, 'ISRC', tags.isrc);
    setPropertySafe(audioFile, warnings, 'DATE', tags.date);

    const discNumberValue = pairValue(tags.disc, tags.discTotal);
    setPropertySafe(audioFile, warnings, 'DISCNUMBER', discNumberValue);

    const trackNumberValue = pairValue(tags.track, tags.trackTotal);
    setPropertySafe(audioFile, warnings, 'TRACKNUMBER', trackNumberValue);

    if (artwork?.bytes) {
      postProgress(id, 55, 'Embedding artwork...', fileName);
      const imageBytes = toUint8Array(artwork.bytes);
      if (imageBytes.byteLength > 0) {
        audioFile.setPictures([
          {
            mimeType: textOrEmpty(artwork.mimeType) || 'image/jpeg',
            data: imageBytes,
            type: PICTURE_TYPE_VALUES.FrontCover,
            description: 'Cover',
          },
        ]);
      }
    }

    postProgress(id, 80, 'Saving changes...', fileName);
    if (!audioFile.save()) {
      throw new Error('Failed to save metadata.');
    }

    const outputBytes = audioFile.getFileBuffer().slice();
    postProgress(id, 100, 'Completed.', fileName);

    return {
      fileBytes: outputBytes,
      format: audioFile.getFormat(),
      warnings,
    };
  } finally {
    audioFile.dispose();
  }
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data ?? {};
  if (id == null || typeof type !== 'string') return;

  try {
    if (type === 'INIT') {
      configuredWasmUrl = resolveWasmUrl(payload?.wasmUrl);
      tagLibPromise = null;
      await ensureTagLib();
      self.postMessage({
        id,
        type: 'DONE',
        payload: { initialized: true, wasmUrl: configuredWasmUrl },
      });
      return;
    }

    if (type === 'READ_TAGS') {
      const result = await handleReadTags(id, payload);
      self.postMessage({ id, type: 'DONE', payload: result });
      return;
    }

    if (type === 'WRITE_TAGS') {
      const result = await handleWriteTags(id, payload);
      self.postMessage({ id, type: 'DONE', payload: result }, [result.fileBytes.buffer]);
      return;
    }

    throw new Error(`Unsupported worker message: ${type}`);
  } catch (error) {
    self.postMessage({
      id,
      type: 'ERROR',
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
};
