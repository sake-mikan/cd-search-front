export function getArtistRouteId(artistLike, fallback = '') {
  const publicId = String(artistLike?.public_id ?? '').trim();
  if (publicId !== '') return publicId;

  const legacyId = artistLike?.id;
  if (legacyId != null && String(legacyId).trim() !== '') {
    return String(legacyId);
  }

  return String(fallback ?? '').trim();
}

export function getArtistAlbumsRoutePath(artistLike, fallback = '') {
  const routeId = getArtistRouteId(artistLike, fallback);
  return routeId !== '' ? `/artists/${routeId}/albums` : '/';
}

export function getArtistTracksRoutePath(artistLike, role = '', fallback = '') {
  const routeId = getArtistRouteId(artistLike, fallback);
  if (routeId === '') return '/';

  const params = new URLSearchParams();
  const normalizedRole = String(role ?? '').trim();
  if (normalizedRole !== '') {
    params.set('role', normalizedRole);
  }

  const qs = params.toString();
  return qs !== '' ? `/artists/${routeId}/tracks?${qs}` : `/artists/${routeId}/tracks`;
}