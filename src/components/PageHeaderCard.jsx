import { Moon, Sun } from 'lucide-react';
import {
  floatingThemeButtonClass,
  heroPanelClass,
  mobileThemeButtonClass,
  primaryButtonClass,
} from '../utils/uiTheme';

export default function PageHeaderCard({
  maxWidthClass = 'max-w-7xl',
  isDarkMode = false,
  onToggleTheme = () => {},
  backLabel = '',
  onBack = null,
  badge = '',
  badgeIcon: BadgeIcon = null,
  badgeAside = null,
  title,
  subtitle = '',
  actions = null,
  children = null,
  backButtonClass = primaryButtonClass,
  titleClassName = 'text-2xl font-bold tracking-tight sm:text-[2rem]',
  showFloatingThemeButton = true,
  showMobileThemeButton = true,
  sectionClassName = '',
}) {
  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

  return (
    <>
      {showFloatingThemeButton ? (
        <button
          type="button"
          onClick={onToggleTheme}
          className={floatingThemeButtonClass}
          title={themeTitle}
          aria-label={themeTitle}
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span>{themeLabel}</span>
        </button>
      ) : null}

      <div className={['mx-auto mb-3 flex items-center justify-between gap-2 lg:justify-start', maxWidthClass].join(' ')}>
        {backLabel ? (
          <button type="button" onClick={onBack} className={backButtonClass}>
            {backLabel}
          </button>
        ) : (
          <span />
        )}

        {showMobileThemeButton ? (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`${mobileThemeButtonClass} lg:hidden`}
            title={themeTitle}
            aria-label={themeTitle}
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span>{themeLabel}</span>
          </button>
        ) : null}
      </div>

      <section className={[heroPanelClass, sectionClassName].filter(Boolean).join(' ')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            {badge ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                  {BadgeIcon ? <BadgeIcon className="h-3.5 w-3.5" /> : null}
                  {badge}
                </span>
                {badgeAside ? <span className="text-xs leading-6 text-slate-600 dark:text-slate-300">{badgeAside}</span> : null}
              </div>
            ) : null}
            {title || subtitle ? (
              <div className="space-y-2">
                {title ? <h1 className={titleClassName}>{title}</h1> : null}
                {subtitle ? <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </div>

          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">{actions}</div> : null}
        </div>
      </section>
    </>
  );
}