import React from 'react';
import { FilePenLine, ShieldCheck } from 'lucide-react';

export default function FeatureIntroCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="group flex items-center gap-5 py-4 px-6 rounded-[32px] border border-slate-200/50 bg-white/40 backdrop-blur-3xl dark:border-white/5 dark:bg-white/5 hover:bg-white/10 transition-all duration-500 shadow-sm cursor-default">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-transform duration-500 group-hover:scale-110">
          <FilePenLine className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase transition-all duration-500 group-hover:mb-1">CDタグ書き込み機能</h3>
          <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100">
            <p className="overflow-hidden text-xs font-bold text-slate-500 dark:text-white/40 leading-relaxed">
              対応ブラウザではローカルファイルへ楽曲情報を直接書き込めます。
            </p>
          </div>
        </div>
      </div>

      <div className="group flex items-center gap-5 py-4 px-6 rounded-[32px] border border-slate-200/50 bg-white/40 backdrop-blur-3xl dark:border-white/5 dark:bg-white/5 hover:bg-white/10 transition-all duration-500 shadow-sm cursor-default">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-transform duration-500 group-hover:scale-110">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase transition-all duration-500 group-hover:mb-1">アップロード不要</h3>
          <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100">
            <p className="overflow-hidden text-xs font-bold text-slate-500 dark:text-white/40 leading-relaxed">
              音楽ファイルはサーバーへアップロードされません。ローカル環境内で処理できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
