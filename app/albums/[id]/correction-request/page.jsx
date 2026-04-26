import { Suspense } from 'react';
import CorrectionRequestClient from './CorrectionRequestClient';

export default function CorrectionRequestPage({ params }) {
  return (
    <Suspense>
      <CorrectionRequestClient params={params} />
    </Suspense>
  );
}
