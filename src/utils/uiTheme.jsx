export const pageShellClass =
  'relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#f8fafc_45%,_#eef2ff_100%)] px-3 pb-6 pt-4 text-gray-900 dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#111827_45%,_#020617_100%)] dark:text-gray-100 sm:p-6';

export const pageCardClass =
  'relative mx-auto rounded-[28px] bg-white/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/95 dark:ring-white/10 sm:p-6';

export const heroPanelClass =
  'mb-6 overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/80 px-4 py-5 shadow-sm dark:border-slate-700/70 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 sm:px-6 sm:py-6';

export const panelClass =
  'rounded-[24px] border border-slate-200/70 bg-white/80 px-4 py-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70 sm:px-5';

export const panelMutedClass =
  'rounded-[20px] border border-slate-200/70 bg-slate-50/80 px-4 py-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40';

export const floatingThemeButtonClass =
  'fixed right-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center gap-0 rounded-full border border-gray-300 bg-white/95 p-0 text-[0] text-gray-700 shadow-lg backdrop-blur transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800/95 dark:text-gray-100 dark:hover:bg-gray-700 sm:right-4 sm:top-4 lg:absolute lg:right-6 lg:top-6 lg:h-auto lg:w-auto lg:gap-2 lg:px-3 lg:py-1.5 lg:text-xs';

export const mobileThemeButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60';

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600';

export const outlineButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700';

export const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/90';

export const textareaClass = `${inputClass} min-h-[140px]`;

export const tableCardClass =
  'overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/90';

export const tableClass = 'w-full border-collapse text-sm';
export const tableHeadRowClass = 'bg-slate-100 dark:bg-slate-700/80';
export const tableHeadCellClass = 'border-b border-r border-slate-200 px-3 py-2 text-left font-semibold last:border-r-0 dark:border-slate-600';
export const tableCellClass = 'border-b border-r border-slate-200 px-3 py-2 last:border-r-0 dark:border-slate-600';
export const tableRowClass = 'hover:bg-slate-50 dark:hover:bg-slate-700/40';

export const paginationActiveButtonClass = 'rounded-full bg-sky-600 px-3 py-1 text-white';
export const paginationButtonClass =
  'rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600';

export function PageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-500/10" />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
    </div>
  );
}
