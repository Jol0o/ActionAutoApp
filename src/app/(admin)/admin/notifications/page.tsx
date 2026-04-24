'use client';

import { Suspense } from 'react';
import { NotificationPage } from '@/components/notifications';

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationPage />
    </Suspense>
  );
}
