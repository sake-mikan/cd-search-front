import axios from 'axios';
import { getApiBaseUrl } from './baseUrl';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 7000,
});

export const fetchAlbums = (params) => {
  return api.get('/albums', { params });
};
