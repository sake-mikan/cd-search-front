import { useParams, useNavigate, useLocation } from 'react-router-dom';

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 一覧から渡されたアルバム名（なければ保険）
  const albumTitle = location.state?.title ?? `アルバム ID: ${id}`;

  // 仮の固定データ
  const tracks = [
    { no: 1, title: 'Track One', composer: 'Composer A', time: '4:12' },
    { no: 2, title: 'Track Two', composer: 'Composer B', time: '3:45' },
    { no: 3, title: 'Track Three', composer: 'Composer A', time: '5:01' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded shadow p-6
                      text-gray-900 dark:text-gray-100">

        {/* アルバム名 */}
        <h1 className="text-2xl font-bold mb-4">
          {albumTitle}
        </h1>

        {/* 楽曲一覧 */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="border px-3 py-2">#</th>
              <th className="border px-3 py-2">曲名</th>
              <th className="border px-3 py-2">作曲</th>
              <th className="border px-3 py-2">時間</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map(t => (
              <tr
                key={t.no}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <td className="border px-3 py-2">{t.no}</td>
                <td className="border px-3 py-2">{t.title}</td>
                <td className="border px-3 py-2 text-gray-600 dark:text-gray-300">
                  {t.composer}
                </td>
                <td className="border px-3 py-2">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 戻るボタン */}
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          一覧に戻る
        </button>
      </div>
    </div>
  );
}
