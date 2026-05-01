import axios from 'axios';
import { getApiBaseUrl } from '@/utils/baseUrl';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
});

// リクエストごとに最新のベースURLを使用するようにインターセプターを設定（サーバー/クライアント両対応のため）
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

const API_FETCH_PAGE_SIZE = 100;

// Albums
export const fetchAlbums = (params) => api.get('/albums', { params });

export const fetchTracks = (params) => api.get('/tracks', { params });

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
    return { ...firstPage, data: firstItems };
  }

  const pageRequests = [];
  for (let page = 2; page <= lastPage; page += 1) {
    pageRequests.push(fetchAlbums({ ...params, page, per_page: API_FETCH_PAGE_SIZE }));
  }

  const responses = await Promise.all(pageRequests);
  const remainingItems = responses.flatMap((response) =>
    Array.isArray(response.data?.data) ? response.data.data : []
  );

  return { ...firstPage, data: [...firstItems, ...remainingItems] };
};

export const fetchAlbumDetail = async (id) => {
  const response = await api.get(`/albums/${id}`);
  return response.data;
};

// Contents / Series
export const fetchContents = async () => {
  const response = await api.get('/contents');
  return Array.isArray(response.data?.items) ? response.data.items : [];
};

export const fetchSeriesAlbums = async (seriesId) => {
  const response = await api.get(`/series/${seriesId}/albums`);
  return Array.isArray(response.data?.items) ? response.data.items : [];
};

// Artists
export const fetchArtistAlbums = async (artistId) => {
  const response = await api.get(`/artists/${artistId}/albums`);
  return Array.isArray(response.data?.items) ? response.data.items : [];
};

export const fetchArtistTracks = async (artistId) => {
  const response = await api.get(`/artists/${artistId}/tracks`);
  return Array.isArray(response.data?.items) ? response.data.items : [];
};

// MusicBrainz
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
  const response = await api.post(`/musicbrainz/releases/${encodeURIComponent(releaseId)}/request-register`, {}, {
    timeout: 30000,
  });
  return response.data ?? null;
};

// Smartphone JAN scanner sessions
export const createScannerSession = async () => {
  const response = await api.post('/scanner-sessions');
  return response.data ?? null;
};

export const fetchScannerSession = async (sessionId) => {
  const response = await api.get(`/scanner-sessions/${encodeURIComponent(sessionId)}`);
  return response.data ?? null;
};

export const submitScannerSessionJan = async (sessionId, payload) => {
  const response = await api.post(`/scanner-sessions/${encodeURIComponent(sessionId)}/jan`, payload);
  return response.data ?? null;
};

export const consumeScannerSession = async (sessionId) => {
  const response = await api.post(`/scanner-sessions/${encodeURIComponent(sessionId)}/consume`);
  return response.data ?? null;
};

// Correction Requests
export const fetchAlbumCorrectionRequestForm = (albumId) => {
  return api.get(`/albums/${albumId}/correction-request-form`);
};

export const submitAlbumCorrectionRequest = (albumId, payload) => {
  return api.post(`/albums/${albumId}/correction-requests`, payload);
};

// Helper for Home New Releases
export const getNewReleases = async (from, to) => {
  const response = await fetchAlbums({
    release_date_from: from,
    release_date_to: to,
    sort: 'release_date',
    order: 'asc',
    per_page: 100,
  });
  return Array.isArray(response.data?.data) ? response.data.data : [];
};
