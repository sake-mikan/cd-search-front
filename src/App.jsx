import { useEffect, useState } from 'react';
import { fetchAlbums } from './api/albums';
import { Routes, Route, Link } from 'react-router-dom';
import AlbumDetail from './pages/AlbumDetail';


function App() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [sort, setSort] = useState('release_date');
  const [order, setOrder] = useState('desc');

  const loadAlbums = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchAlbums({
        title,
        catalog_number: catalogNumber,
        page,
        sort,
        order,
      });

      setAlbums(response.data.data);
      setCurrentPage(response.data.current_page);
      setLastPage(response.data.last_page);
    } catch {
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums(1);
  }, []);

  const changePage = (page) => {
    if (page < 1 || page > lastPage) return;
    loadAlbums(page);
  };

  const changeSort = (newSort) => {
    if (sort === newSort) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(newSort);
      setOrder('asc');
    }
    loadAlbums(1);
  };

  const renderPages = () => {
    const pages = [];
    for (let i = 1; i <= lastPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => changePage(i)}
          disabled={i === currentPage}
          className={`px-3 py-1 rounded border
            ${i === currentPage
              ? 'bg-blue-600 text-white cursor-default'
              : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }
          `}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <Routes>
      <Route path="/" element={(
        <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-6">
          <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">CD一覧</h1>

            {/* 検索フォーム */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadAlbums(1);
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
            >
              <input
                className="border rounded px-3 py-2 bg-white dark:bg-gray-700"
                placeholder="タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="border rounded px-3 py-2 bg-white dark:bg-gray-700"
                placeholder="商品番号"
                value={catalogNumber}
                onChange={(e) => setCatalogNumber(e.target.value)}
              />
              <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
                検索
              </button>
            </form>

            {loading && <p className="text-gray-400">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {/* テーブル */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th
                    className="border px-4 py-2 cursor-pointer"
                    onClick={() => changeSort('title')}
                  >
                    タイトル
                  </th>
                  <th className="border px-4 py-2">商品番号</th>
                  <th
                    className="border px-4 py-2 cursor-pointer"
                    onClick={() => changeSort('release_date')}
                  >
                    発売日
                  </th>
                </tr>
              </thead>
              <tbody>
                {albums.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <td className="border px-4 py-2 text-blue-600 underline">
                      <Link
                        to={`/albums/${a.id}`}
                        state={{ title: a.title }}
                        className="text-blue-600  dark:text-blue-400  hover:underline  underline-offset-4">
                        {a.title}
                      </Link>
                    </td>

                    <td className="border px-4 py-2">{a.catalog_number}</td>
                    <td className="border px-4 py-2">{a.release_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ページネーション */}
            <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                前へ
              </button>

              {renderPages()}

              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      )} />

      <Route path="/albums/:id" element={<AlbumDetail />} />
    </Routes>
  );
}

export default App;
