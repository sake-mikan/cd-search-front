import { Suspense } from 'react';
import HomeClient from '@/components/HomeClient';

export const metadata = {
  description: 'アニメ・声優・ゲーム音楽に特化したCD楽曲データベース「DISC MASTER」。豊富な楽曲情報から、収録曲、クレジット（作詞・作曲・編曲）、発売日を即座に検索。ブラウザ上で動作するタグ書き込み機能も搭載。',
  keywords: ['アニメソング検索', '声優CD', 'ゲーム音楽データベース', 'アニソンクレジット', 'タグ編集', '楽曲管理'],
};

export default function HomePage() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
