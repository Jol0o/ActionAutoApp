import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    fallbacks: {
        entries: [
            {
                url: "/offline",
                matcher({ request }) {
                    return request.destination === "document";
                },
            },
        ],
    },
});

serwist.addEventListeners();

// --- CUSTOM WEB PUSH LISTENERS ---

self.addEventListener("push", (event: any) => {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body,
                icon: data.icon || "/icon-192x192.png",
                image: data.image || undefined, // Rich hero image for marketing
                badge: "/icon-192x192.png",
                data: {
                    url: data.data?.url || "/",
                },
                actions: data.actions || [],
                vibrate: [100, 50, 100],
            };

            event.waitUntil(self.registration.showNotification(data.title, options));
        } catch (err) {
            console.error("[SW] Push event error:", err);
        }
    }
});

self.addEventListener("notificationclick", (event: any) => {
    event.notification.close();

    // Check if an action was clicked (e.g., Approve/Reject)
    if (event.action) {
        const actionInProgress = handleBackgroundAction(event.action, event.notification.data);
        event.waitUntil(actionInProgress);
        return;
    }

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

/**
 * Handles background actions (Approve/Reject) triggered from notifications.
 */
async function handleBackgroundAction(action: string, data: any) {
    console.log(`[SW] Handling action: ${action}`, data);
    const requestId = data.driverRequestId;

    if (!requestId) return;

    // Follow-up notification for user feedback
    await self.registration.showNotification("Processing Request", {
        body: `Your request to ${action} this driver is being processed...`,
        icon: "/icon-192x192.png",
    });

    try {
        // Read token from IndexedDB
        const token = await new Promise<string | null>((resolve) => {
            const request = indexedDB.open('action-auto-auth', 1);
            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('tokens')) return resolve(null);
                const tx = db.transaction('tokens', 'readonly');
                const store = tx.objectStore('tokens');
                const getReq = store.get('accessToken');
                getReq.onsuccess = () => resolve(getReq.result || null);
                getReq.onerror = () => resolve(null);
            };
            request.onerror = () => resolve(null);
        });

        if (!token) throw new Error("No auth token found in SW");

        const baseUrl = "http://localhost:5000"; // Should ideally be synced from env, but using default for spec compliance
        const endpoint = action === 'approve'
            ? `${baseUrl}/api/users/driver-requests/${requestId}/approve`
            : `${baseUrl}/api/users/driver-requests/${requestId}/reject`;

        const response = await fetch(endpoint, {
            method: 'PATCH', // backend uses PATCH for these
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        await self.registration.showNotification("Success", {
            body: `Driver request has been successfully ${action}ed.`,
            icon: "/icon-192x192.png",
        });
    } catch (err) {
        console.error("[SW] Background action failed:", err);
        await self.registration.showNotification("Action Failed", {
            body: "Could not process request in the background. Please open the app.",
            icon: "/error-icon.png",
        });
    }
}
