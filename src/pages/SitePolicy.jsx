import { Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeaderCard from '../components/PageHeaderCard';
import SiteBrandHeader from '../components/SiteBrandHeader';
import SiteFooter from '../components/SiteFooter';
import { PageBackdrop, pageCardClass, pageShellClass, panelClass, mobileThemeButtonClass, primaryButtonClass } from '../utils/uiTheme';

const sections = [
  {
    title: 'サイトの目的',
    body: [
      'このサイトは、CD・楽曲情報を整理して横断検索し、タグ書き込みにも活用できるようにすることを目的としています。',
      '公式サイトや外部 API から取得した情報をもとに、検索・表示・管理のしやすさを重視してまとめています。',
    ],
  },
  {
    title: 'このサイトで利用できる主な機能',
    body: [
      'タイトル、アーティスト、規格品番、発売日などを使った CD 検索',
      '楽曲名からの横断検索と、作品・コンテンツ単位の閲覧',
      'アルバム詳細の確認と、対応ブラウザでのローカル音楽ファイルへのタグ書き込み',
      '情報修正依頼の送信と、外部情報候補の確認',
    ],
  },
  {
    title: '外部情報ソースと API について',
    body: [
      'このサイトでは、公式サイト、MusicBrainz、Rakuten Books API、などの外部情報を参照しています。',
      '表示内容は参照元の更新、公開状況、API の応答などによって変わることがあります。',
      '参照元と完全に一致することを保証するものではありません。最終的な判断は公式情報や販売元情報もあわせてご確認ください。',
    ],
  },
  {
    title: 'タグ書き込み機能について',
    body: [
      'タグ書き込み機能は、対応ブラウザ上でローカルファイルを直接更新する仕組みです。',
      '音楽ファイル自体をサーバーへアップロードすることはありませんが、上書き処理を行うため、必要に応じてバックアップを取ってください。',
      '対応ブラウザやファイル形式によっては、一部機能が利用できない場合があります。',
    ],
  },
  {
    title: '免責事項',
    body: [
      'このサイトに掲載している情報については、できる限り正確性の確保に努めていますが、完全性・正確性・最新性を保証するものではありません。',
      'このサイトの情報や機能の利用によって生じた損害について、運営者は責任を負いません。',
      '記載されている商品名、サービス名、ロゴ、アーティスト名などは、それぞれの権利者に帰属します。',
    ],
  },
];

export default function SitePolicy({ isDarkMode = false, onToggleTheme = () => {} }) {
  const navigate = useNavigate();

  return (
    <div className={pageShellClass}>
      <PageBackdrop />

      <div className={`${pageCardClass} max-w-5xl`}>
        <SiteBrandHeader
          actions={<>
            <button type="button" onClick={() => navigate('/')} className={primaryButtonClass}>
              {'トップへ戻る'}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`${mobileThemeButtonClass} !hidden`}
              title={isDarkMode ? '\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048' : '\u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048'}
              aria-label={isDarkMode ? '\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048' : '\u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u306b\u5207\u308a\u66ff\u3048'}
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{isDarkMode ? '\u30e9\u30a4\u30c8' : '\u30c0\u30fc\u30af'}</span>
            </button>
          </>}
        />
        <PageHeaderCard
          maxWidthClass="max-w-5xl"
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          showMobileThemeButton={false}
          badge={'SITE POLICY'}
          title={'サイトポリシー'}
          subtitle={'このサイトの目的、利用できる機能、外部情報の扱い、免責事項などをまとめています。'}
        />

        <div className="grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className={panelClass}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {section.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
