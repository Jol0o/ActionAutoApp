'use client';

import { Suspense } from 'react';
import { DriverProfileView } from '@/components/driver-profile/DriverProfileView';

export default function DriverProfilePage() {
  return (
    <Suspense>
      <DriverProfileView />
    </Suspense>
  );
}