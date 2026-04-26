import { Suspense } from 'react';
import TracksClient from './TracksClient';

export default function TracksPage() {
  return (
    <Suspense>
      <TracksClient />
    </Suspense>
  );
}
