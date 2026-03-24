import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';

function formatAlbumTitle(album) {
  const title = String(album?.title ?? '').trim();
  const edition = String(album?.edition ?? '').trim();

  if (edition !== '' && edition !== '-') {
    return title !== '' ? `${title}\u3010${edition}\u3011` : `\u3010${edition}\u3011`;
  }

  return title;
}

export default function ArtistTracks({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || '';

  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = useMemo(() => {
    const qs = role ? `?role=${encodeURIComponent(role)}` : '';
    return buildApiUrl(`/artists/${id}/tracks${qs}`);
  }, [id, role]);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      console.error(e);
      setError('\u95a2\u9023\u697d\u66f2\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const tracks = data?.tracks?.data ?? [];
  const artistName = data?.artist?.name ?? `Artist ID: ${id}`;
  const themeLabel = isDarkMode ? '\u30e9\u30a4\u30c8' : '\u30c0\u30fc\u30af';
  const themeTitle = isDarkMode
    ? '\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048'
    : '\u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048';

  const roleLabel = (value) => {
    if (value === 'vocal') return '\u6b4c\u5531';
    if (value === 'lyricist') return '\u4f5c\u8a5e';
    if (value === 'composer') return '\u4f5c\u66f2';
    if (value === 'arranger') return '\u7de8\u66f2';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-3 pb-6 pt-4 sm:p-6 text-gray-900 dark:text-gray-100 relative">
      <button
        type="button"
        onClick={onToggleTheme}
        className="absolute right-3 top-4 z-10 hidden lg:inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 sm:right-6 sm:top-6"
        title={themeTitle}
        aria-label={themeTitle}
      >
        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{themeLabel}</span>
      </button>
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{artistName}{' \u306e\u95a2\u9023\u697d\u66f2'}</h1>
            {role && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {'\u7d5e\u308a\u8fbc\u307f: '}
                {roleLabel(role)}
                {' ('}
                {role}
                {')'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 lg:hidden"
              title={themeTitle}
              aria-label={themeTitle}
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{themeLabel}</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {'\u623b\u308b'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-4 rounded bg-gray-100 dark:bg-gray-700">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">{'\u66f2\u540d'}</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">{'\u30a2\u30eb\u30d0\u30e0'}</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-40">{'\u898f\u683c\u54c1\u756a'}</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-40">{'\u767a\u58f2\u65e5'}</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-40">JAN</th>
                </tr>
              </thead>

              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">
                      {track.title}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      {track.album?.id ? (
                        <Link
                          to={getAlbumRoutePath(track.album)}
                          className="text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                        >
                          {formatAlbumTitle(track.album)}
                        </Link>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      {track.album?.catalog_number ?? '-'}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      {track.album?.release_date ?? '-'}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      {track.album?.jan ?? '-'}
                    </td>
                  </tr>
                ))}

                {tracks.length === 0 && (
                  <tr>
                    <td
                      className="border border-gray-300 dark:border-gray-600 px-3 py-6 text-center text-gray-600 dark:text-gray-300"
                      colSpan={5}
                    >
                      {'\u30c7\u30fc\u30bf\u304c\u3042\u308a\u307e\u305b\u3093'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
