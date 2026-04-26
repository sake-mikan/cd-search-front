import React from 'react';
import { panelClass } from '@/utils/uiTheme';

export default function InfoCard({
  title = '',
  description = '',
  badge = null,
  actions = null,
  children = null,
  className = '',
  headerSection = null,
}) {
  return (
    <section className={[panelClass, className, 'overflow-hidden'].filter(Boolean).join(' ')}>
      {headerSection ? (
        <div className="mb-4">{headerSection}</div>
      ) : (title || description || badge || actions) ? (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            {badge && <div>{badge}</div>}
            <div className="space-y-1.5">
              {title && (
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}
