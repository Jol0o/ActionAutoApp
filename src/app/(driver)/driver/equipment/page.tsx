'use client';

import { Suspense } from 'react';
import { EquipmentPage } from '@/components/driver-profile/EquipmentPage';

export default function DriverEquipmentPage() {
  return (
    <Suspense>
      <EquipmentPage />
    </Suspense>
  );
}
