import React from 'react';
import { tableCardClass, tableClass, tableHeadRowClass, tableHeadCellClass, tableRowClass } from '@/utils/uiTheme';

export default function ResponsiveResultList({
  items,
  columns,
  renderDesktopRow,
  renderMobileCard,
  emptyText = '該当するデータが見つかりませんでした。',
}) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-[32px] border border-slate-200/70 bg-white/90 px-4 py-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90 dark:text-slate-300">
        {emptyText}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={`hidden lg:block overflow-x-auto ${tableCardClass}`}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${tableHeadCellClass} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => renderDesktopRow(item, index, tableRowClass))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {items.map((item) => renderMobileCard(item))}
      </div>
    </>
  );
}
