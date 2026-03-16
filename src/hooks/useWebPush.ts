"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function useWebPush() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to convert VAPID key
    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const getSubscription = useCallback(async () => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
            setIsSupported(false);
            setIsLoading(false);
            return null;
        }

        try {
            setIsSupported(true);

            // Timeout after 5 seconds if SW doesn't respond
            const swReadyPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Service Worker timeout")), 5000)
            );

            const registration = await Promise.race([swReadyPromise, timeoutPromise]) as ServiceWorkerRegistration;
            const subscription = await registration.pushManager.getSubscription();

            setIsSubscribed(!!subscription);
            return subscription;
        } catch (error) {
            console.warn("[WebPush] Initialization error or timeout:", error);
            // Don't disable support entirely on timeout, just stop loading
        } finally {
            setIsLoading(false);
        }
        return null;
    }, []);

    useEffect(() => {
        getSubscription();
    }, [getSubscription]);

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error("VAPID Public Key missing from environment variables.");
            return;
        }

        try {
            setIsLoading(true);
            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Send to backend
            await apiClient.post("/api/push/subscribe", {
                subscription,
                deviceHint: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop",
            });

            setIsSubscribed(true);
            toast.success("Notifications enabled!");
        } catch (error) {
            console.error("Failed to subscribe to Web Push:", error);
            toast.error("Failed to enable notifications. Please check your browser settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        try {
            setIsLoading(true);
            const subscription = await getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from backend
                await apiClient.delete("/api/push/subscribe", {
                    data: { endpoint: subscription.endpoint },
                });

                setIsSubscribed(false);
                toast.info("Notifications disabled.");
            }
        } catch (error) {
            console.error("Failed to unsubscribe from Web Push:", error);
            toast.error("Failed to disable notifications.");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isSupported,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
        refreshSubscription: getSubscription,
    };
}
