import { FilePenLine, ShieldCheck } from 'lucide-react';

export default function SearchValueHighlights({ className = '' }) {
  return (
    <div className={['grid gap-2.5 lg:grid-cols-2', className].filter(Boolean).join(' ')}>
      <div className="relative overflow-hidden rounded-[20px] border border-sky-300/35 bg-gradient-to-br from-sky-500/12 via-cyan-500/8 to-slate-900/5 p-3.5 shadow-[0_12px_32px_-22px_rgba(14,165,233,0.42)] ring-1 ring-sky-400/10 dark:border-sky-400/16 dark:from-sky-400/14 dark:via-cyan-400/10 dark:to-slate-950/24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_45%)]" />
        <div className="relative flex items-start gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-sky-500 text-white shadow-md shadow-sky-500/20">
            <FilePenLine className="h-[15px] w-[15px]" />
          </span>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">{'タグ書き込み機能'}</p>
            <p className="text-[13px] font-semibold leading-5 text-slate-900 dark:text-slate-100">{'対応ブラウザではローカルファイルへ楽曲情報を直接書き込めます。'}</p>
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[20px] border border-emerald-300/35 bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-slate-900/5 p-3.5 shadow-[0_12px_32px_-22px_rgba(16,185,129,0.38)] ring-1 ring-emerald-400/10 dark:border-emerald-400/16 dark:from-emerald-400/14 dark:via-teal-400/10 dark:to-slate-950/24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_45%)]" />
        <div className="relative flex items-start gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <ShieldCheck className="h-[15px] w-[15px]" />
          </span>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{'アップロード不要'}</p>
            <p className="text-[13px] font-semibold leading-5 text-slate-900 dark:text-slate-100">{'音楽ファイルはサーバーへアップロードされません。ローカル環境内で処理できます。'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
