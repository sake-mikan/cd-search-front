const RELEASE_TYPE_LABELS_EN = {
  single: 'Single',
  album: 'Album',
  mini_album: 'Mini Album',
  'mini album': 'Mini Album',
  ep: 'EP',
  シングル: 'Single',
  アルバム: 'Album',
  ミニアルバム: 'Mini Album',
};

const RELEASE_TYPE_LABELS_JA = {
  single: 'シングル',
  album: 'アルバム',
  mini_album: 'ミニアルバム',
  'mini album': 'ミニアルバム',
  ep: 'EP',
  シングル: 'シングル',
  アルバム: 'アルバム',
  ミニアルバム: 'ミニアルバム',
};

function normalizeReleaseType(value) {
  return String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
}

function startCase(value) {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatWithMap(releaseType, releaseTypeLabel, labels) {
  const candidates = [releaseType, releaseTypeLabel];

  for (const candidate of candidates) {
    const raw = String(candidate ?? '').trim();
    if (raw === '') continue;

    const normalized = normalizeReleaseType(raw);
    if (labels[normalized]) {
      return labels[normalized];
    }

    if (labels[raw]) {
      return labels[raw];
    }

    return startCase(raw);
  }

  return '';
}

export function formatReleaseTypeLabel(releaseType, releaseTypeLabel) {
  return formatWithMap(releaseType, releaseTypeLabel, RELEASE_TYPE_LABELS_EN);
}

export function formatReleaseTypeLabelJa(releaseType, releaseTypeLabel) {
  return formatWithMap(releaseType, releaseTypeLabel, RELEASE_TYPE_LABELS_JA);
}
