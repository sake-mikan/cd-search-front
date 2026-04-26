import { Suspense } from 'react';
import SeriesAlbumsClient from '@/components/SeriesAlbumsClient';

export const metadata = {
  title: 'シリーズ別アルバム一覧',
};

export default function SeriesAlbumsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SeriesAlbumsClient />
    </Suspense>
  );
}
