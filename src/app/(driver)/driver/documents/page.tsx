'use client';

import { Suspense } from 'react';
import { DocumentsPage } from '@/components/driver-profile/DocumentsPage';

export default function DriverDocumentsPage() {
  return (
    <Suspense>
      <DocumentsPage />
    </Suspense>
  );
}
