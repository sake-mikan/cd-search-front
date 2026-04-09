import { tableCardClass, tableClass, tableHeadCellClass, tableHeadRowClass, tableRowClass } from '../utils/uiTheme';

export default function TrackList({
  groups,
  columns,
  renderDesktopRow,
  renderMobileCard,
  emptyText = 'トラック情報がありません',
  desktopMinWidthClass = 'min-w-[920px]',
}) {
  const discGroups = Array.isArray(groups) ? groups : [];

  if (discGroups.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200/70 bg-white/90 px-4 py-5 text-sm text-slate-500 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90 dark:text-slate-300">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {discGroups.map((group) => {
        const discLabel = group.discLabel ?? `Disc ${group.discNumber}`;
        return (
          <section key={`disc-${group.discNumber}`} className="space-y-3">
            <h2 className="text-sm font-semibold tracking-[0.14em] text-slate-600 dark:text-slate-300">{discLabel}</h2>

            <div className={`hidden md:block ${tableCardClass}`}>
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
                    {group.tracks.map((track, index) => renderDesktopRow(track, index, tableRowClass))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {group.tracks.map((track, index) => renderMobileCard(track, index))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
