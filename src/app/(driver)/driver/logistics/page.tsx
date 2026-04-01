'use client';

import { Suspense } from 'react';
import { LogisticsPage } from '@/components/driver-profile/LogisticsPage';

export default function DriverLogisticsPage() {
  return (
    <Suspense>
      <LogisticsPage />
    </Suspense>
  );
}
