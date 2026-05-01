import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: {
    default: 'DISC MASTER - 楽曲メタデータ検索・管理',
    template: '%s | DISC MASTER'
  },
  description: 'アニメ・声優・ゲーム音楽に特化したCD楽曲データベース。収録曲、作詞・作曲・編曲などのクレジット情報を整理。ブラウザから音楽ファイルへのタグ書き込みも可能です。',
  keywords: ['CD検索', '楽曲検索', 'メタデータ', 'タグ書き込み', 'アニメソング', '声優', 'ゲーム音楽', 'クレジット情報', 'DISC MASTER'],
  authors: [{ name: 'DISC MASTER Project' }],
  openGraph: {
    title: 'DISC MASTER - 楽曲メタデータ検索・管理',
    description: 'アニメ・声優・ゲーム音楽に特化したCD楽曲データベース。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'DISC MASTER',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DISC MASTER - 楽曲メタデータ検索・管理',
    description: 'アニメ・声優・ゲーム音楽に特化したCD楽曲データベース。',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme-preference');
    var isDark = false;
    if (saved === 'dark') {
      isDark = true;
    } else if (saved === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
