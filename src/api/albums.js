import axios from 'axios';
import { getApiOrigin } from './baseUrl';

const api = axios.create({
  baseURL: getApiOrigin(),
  timeout: 7000,
});

export const fetchAlbums = (params) => {
  return api.get('/api/albums', { params });
};
