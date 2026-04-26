import { Suspense } from 'react';
import ArtistAlbumsClient from '@/components/ArtistAlbumsClient';

export const metadata = {
  title: 'アーティスト別アルバム一覧',
};

export default function ArtistAlbumsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArtistAlbumsClient />
    </Suspense>
  );
}
