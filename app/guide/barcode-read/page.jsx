'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Monitor,
  QrCode,
  ScanBarcode,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
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
  secondaryButtonClass,
} from '@/utils/uiTheme';

const StepCard = ({ number, title, description, icon: Icon, children }) => (
  <div className={`${panelClass} group hover:border-cyan-400/30 transition-all duration-500`}>
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="shrink-0">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 shadow-inner dark:bg-cyan-500/20">
            <Icon className="h-8 w-8" />
          </div>
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[12px] font-black text-white shadow-lg ring-4 ring-white dark:ring-slate-800">
            {number}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
        <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
        {children}
      </div>
    </div>
  </div>
);

const Bullet = ({ children }) => (
  <div className="flex items-center gap-3">
    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-500" />
    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{children}</span>
  </div>
);

export default function BarcodeReadGuidePage() {
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

        <section className={`${heroPanelClass} py-12 text-center md:py-20`}>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <ScanBarcode className="h-3.5 w-3.5" />
              Guide
            </div>
            <h1 className="text-4xl font-black leading-[1.1] tracking-tighter text-slate-900 dark:text-white md:text-6xl">
              バーコード読み取り検索の<br />
              <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">使い方ガイド</span>
            </h1>
            <p className="text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-400 md:text-xl">
              CDのバーコードを読み取るだけで、JANコードからアルバム情報を検索できます。<br className="hidden md:block" />
              PCカメラでも、スマホを外部スキャナにしても利用できます。
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className={`${panelClass} border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-500/5`}>
            <div className="flex items-center gap-4">
              <Camera className="h-8 w-8 text-cyan-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">この端末で検索</h4>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">スマホやPCのカメラで読み取り、その端末で結果を表示します。</p>
              </div>
            </div>
          </div>
          <div className={`${panelClass} border-sky-500/20 bg-sky-500/5 dark:bg-sky-500/5`}>
            <div className="flex items-center gap-4">
              <Wifi className="h-8 w-8 text-sky-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">スマホをPC用スキャナに</h4>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">PCにQRコードを出し、スマホで読んだJANをPCへ送れます。</p>
              </div>
            </div>
          </div>
          <div className={`${panelClass} border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5`}>
            <div className="flex items-center gap-4">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">短時間セッション</h4>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">PC連携用QRコードは期限付きで、読み取り後は再送信できません。</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 py-8">
          <div className="flex items-center gap-3 px-4">
            <div className="h-4 w-1 rounded-full bg-cyan-500" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">スマホで直接検索する</h2>
          </div>

          <StepCard
            number="1"
            title="検索画面をスマホで開く"
            description="トップページの検索フォーム下にある「このスマホでバーコード検索」を押します。"
            icon={Smartphone}
          >
            <Bullet>読み取った結果はPCには送らず、このスマホ上で検索・表示します。</Bullet>
          </StepCard>

          <StepCard
            number="2"
            title="カメラを許可してJANコードを読み取る"
            description="CDケースのバーコードを枠内に合わせると、自動でJANコードを読み取ります。"
            icon={ScanBarcode}
          >
            <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">
              <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                カメラが起動しない場合は、ブラウザのカメラ権限やHTTPS接続になっているかを確認してください。
              </p>
            </div>
          </StepCard>

          <StepCard
            number="3"
            title="アルバム情報を表示する"
            description="サイト内に登録済みのJANならアルバム詳細へ、未登録の場合はMusicBrainz候補へ移動します。"
            icon={Search}
          />
        </div>

        <div className="space-y-8 py-8">
          <div className="flex items-center gap-3 px-4">
            <div className="h-4 w-1 rounded-full bg-sky-500" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">スマホでスキャンしてPCに表示する</h2>
          </div>

          <StepCard
            number="1"
            title="PCでQRコードを発行する"
            description="PCの検索画面で「スマホでスキャンしてこのPCに表示」を押すと、専用QRコードが表示されます。"
            icon={Monitor}
          >
            <Bullet>PC側は1.5秒ごとに読み取り結果を待ち受けます。</Bullet>
          </StepCard>

          <StepCard
            number="2"
            title="スマホでQRコードを読み取る"
            description="スマホでQRコードを開くと、PC連携専用の読み取りページが表示されます。"
            icon={QrCode}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-sky-500/10 bg-sky-500/5 p-4">
                <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-sky-600 dark:text-sky-300">PC側</h4>
                <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">QRコードを表示したまま待機します。</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">スマホ側</h4>
                <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">読み取り専用ページでカメラを起動します。</p>
              </div>
            </div>
          </StepCard>

          <StepCard
            number="3"
            title="JANコードをPCへ送信する"
            description="スマホでCDのバーコードを読み取ると、JANコードがPC画面へ送られ、自動で検索が始まります。"
            icon={Sparkles}
          >
            <Bullet>タグ書き込みなどPCで続けたい作業がある場合に便利です。</Bullet>
          </StepCard>
        </div>

        <section className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-2">
          <div className={`${panelClass} space-y-5`}>
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-cyan-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">使い分けの目安</h2>
            </div>
            <div className="space-y-3">
              <Bullet>スマホだけで確認したい: 「このスマホでバーコード検索」</Bullet>
              <Bullet>ノートPCのカメラで読みたい: 「このPCのカメラでバーコード読取」</Bullet>
              <Bullet>PCでタグ編集まで進めたい: 「スマホでスキャンしてこのPCに表示」</Bullet>
            </div>
          </div>

          <div className={`${panelClass} space-y-5 border-amber-500/10`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">注意点</h2>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              PC連携用のQRコードは短時間で期限切れになります。期限切れになった場合は、PC側でもう一度QRコードを発行してください。
            </p>
            <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              スマホ連携ページはJANコード読み取り専用です。タグ書き込みはPCのアルバム詳細画面から行ってください。
            </p>
          </div>
        </section>

        <section className="py-12 text-center">
          <Link href="/" className={primaryButtonClass}>
            JANコードでCDを探す
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            スキャンしたJANコードから、CD情報へすばやく移動できます。
          </p>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
