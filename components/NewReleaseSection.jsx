'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import AlbumCard from './AlbumCard';

export default function NewReleaseSection({ initialData = [] }) {
  // 現在の表示基準日（初期値は今日）
  const [baseDate, setBaseDate] = useState(new Date());

  // 表示対象の週の範囲（日曜始まり）を計算
  const weekRange = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
    };
  }, [baseDate]);

  // 本来はAPIを叩き直すべきだが、仕様に基づきクライアントサイドでの週移動UIを提供
  // (Next.js 15では URLSearchParams を使ってサーバーコンポーネントを更新する手法も有効)
  const shiftWeek = (offset) => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + (offset * 7));
    setBaseDate(next);
    // TODO: ここで router.push を行いデータを再取得するロジックを将来的に追加可能
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          <span>対象期間: {weekRange.label}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            title="前週"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setBaseDate(new Date())}
            className="px-3 text-xs font-bold hover:text-blue-500 transition-colors"
          >
            今週
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            title="次週"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {initialData.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {initialData.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">該当する新譜情報がありません</p>
        </div>
      )}
      
      <div className="flex justify-center pt-4">
        <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
          もっと見る
        </button>
      </div>
    </div>
  );
}