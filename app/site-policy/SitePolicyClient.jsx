'use client';

import Link from 'next/link';
import {
  BookOpen,
  Database,
  FileText,
  Globe2,
  Scale,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeaderCard from '@/components/PageHeaderCard';
import SiteBrandHeader from '@/components/SiteBrandHeader';
import SiteFooter from '@/components/SiteFooter';
import { PageBackdrop, pageCardClass, pageShellClass, panelClass, secondaryButtonClass, ThemeToggle } from '@/utils/uiTheme';
import { useTheme } from '@/components/ThemeProvider';

const sections = [
  {
    title: 'サイトの目的',
    icon: Database,
    accent: 'emerald',
    body: [
      'このサイトは、CD・楽曲情報を整理して横断検索し、タグ書き込みにも活用できるようにすることを目的としています。',
      '公式サイトや外部 API から取得した情報をもとに、検索・表示・管理のしやすさを重視してまとめています。',
    ],
  },
  {
    title: 'このサイトで利用できる主な機能',
    icon: Sparkles,
    accent: 'sky',
    body: [
      'タイトル、アーティスト、規格品番、発売日などを使った CD 検索',
      '楽曲名からの横断検索と、作品・コンテンツ単位の閲覧',
      'アルバム詳細の確認と、対応ブラウザでのローカル音楽ファイルへのタグ書き込み',
      '情報修正依頼の送信と、外部情報候補の確認',
    ],
  },
  {
    title: '外部情報ソースと API について',
    icon: Globe2,
    accent: 'indigo',
    body: [
      'このサイトでは、公式サイト、MusicBrainz、Rakuten Books API、などの外部情報を参照しています。',
      '表示内容は参照元の更新、公開状況、API の応答などによって変わることがあります。',
      '参照元と完全に一致することを保証するものではありません。最終的な判断は公式情報や販売元情報もあわせてご確認ください。',
    ],
  },
  {
    title: 'タグ書き込み機能について',
    icon: WandSparkles,
    accent: 'violet',
    body: [
      'タグ書き込み機能は、対応ブラウザ上でローカルファイルを直接更新する仕組みです。',
      '音楽ファイル自体をサーバーへアップロードすることはありませんが、上書き処理を行うため、必要に応じてバックアップを取ってください。',
      '対応ブラウザやファイル形式によっては、一部機能が利用できない場合があります。',
    ],
  },
  {
    title: '免責事項',
    icon: Scale,
    accent: 'amber',
    body: [
      'このサイトに掲載している情報については、できる限り正確性の確保に努めていますが、完全性・正確性・最新性を保証するものではありません。',
      'このサイトの情報や機能の利用によって生じた損害について、運営者は責任を負いません。',
      '記載されている商品名、サービス名、ロゴ、アーティスト名などは、それぞれの権利者に帰属します。',
    ],
  },
];

const accentClasses = {
  emerald: {
    dot: 'bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.9)]',
    icon: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    panel: 'hover:border-emerald-400/30',
  },
  sky: {
    dot: 'bg-sky-400 shadow-[0_0_22px_rgba(56,189,248,0.9)]',
    icon: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    panel: 'hover:border-sky-400/30',
  },
  indigo: {
    dot: 'bg-indigo-400 shadow-[0_0_22px_rgba(129,140,248,0.9)]',
    icon: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    panel: 'hover:border-indigo-400/30',
  },
  violet: {
    dot: 'bg-violet-400 shadow-[0_0_22px_rgba(167,139,250,0.9)]',
    icon: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    panel: 'hover:border-violet-400/30',
  },
  amber: {
    dot: 'bg-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.9)]',
    icon: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    panel: 'hover:border-amber-400/30',
  },
};

export default function SitePolicyPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <ThemeToggle />

      <div className={`${pageCardClass} max-w-5xl`}>
        <SiteBrandHeader
          actions={<button type="button" onClick={() => router.push('/')} className="inline-flex h-12 items-center justify-center rounded-full bg-sky-500 px-8 text-sm font-black text-white shadow-[0_10px_20px_rgba(14,165,233,0.3)] transition-all hover:bg-sky-400 hover:shadow-[0_15px_30px_rgba(14,165,233,0.5)] active:scale-95">
            トップへ戻る
          </button>}
        />
        <PageHeaderCard
          maxWidthClass="max-w-5xl"
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          showFloatingThemeButton={false}
          showMobileThemeButton={false}
          badge={'SITE POLICY'}
          title={'サイトポリシー'}
          subtitle={'このサイトの目的、利用できる機能、外部情報の扱い、免責事項などを掲載しています。'}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className={`${panelClass} group ${accentClasses[section.accent].panel} ${section.title === '免責事項' ? 'md:col-span-2' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="relative mt-1 shrink-0">
                  <span className={`absolute -left-1 -top-1 h-3 w-3 rounded-full ${accentClasses[section.accent].dot}`} />
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClasses[section.accent].icon}`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">{section.title}</h2>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {section.body.map((line) => (
                      <p key={line} className="flex gap-2">
                        <ShieldCheck className="mt-1.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-white/30" />
                        <span>{line}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className={`${panelClass} border-sky-400/20 bg-sky-500/5`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">機能ガイド</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  タグ書き込みやJANコード読み取りなど、主要機能の使い方をガイドにまとめています。
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/guide/tag-write" className={secondaryButtonClass}>
                <FileText className="h-4 w-4" />
                タグ書き込み
              </Link>
              <Link href="/guide/barcode-read" className={secondaryButtonClass}>
                <Sparkles className="h-4 w-4" />
                JAN読み取り
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
