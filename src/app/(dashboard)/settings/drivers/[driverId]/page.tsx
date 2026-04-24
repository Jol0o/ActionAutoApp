'use client';

import { DriverDetailView } from '@/components/settings/driver-detail-view';
import { useParams } from 'next/navigation';

export default function DriverDetailPage() {
    const params = useParams();
    const driverId = params.driverId as string;
    return <DriverDetailView driverId={driverId} />;
}
