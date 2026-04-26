import { Suspense } from 'react';
import ContentSearchClient from '@/components/ContentSearchClient';

export const metadata = {
  title: '作品から探す',
  description: 'アニメ作品名、ゲームタイトル、シリーズ名から関連するCD・アルバム情報を横断検索。作品ごとのディスコグラフィーを確認できます。',
  keywords: ['アニメディスコグラフィー', 'シリーズ作品検索', '作品別CD一覧'],
};

export default function ContentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContentSearchClient />
    </Suspense>
  );
}
