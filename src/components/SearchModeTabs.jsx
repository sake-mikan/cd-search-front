import { Link } from 'react-router-dom';

export default function SearchModeTabs({ current = 'album' }) {
  const items = [
    { key: 'album', label: 'CD情報検索', to: '/' },
    { key: 'track', label: '楽曲名検索', to: '/tracks' },
    { key: 'content', label: '作品から探す', to: '/contents' },
  ];

  return (
    <div className="w-full">
      <div
        className="flex w-full items-end gap-1 border-b border-slate-200/90 dark:border-slate-700/90"
        role="tablist"
        aria-label="検索モード切り替え"
      >
        {items.map((item) => {
          const active = current === item.key;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={[
                'relative -mb-px inline-flex min-h-[46px] items-center justify-center whitespace-nowrap rounded-t-2xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
                active
                  ? 'z-10 border-slate-200 border-b-slate-50 bg-slate-50 text-sky-700 shadow-sm dark:border-slate-700 dark:border-b-slate-900 dark:bg-slate-900 dark:text-sky-300'
                  : 'border-transparent bg-slate-100/40 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:bg-slate-800/20 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
              role="tab"
              aria-selected={active}
            >
              {item.label}
              {active ? (
                <span className="pointer-events-none absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-sky-500 dark:bg-sky-400" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}