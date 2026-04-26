import TrackSearchClient from '@/components/TrackSearchClient';

export const metadata = {
  title: '楽曲名検索',
  description: '膨大なデータベースから楽曲名で即座に検索。収録アルバム、アーティスト、作詞・作曲・編曲のクレジット情報を一覧で確認。',
  keywords: ['楽曲検索', 'アニソン検索', '歌詞クレジット', '作曲家検索'],
};

export default function TrackSearchPage() {
  return <TrackSearchClient />;
}
