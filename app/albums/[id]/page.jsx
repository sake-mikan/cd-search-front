import AlbumDetailClient from './AlbumDetailClient';
import { buildApiUrl } from "@/utils/baseUrl";

export async function generateMetadata({ params }) {
  const { id } = await params;

  let title = `アルバム詳細 (ID: ${id})`;
  try {
    const res = await fetch(buildApiUrl(`/albums/${id}`), { next: { revalidate: 3600 } });
    if (res.ok) {
      const album = await res.json();
      if (album?.title) {
        title = album.title;
        
        // 形態名（edition）があれば付与
        const edition = String(album.edition ?? '').trim();
        if (edition !== '' && edition !== '-') {
          title += ` [${edition}]`;
        }

        // 35文字を超える場合は省略（形態名を含めるため少し枠を広げました）
        if (title.length > 35) {
          title = title.substring(0, 35) + '...';
        }
      }
    }
  } catch (e) {
    console.error('Metadata fetch failed:', e);
  }

  return {
    title,
    description: '膨大なデータベースから収録曲、作詞・作曲・編曲のクレジット情報を網羅。ブラウザからローカル音楽ファイルへのタグ書き込み（タグ編集）機能も提供。',
  };
}

export default function AlbumDetailPage() {
  return <AlbumDetailClient />;
}
