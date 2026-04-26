export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `MusicBrainz プレビュー (ID: ${id})`,
    description: 'MusicBrainz データベースから取得した CD 情報のプレビュー。収録楽曲やクレジット情報の確認、タグ書き込み用データの取得が可能です。',
  };
}

export default function MusicBrainzAlbumDetailLayout({ children }) {
  return children;
}
