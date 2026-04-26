import { Suspense } from 'react';
import MusicBrainzDetailClient from './MusicBrainzDetailClient';

export default function MusicBrainzDetailPage({ params }) {
  return (
    <Suspense>
      <MusicBrainzDetailClient params={params} />
    </Suspense>
  );
}
