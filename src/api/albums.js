import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
});

export const fetchAlbums = (params) => {
  return api.get('/albums', { params });
};
