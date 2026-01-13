import { useEffect, useState } from 'react';
import './App.css';
import { fetchAlbums } from './api/albums';

function App() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 検索条件
  const [title, setTitle] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');

  // ページ
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // ソート
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
    } catch (e) {
      console.error(e);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums(1);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadAlbums(1);
  };

  const changePage = (page) => {
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
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="container">
      <h1>CD一覧</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            タイトル：
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            商品番号：
            <input
              type="text"
              value={catalogNumber}
              onChange={e => setCatalogNumber(e.target.value)}
            />
          </label>
        </div>

        <button type="submit">検索</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th
              className={sort === 'title' ? 'sort-active' : ''}
              onClick={() => changeSort('title')}
            >
              タイトル {sort === 'title' ? (order === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th>商品番号</th>
            <th
              className={sort === 'release_date' ? 'sort-active' : ''}
              onClick={() => changeSort('release_date')}
            >
              発売日 {sort === 'release_date' ? (order === 'asc' ? '▲' : '▼') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {albums.map(album => (
            <tr key={album.id}>
              <td>{album.title}</td>
              <td>{album.catalog_number}</td>
              <td>{album.release_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          前へ
        </button>

        {renderPages()}

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === lastPage}
        >
          次へ
        </button>
      </div>
    </div>
  );
}

export default App;
