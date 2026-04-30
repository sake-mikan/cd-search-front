'use client';

import React from 'react';
import Link from 'next/link';
import { 
  File as FileAudio, 
  Settings, 
  WandSparkles as Wand2, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink,
  Info,
  AlertCircle,
  Globe as Chrome,
  MousePointer as MousePointer2,
  FolderTree,
  Image as ImageIcon,
  CheckCircle as CheckCircle2,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import SiteBrandHeader from '@/components/SiteBrandHeader';
import SiteFooter from '@/components/SiteFooter';
import { 
  PageBackdrop, 
  ThemeToggle, 
  pageShellClass, 
  pageCardClass, 
  heroPanelClass, 
  panelClass,
  primaryButtonClass,
  secondaryButtonClass
} from '@/utils/uiTheme';

const StepCard = ({ number, title, description, icon: Icon, children }) => (
  <div className={`${panelClass} group hover:border-sky-500/30 transition-all duration-500`}>
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 dark:bg-sky-500/20 shadow-inner">
            <Icon className="h-8 w-8" />
          </div>
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[12px] font-black text-white shadow-lg ring-4 ring-white dark:ring-slate-800">
            {number}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{description}</p>
        {children}
      </div>
    </div>
  </div>
);

export default function TagWriteGuidePage() {
  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <ThemeToggle />

      <div className={pageCardClass}>
        <SiteBrandHeader 
          actions={
            <Link href="/" className={secondaryButtonClass}>
              トップへ戻る
            </Link>
          }
        />

        {/* Hero Section */}
        <section className={`${heroPanelClass} text-center py-12 md:py-20`}>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Guide
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
              タグ書き込み機能の<br />
              <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">使い方ガイド</span>
            </h1>
            <p className="text-lg md:text-xl font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              お手持ちの音楽ファイルに、DiscMasterの正確なデータベース情報を<br className="hidden md:block" />
              ブラウザだけで簡単に書き込むことができます。
            </p>
          </div>
        </section>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${panelClass} border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5`}>
            <div className="flex items-center gap-4">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">アップロード不要</h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">ファイルは全て手元のPC内で処理。プライバシーも安心です。</p>
              </div>
            </div>
          </div>
          <div className={`${panelClass} border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/5`}>
            <div className="flex items-center gap-4">
              <ImageIcon className="h-8 w-8 text-sky-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">高画質なジャケ写</h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">データベースに登録された画像をそのまま埋め込み可能。</p>
              </div>
            </div>
          </div>
          <div className={`${panelClass} border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/5`}>
            <div className="flex items-center gap-4">
              <FolderTree className="h-8 w-8 text-indigo-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">自動リネーム</h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">設定したルールに基づいてファイル名を一括整理。</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Steps */}
        <div className="space-y-8 py-8">
          <div className="flex items-center gap-3 px-4">
            <div className="h-4 w-1 bg-sky-500 rounded-full" />
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Step by Step</h2>
          </div>

          <StepCard 
            number="1"
            title="アルバム詳細画面を開く"
            description="まずはタグ情報を取得したいCDを検索し、詳細ページを開きます。"
            icon={MousePointer2}
          >
            <div className="mt-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                  <Wand2 className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">アルバムを探しにいく</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </StepCard>

          <StepCard 
            number="2"
            title="ファイル・フォルダを選択する"
            description="「タグを書き込み」エリアのボタンから、お手元の音声ファイルを選択します。"
            icon={FileAudio}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">ファイル選択</h4>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">数曲だけ書き込みたい場合に便利です。複数ファイルの一括選択も可能です。</p>
              </div>
              <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
                <h4 className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-2">フォルダ選択</h4>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">アルバムごと一括で処理する場合におすすめです。フォルダ内の全楽曲を自動で認識します。</p>
              </div>
            </div>
          </StepCard>

          <StepCard 
            number="3"
            title="書き込み設定をカスタマイズ"
            description="必要に応じてオプションを設定します。デフォルトのままでも十分お使いいただけます。"
            icon={Settings}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ジャケット画像の埋め込み</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ファイル名のリネーム（$num(%track%,2) %title% など）</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">アルバム名への[形態]（初回限定盤など）の付加</span>
              </div>
            </div>
          </StepCard>

          <StepCard 
            number="4"
            title="書き込み開始！"
            description="「書き込み開始」ボタンを押すと処理が始まります。"
            icon={Wand2}
          >
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">ブラウザの保存許可ダイアログが表示されます</p>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  プライバシー保護のため、ブラウザがファイルへの保存許可を求めます。「保存」や「変更を許可」を選択してください。
                </p>
              </div>
            </div>
          </StepCard>
        </div>

        {/* Requirements Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8">
          <div className={`${panelClass} space-y-6`}>
            <div className="flex items-center gap-3">
              <Chrome className="h-6 w-6 text-sky-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">推奨ブラウザ</h2>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              この機能は最新の Web API を使用しているため、以下のブラウザでの利用を推奨します。
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 text-center">
                <p className="text-sm font-bold">Google Chrome</p>
                <p className="text-[10px] font-bold text-sky-500 mt-1 uppercase">Recommended</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 text-center">
                <p className="text-sm font-bold">Microsoft Edge</p>
                <p className="text-[10px] font-bold text-sky-500 mt-1 uppercase">Compatible</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 flex gap-4 items-center">
              <Smartphone className="h-5 w-5 text-slate-400" />
              <p className="text-xs font-medium text-slate-500">
                ※ スマートフォンや Safari、Firefox では、ブラウザの制限により現在のところご利用いただけません。
              </p>
            </div>
          </div>

          <div className={`${panelClass} space-y-6 border-amber-500/10`}>
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">よくある質問・注意点</h2>
            </div>
            <div className="space-y-4">
              <details className="group">
                <summary className="list-none cursor-pointer text-sm font-bold flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>対応しているファイル形式は？</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-slate-400" />
                </summary>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-white/10">
                  MP3 (.mp3), FLAC (.flac), AAC (.m4a) に対応しています。WAVなどは現在対応準備中です。
                </p>
              </details>
              <details className="group border-t border-slate-200/30 dark:border-white/5 pt-4">
                <summary className="list-none cursor-pointer text-sm font-bold flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>元のファイルは上書きされますか？</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-slate-400" />
                </summary>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-white/10">
                  「フォルダ選択」から実行した場合、元のファイルは残したまま、新しくサブフォルダを作成してそこへ保存します。「ファイル選択」かつ「リネーム無効」の場合は上書きとなります。
                </p>
              </details>
              <details className="group border-t border-slate-200/30 dark:border-white/5 pt-4">
                <summary className="list-none cursor-pointer text-sm font-bold flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>失敗したときはどうすればいい？</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-slate-400" />
                </summary>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-white/10">
                  一度に大量のファイルを処理しようとするとブラウザがメモリ不足になる場合があります。その場合は数回に分けて実行してみてください。
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <Link href="/" className={primaryButtonClass}>
            さっそくアルバムを探す
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs font-medium text-slate-400 flex items-center justify-center gap-2">
            最新のデータベースで、あなたのライブラリをより豊かに。
          </p>
        </section>

      </div>
      <SiteFooter />
    </div>
  );
}
