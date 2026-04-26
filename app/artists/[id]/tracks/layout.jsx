export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `アーティスト別楽曲一覧 (ID: ${id})`,
    description: '特定のアーティスト・声優・作曲家が参加している楽曲を横断検索。作詞・作曲・編曲などの役割別に楽曲を一覧できます。',
  };
}

export default function ArtistTracksLayout({ children }) {
  return children;
}
