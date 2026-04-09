import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import AlbumDetail from './pages/AlbumDetail';
import AlbumCorrectionRequest from './pages/AlbumCorrectionRequest';
import ArtistAlbums from './pages/ArtistAlbums';
import ArtistTracks from './pages/ArtistTracks';
import ContentSearch from './pages/ContentSearch';
import HomePage from './pages/HomePage';
import MusicBrainzAlbumDetail from './pages/MusicBrainzAlbumDetail';
import SeriesAlbums from './pages/SeriesAlbums';
import SitePolicy from './pages/SitePolicy';
import TrackSearch from './pages/TrackSearch';

const THEME_STORAGE_KEY = 'theme-preference';

export default function App() {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const dark = themeMode === 'dark' || (themeMode === 'system' && mediaQuery.matches);
      document.documentElement.classList.toggle('dark', dark);
      setIsDarkMode(dark);
    };

    applyTheme();

    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme();
      }
    };

    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleChange);
    else mediaQuery.addListener(handleChange);

    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleChange);
      else mediaQuery.removeListener(handleChange);
    };
  }, [themeMode]);

  useEffect(() => {
    if (themeMode === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentDark = themeMode === 'dark' || (themeMode === 'system' && systemDark);
    setThemeMode(currentDark ? 'light' : 'dark');
  };

  const sharedProps = {
    isDarkMode,
    onToggleTheme: toggleTheme,
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage {...sharedProps} />} />
      <Route path="/tracks" element={<TrackSearch {...sharedProps} />} />
      <Route path="/contents" element={<ContentSearch {...sharedProps} />} />
      <Route path="/site-policy" element={<SitePolicy {...sharedProps} />} />
      <Route path="/albums/:id" element={<AlbumDetail {...sharedProps} />} />
      <Route path="/albums/:id/correction-request" element={<AlbumCorrectionRequest {...sharedProps} />} />
      <Route path="/albums/musicbrainz/:id" element={<MusicBrainzAlbumDetail {...sharedProps} />} />
      <Route path="/artists/:id/tracks" element={<ArtistTracks {...sharedProps} />} />
      <Route path="/artists/:id/albums" element={<ArtistAlbums {...sharedProps} />} />
      <Route path="/series/:id/albums" element={<SeriesAlbums {...sharedProps} />} />
    </Routes>
  );
}
