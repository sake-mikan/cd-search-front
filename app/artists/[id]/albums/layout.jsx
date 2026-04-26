export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `アーティスト別アルバム一覧 (ID: ${id})`,
    description: '特定のアーティスト・声優に関連するCD・アルバム情報を一覧で表示。発売日順やタイトル順での並び替えも可能です。',
  };
}

export default function ArtistAlbumsLayout({ children }) {
  return children;
}
