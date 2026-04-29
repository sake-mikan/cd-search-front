import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

/**
 * Space/Neon Design System Classes
 */

// ガラス質感のパネル
export const panelClass =
  'relative overflow-hidden rounded-[32px] border border-slate-200/30 bg-white/60 p-4 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500';

export const panelMutedClass =
  'rounded-[24px] border border-slate-200/20 bg-slate-50/50 p-3 sm:p-4 dark:border-white/5 dark:bg-slate-900/60 transition-all duration-500';

// ヒーローセクション用の強調パネル
export const heroPanelClass =
  'relative overflow-hidden rounded-[32px] border border-slate-200/40 bg-white/80 p-5 md:p-8 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-slate-900/60 transition-all duration-500';

export const pageShellClass =
  'relative min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-sky-500/30 font-sans transition-colors duration-500 overflow-x-hidden';

export const pageCardClass =
  'relative z-10 mx-auto w-full max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 flex-1';

// フォーム要素
export const inputClass =
  'h-12 w-full rounded-2xl border border-slate-200/50 bg-white/30 px-5 text-sm transition-all focus:border-sky-500/50 focus:outline-none focus:ring-4 focus:ring-sky-500/5 dark:border-white/5 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 backdrop-blur-md';

export const textareaClass = `${inputClass} min-h-[140px] py-4`;

// ボタン
export const primaryButtonClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sky-500 px-8 text-sm font-black text-white shadow-[0_10px_20px_rgba(14,165,233,0.3)] transition-all hover:bg-sky-400 hover:shadow-[0_15px_30px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-200/30 px-8 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 active:scale-95 backdrop-blur-md';

export const outlineButtonClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200/50 bg-transparent px-8 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 active:scale-95 backdrop-blur-md';

// テーブル関連
export const tableCardClass =
  'relative overflow-hidden rounded-[32px] border border-slate-200/30 bg-white/40 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/40';

export const tableClass = 'w-full border-collapse text-sm';
export const tableHeadRowClass = 'bg-slate-100/50 dark:bg-white/5';
export const tableHeadCellClass = 'px-6 py-4 text-left font-black tracking-widest text-slate-500 dark:text-white/70 uppercase text-[13px] border-b border-slate-200/30 dark:border-white/5';
export const tableCellClass = 'px-6 py-4 align-top border-b border-slate-200/30 dark:border-white/5 text-slate-700 dark:text-white/80 text-[14px] leading-relaxed';
export const tableRowClass = 'hover:bg-sky-500/5 transition-colors duration-300';

// 互換性のための定義（警告対応）
export const floatingThemeButtonClass =
  'fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-[9999] flex h-12 w-12 lg:w-[88px] items-center rounded-full bg-slate-900/5 lg:bg-slate-100/80 dark:lg:bg-slate-900/80 p-0 lg:p-1 shadow-none lg:shadow-2xl backdrop-blur-none lg:backdrop-blur-xl border-none lg:border lg:border-slate-200 dark:lg:border-white/10 transition-all active:scale-95 justify-center lg:justify-start';
export const mobileThemeButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-200/30 px-4 text-xs font-bold text-slate-700 transition-all dark:bg-white/5 dark:text-slate-300 backdrop-blur-md';

// テーマ切替ボタン（アイコンのみのトグルデザイン）
export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={floatingThemeButtonClass}
      aria-label="Toggle Theme"
    >
      <div className={`h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${isDarkMode ? 'flex bg-sky-400 text-white shadow-lg lg:bg-transparent lg:text-white/20 lg:shadow-none' : 'hidden lg:flex lg:bg-sky-400 lg:text-white lg:shadow-lg'}`}>
        <Sun className="h-5 w-5" />
      </div>
      <div className={`h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${!isDarkMode ? 'flex bg-sky-500 text-white shadow-lg lg:bg-transparent lg:text-slate-300 lg:shadow-none' : 'hidden lg:flex lg:bg-sky-500 lg:text-white lg:shadow-lg'}`}>
        <Moon className="h-5 w-5" />
      </div>
    </button>
  );
}


// パジネーション
export const paginationActiveButtonClass = 'rounded-full bg-sky-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-sky-500/20';
export const paginationButtonClass =
  'rounded-full bg-slate-200/50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-all';

/**
 * 宇宙の背景（漂う星空と星雲）
 */
export function PageBackdrop() {
  const { isDarkMode } = useTheme();

  // 決定論的な星のデータを生成（200個）
  const stars = Array.from({ length: 200 }).map((_, i) => {
    const size = i % 25 === 0 ? 2 : i % 8 === 0 ? 1.5 : 1;
    // 漂う速度（遠くの星は遅く、近くの星は少し早く）
    const driftDuration = size === 2 ? '40s' : size === 1.5 ? '60s' : '90s';
    const pulseSpeed = i % 3 === 0 ? '6s' : i % 2 === 0 ? '8s' : '10s';
    const delay = `${-(i % 20)}s`; 
    
    return (
      <div
        key={i}
        className="absolute rounded-full bg-white transition-opacity duration-1000"
        style={{
          top: `${(i * 13.7) % 100}%`,
          left: `${(i * 17.3) % 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: isDarkMode ? (size > 1 ? 0.7 : 0.3) : 0.08,
          boxShadow: size > 1 ? `0 0 ${size * 4}px ${size}px rgba(255, 255, 255, 0.3)` : 'none',
          animation: `
            pulse ${pulseSpeed} ease-in-out ${delay} infinite,
            star-drift ${driftDuration} linear ${delay} infinite
          `,
        }}
      />
    );
  });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-1000 bg-slate-50 dark:bg-[#020617]">
      <style>{`
        @keyframes star-drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-100px, -60px); }
        }
      `}</style>
      
      {/* 深い星雲のグラデーション */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-100' : 'opacity-10'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(14,165,233,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1),transparent_70%)]" />
        
        {/* 動く星空レイヤー */}
        <div className="absolute inset-[-100px] overflow-hidden">
          {stars}
        </div>

        {/* ネオンの光の溜まり（環境光） */}
        <div className="absolute top-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>
    </div>
  );
}
