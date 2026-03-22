import axios from 'axios';
import { getApiBaseUrl } from './baseUrl';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 7000,
});

export const fetchAlbumCorrectionRequestForm = (albumId) => {
  return api.get(`/albums/${albumId}/correction-request-form`);
};

export const submitAlbumCorrectionRequest = (albumId, payload) => {
  return api.post(`/albums/${albumId}/correction-requests`, payload);
};