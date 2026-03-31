import axios from 'axios';
import { getApiBaseUrl } from './baseUrl';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 7000,
});
const API_FETCH_PAGE_SIZE = 100;

export const fetchAlbums = (params) => {
  return api.get('/albums', { params });
};

export const fetchAlbumSuggestions = async (field, q, limit = 8) => {
  const response = await api.get('/albums/suggestions', {
    params: { field, q, limit },
  });

  return Array.isArray(response.data?.items) ? response.data.items : [];
};

export const fetchAllAlbums = async (params = {}) => {
  const firstResponse = await fetchAlbums({
    ...params,
    page: 1,
    per_page: API_FETCH_PAGE_SIZE,
  });

  const firstPage = firstResponse.data ?? {};
  const firstItems = Array.isArray(firstPage.data) ? firstPage.data : [];
  const lastPageValue = Number(firstPage.last_page ?? 1);
  const lastPage = Number.isFinite(lastPageValue) && lastPageValue > 1 ? lastPageValue : 1;

  if (lastPage === 1) {
    return {
      ...firstPage,
      data: firstItems,
    };
  }

  const pageRequests = [];
  for (let page = 2; page <= lastPage; page += 1) {
    pageRequests.push(
      fetchAlbums({
        ...params,
        page,
        per_page: API_FETCH_PAGE_SIZE,
      })
    );
  }

  const responses = await Promise.all(pageRequests);
  const remainingItems = responses.flatMap((response) =>
    Array.isArray(response.data?.data) ? response.data.data : []
  );

  return {
    ...firstPage,
    data: [...firstItems, ...remainingItems],
  };
};

export const fetchContents = async () => {
  const response = await api.get('/contents');
  return Array.isArray(response.data?.items) ? response.data.items : [];
};
export const fetchMusicBrainzFallbackAlbums = async (params = {}) => {
  const response = await api.get('/albums/musicbrainz-fallback', {
    params,
    timeout: 15000,
  });

  return Array.isArray(response.data?.items) ? response.data.items : [];
};
export const fetchMusicBrainzAlbumDetail = async (releaseId) => {
  const response = await api.get(`/musicbrainz/releases/${encodeURIComponent(releaseId)}`, {
    timeout: 15000,
  });

  return response.data ?? null;
};

export const registerMusicBrainzAlbum = async (releaseId) => {
  const response = await api.post(`/musicbrainz/releases/${encodeURIComponent(releaseId)}/register`, {}, {
    timeout: 30000,
  });

  return response.data ?? null;
};
