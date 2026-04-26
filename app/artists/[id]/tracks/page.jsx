import { Suspense } from 'react';
import ArtistTracksClient from '@/components/ArtistTracksClient';

export const metadata = {
  title: 'アーティスト関連曲一覧',
};

export default function ArtistTracksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArtistTracksClient />
    </Suspense>
  );
}
