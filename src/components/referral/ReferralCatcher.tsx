"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from "@/providers/AuthProvider";
import { useLinkReferral } from '@/hooks/api/useWallet';

export function ReferralCatcher() {
    const searchParams = useSearchParams();
    const { isSignedIn } = useAuth();
    const { mutate: linkCode } = useLinkReferral();

    // 1. Catch the URL parameter and store it
    useEffect(() => {
        const ref = searchParams?.get('ref');
        if (ref) {
            console.log('[ReferralCatcher] Caught referral code from URL:', ref);
            localStorage.setItem('aau_pending_referral', ref);
        }
    }, [searchParams]);

    // 2. Consume the parameter once authenticated
    useEffect(() => {
        if (isSignedIn) {
            const savedRef = localStorage.getItem('aau_pending_referral');
            if (savedRef) {
                console.log('[ReferralCatcher] User is authenticated. Linking saved code:', savedRef);
                linkCode(savedRef);
                // Immediately clear to prevent infinite loop or double dipping requests
                localStorage.removeItem('aau_pending_referral');
            }
        }
    }, [isSignedIn, linkCode]);

    return null; // This is a purely logical component, no UI
}
