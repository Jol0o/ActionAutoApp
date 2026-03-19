'use client';

import { Suspense } from 'react';
import { ProfileView } from '@/components/profile/ProfileView';

export default function CustomerSettingsPage() {
    return (
        <Suspense>
            <ProfileView />
        </Suspense>
    );
}
