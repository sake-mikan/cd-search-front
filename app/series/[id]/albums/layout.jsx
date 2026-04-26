export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `シリーズ別アルバム一覧 (ID: ${id})`,
    description: '特定のアニメシリーズやゲーム作品に関連するアルバム・CD情報を一覧表示。作品の世界観を彩る楽曲情報をまとめて確認できます。',
  };
}

export default function SeriesAlbumsLayout({ children }) {
  return children;
}
