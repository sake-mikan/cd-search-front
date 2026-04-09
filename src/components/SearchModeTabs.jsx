import { Link } from 'react-router-dom';

const baseClass = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition';

export default function SearchModeTabs({ current = 'album' }) {
  const items = [
    { key: 'album', label: 'CD情報検索', to: '/' },
    { key: 'track', label: '楽曲名検索', to: '/tracks' },
    { key: 'content', label: '作品から探す', to: '/contents' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const active = current === item.key;
        return (
          <Link
            key={item.key}
            to={item.to}
            className={[
              baseClass,
              active
                ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200 dark:ring-sky-500/30'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
