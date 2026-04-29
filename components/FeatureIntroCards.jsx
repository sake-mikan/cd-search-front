'use client';

import React, { useState } from 'react';
import { FilePenLine, ShieldCheck, ChevronDown } from 'lucide-react';

export default function FeatureIntroCards() {
  const [openTag, setOpenTag] = useState(false);
  const [openShield, setOpenShield] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
      {/* CDタグ書き込み機能 */}
      <div 
        onClick={() => setOpenTag(!openTag)}
        className="group flex flex-col py-2.5 md:py-4 px-5 md:px-6 rounded-2xl md:rounded-[32px] border border-slate-200/50 bg-white/40 backdrop-blur-3xl dark:border-white/5 dark:bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm cursor-pointer md:cursor-default"
      >
        <div className="flex items-center gap-4 md:gap-5">
          <div className="flex h-8 w-8 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-transform duration-500 md:group-hover:scale-110">
            <FilePenLine className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs md:text-sm font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase">CDタグ書き込み機能</h3>
              <ChevronDown className={`h-4 w-4 text-sky-600 dark:text-sky-400 transition-transform duration-300 md:hidden ${openTag ? 'rotate-180' : ''}`} />
            </div>
            <div className={`grid transition-all duration-300 ${openTag ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 md:group-hover:grid-rows-[1fr] md:group-hover:opacity-100 md:group-hover:mt-0.5'}`}>
              <p className="overflow-hidden text-[10px] md:text-xs font-bold text-slate-500 dark:text-white/40 leading-relaxed">
                対応ブラウザではローカルファイルへ楽曲情報を直接書き込めます。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* アップロード不要 */}
      <div 
        onClick={() => setOpenShield(!openShield)}
        className="group flex flex-col py-2.5 md:py-4 px-5 md:px-6 rounded-2xl md:rounded-[32px] border border-slate-200/50 bg-white/40 backdrop-blur-3xl dark:border-white/5 dark:bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm cursor-pointer md:cursor-default"
      >
        <div className="flex items-center gap-4 md:gap-5">
          <div className="flex h-8 w-8 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform duration-500 md:group-hover:scale-110">
            <ShieldCheck className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs md:text-sm font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">アップロード不要</h3>
              <ChevronDown className={`h-4 w-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 md:hidden ${openShield ? 'rotate-180' : ''}`} />
            </div>
            <div className={`grid transition-all duration-300 ${openShield ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 md:group-hover:grid-rows-[1fr] md:group-hover:opacity-100 md:group-hover:mt-0.5'}`}>
              <p className="overflow-hidden text-[10px] md:text-xs font-bold text-slate-500 dark:text-white/40 leading-relaxed">
                音楽ファイルはサーバーへアップロードされません。ローカル環境内で処理できます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
