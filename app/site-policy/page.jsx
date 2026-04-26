import { Suspense } from 'react';
import SitePolicyClient from './SitePolicyClient';

export default function SitePolicyPage() {
  return (
    <Suspense>
      <SitePolicyClient />
    </Suspense>
  );
}