import { tableCardClass, tableClass, tableHeadCellClass, tableHeadRowClass, tableRowClass } from '../utils/uiTheme';

export default function ResponsiveResultList({
  items,
  columns,
  renderDesktopRow,
  renderMobileCard,
  emptyText = 'データがありません',
  emptyColSpan,
  desktopMinWidthClass = 'min-w-[760px]',
  mobileGridClass = 'grid gap-3 md:hidden',
  desktopOnlyClass = 'hidden md:block',
}) {
  const rows = Array.isArray(items) ? items : [];
  const colSpan = Number(emptyColSpan || columns.length) || columns.length;

  return (
    <>
      <div className={`${desktopOnlyClass} ${tableCardClass}`}>
        <div className="overflow-x-auto">
          <table className={`${tableClass} ${desktopMinWidthClass}`}>
            <thead>
              <tr className={tableHeadRowClass}>
                {columns.map((column) => (
                  <th key={column.key} className={[tableHeadCellClass, column.className || ''].join(' ').trim()}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((item, index) => renderDesktopRow(item, index, tableRowClass))
              ) : (
                <tr className={tableRowClass}>
                  <td className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300" colSpan={colSpan}>
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={mobileGridClass}>
        {rows.length > 0 ? (
          rows.map((item, index) => renderMobileCard(item, index))
        ) : (
          <div className="rounded-[24px] border border-slate-200/70 bg-white/90 px-4 py-5 text-sm text-slate-500 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90 dark:text-slate-300">
            {emptyText}
          </div>
        )}
      </div>
    </>
  );
}
