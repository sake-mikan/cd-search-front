const RELEASE_TYPE_LABELS = {
  single: 'Single',
  album: 'Album',
  mini_album: 'Mini Album',
  'mini album': 'Mini Album',
  ep: 'EP',
  'シングル': 'Single',
  'アルバム': 'Album',
  'ミニアルバム': 'Mini Album',
};

function normalizeReleaseType(value) {
  return String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
}

export function formatReleaseTypeLabel(releaseType, releaseTypeLabel) {
  const candidates = [releaseType, releaseTypeLabel];

  for (const candidate of candidates) {
    const raw = String(candidate ?? '').trim();
    if (raw === '') continue;

    const normalized = normalizeReleaseType(raw);
    if (RELEASE_TYPE_LABELS[normalized]) {
      return RELEASE_TYPE_LABELS[normalized];
    }

    if (RELEASE_TYPE_LABELS[raw]) {
      return RELEASE_TYPE_LABELS[raw];
    }

    return raw
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return '';
}
