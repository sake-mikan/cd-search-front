export function getAlbumRouteId(albumLike, fallback = '') {
  const publicId = String(albumLike?.public_id ?? '').trim();
  if (publicId !== '') return publicId;

  const legacyId = albumLike?.id;
  if (legacyId != null && String(legacyId).trim() !== '') {
    return String(legacyId);
  }

  return String(fallback ?? '').trim();
}

export function getAlbumRoutePath(albumLike, fallback = '') {
  const routeId = getAlbumRouteId(albumLike, fallback);
  return routeId !== '' ? `/albums/${routeId}` : '/';
}