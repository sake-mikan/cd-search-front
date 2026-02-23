import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { buildApiUrl } from '../api/baseUrl';

export default function ArtistTracks({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams(); // artist id
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
      setError('関連楽曲一覧の取得に失敗しました。');
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
  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

  const roleLabel = (r) => {
    if (r === 'vocal') return '歌唱';
    if (r === 'lyricist') return '作詞';
    if (r === 'composer') return '作曲';
    if (r === 'arranger') return '編曲';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-3 pb-6 pt-4 sm:p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{artistName} の関連楽曲</h1>
            {role && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                絞り込み: {roleLabel(role)}（{role}）
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
                    曲名
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">
                    アルバム
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left w-40">
                    形態
                  </th>
                </tr>
              </thead>

              <tbody>
                {tracks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">
                      {t.title}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      {t.album?.id ? (
                        <Link
                          to={`/albums/${t.album.id}`}
                          className="text-blue-600 dark:text-sky-400 hover:underline underline-offset-4"
                        >
                          {t.album.title}
                        </Link>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      {t.album?.edition ?? '-'}
                    </td>
                  </tr>
                ))}

                {tracks.length === 0 && (
                  <tr>
                    <td
                      className="border border-gray-300 dark:border-gray-600 px-3 py-6 text-center text-gray-600 dark:text-gray-300"
                      colSpan={3}
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
    </div>
  );
}
