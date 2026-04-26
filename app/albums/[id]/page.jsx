import AlbumDetailClient from './AlbumDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `アルバム詳細 (ID: ${id})`,
    description: '膨大なデータベースから収録曲、作詞・作曲・編曲のクレジット情報を網羅。ブラウザからローカル音楽ファイルへのタグ書き込み（タグ編集）機能も提供。',
  };
}

export default function AlbumDetailPage() {
  return <AlbumDetailClient />;
}