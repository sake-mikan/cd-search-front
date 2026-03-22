import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRoutePath } from '../utils/albumPublicId';

function membersText(value) {
  if (!Array.isArray(value)) return '';
  return value
    .map((row) => String(row?.name ?? '').trim())
    .filter((name) => name !== '')
    .join(', ');
}

export default function ArtistAlbums({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = useMemo(() => buildApiUrl(`/artists/${id}/albums`), [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (e) {
        console.error(e);
        setError('アルバム一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiUrl]);

  const albums = Array.isArray(data?.albums) ? data.albums : [];
  const artistName = data?.artist?.name ?? `Artist ID: ${id}`;
  const isUnit = String(data?.artist?.type ?? '') === 'unit';
  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

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
            <h1 className="text-2xl font-bold">{artistName} のアルバム一覧</h1>
            {isUnit && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                この画面では、ユニット名で登録されているアルバムと、そのアルバム時点の所属メンバーを確認できます。
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
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              戻る
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-4 rounded bg-gray-100 dark:bg-gray-700">読み込み中...</div>
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
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">アルバム</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-40">規格品番</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-32">形態</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-32">発売日</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-40">JAN</th>
                  {isUnit && <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">所属メンバー</th>}
                </tr>
              </thead>

              <tbody>
                {albums.map((album) => (
                  <tr key={album.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      <Link
                        to={getAlbumRoutePath(album)}
                        className="text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                      >
                        {album.title}
                      </Link>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">{album.catalog_number ?? '-'}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">{album.edition ?? '-'}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">{album.release_date ?? '-'}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">{album.jan ?? '-'}</td>
                    {isUnit && (
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                        {membersText(album.unit_members) || '-'}
                      </td>
                    )}
                  </tr>
                ))}

                {albums.length === 0 && (
                  <tr>
                    <td
                      className="border border-gray-300 dark:border-gray-600 px-3 py-6 text-center text-gray-600 dark:text-gray-300"
                      colSpan={isUnit ? 6 : 5}
                    >
                      データがありません
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