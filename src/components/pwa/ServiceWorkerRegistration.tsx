"use client";

import { useEffect } from "react";

const ENABLE_SW_DEV = process.env.NEXT_PUBLIC_ENABLE_SW_DEV === "true";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
        if (process.env.NODE_ENV === "development" && !ENABLE_SW_DEV) return;

        let cancelled = false;

        const registerServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js");
                if (!cancelled) {
                    console.log("[SW] Registered:", registration.scope);
                }
            } catch (error) {
                if (!cancelled) {
                    console.warn("[SW] Registration failed:", error);
                }
            }
        };

        registerServiceWorker();

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
