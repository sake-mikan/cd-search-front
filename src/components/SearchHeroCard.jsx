import SearchModeTabs from './SearchModeTabs';

export default function SearchHeroCard({
  current = 'album',
  badge = '',
  badgeIcon: BadgeIcon = null,
  title = '',
  subtitle = '',
  children = null,
}) {
  return (
    <div className="-mx-4 space-y-0 sm:-mx-6">
      <SearchModeTabs current={current} tone="home" />
      <div className="-mt-px space-y-3 rounded-b-[24px] border border-slate-200/90 border-t-0 bg-slate-50/30 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-900/20 sm:px-5 sm:py-4">
        <div className="space-y-3 pb-2 pt-1">
          {badge ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white shadow-sm dark:bg-white dark:text-slate-900">
              {BadgeIcon ? <BadgeIcon className="h-3.5 w-3.5" /> : null}
              <span>{badge}</span>
            </span>
          ) : null}
          <div className="space-y-1.5">
            {title ? <h1 className="text-[1.75rem] font-bold tracking-tight text-slate-900 sm:text-[1.9rem] dark:text-white">{title}</h1> : null}
            {subtitle ? <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
          </div>
          <div className="h-px w-full bg-slate-200/90 dark:bg-slate-700/80" />
        </div>
        {children}
      </div>
    </div>
  );
}
