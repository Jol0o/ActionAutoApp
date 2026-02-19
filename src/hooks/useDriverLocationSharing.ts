import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";

type DriverStatus = "on-route" | "idle" | "offline";

const INTERVAL_MS = 10000;
const STORAGE_KEY = "driver_location_sharing_enabled";

type SharingRuntime = {
  isSharing: boolean;
  status: DriverStatus;
  lastShareAt: string | null;
  error: string | null;
  watchId: number | null;
  lastSentAt: number;
  lastCoords: { lat: number; lng: number } | null;
  listeners: Set<() => void>;
};

const runtime: SharingRuntime = {
  isSharing: false,
  status: "idle",
  lastShareAt: null,
  error: null,
  watchId: null,
  lastSentAt: 0,
  lastCoords: null,
  listeners: new Set(),
};

const notifyListeners = () => {
  runtime.listeners.forEach((listener) => listener());
};

export function useDriverLocationSharing() {
  const { getToken } = useAuth();
  const [isSharing, setIsSharing] = useState(runtime.isSharing);
  const [status, setStatus] = useState<DriverStatus>(runtime.status);
  const [lastShareAt, setLastShareAt] = useState<string | null>(
    runtime.lastShareAt,
  );
  const [error, setError] = useState<string | null>(runtime.error);

  const syncFromRuntime = useRef(() => {
    setIsSharing(runtime.isSharing);
    setStatus(runtime.status);
    setLastShareAt(runtime.lastShareAt);
    setError(runtime.error);
  });

  const sendLocation = useCallback(
    async (lat: number, lng: number, driverStatus: DriverStatus) => {
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/location",
          { lat, lng, status: driverStatus },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        runtime.lastShareAt = new Date().toLocaleTimeString();
        runtime.error = null;
        notifyListeners();
      } catch (err: any) {
        runtime.error = err?.message || "Failed to share location";
        notifyListeners();
      }
    },
    [getToken],
  );

  const startSharing = useCallback(() => {
    if (runtime.isSharing && runtime.watchId !== null) {
      return;
    }

    if (!navigator.geolocation) {
      runtime.error = "Geolocation is not supported by your browser";
      notifyListeners();
      return;
    }

    runtime.error = null;
    runtime.isSharing = true;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    notifyListeners();

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        runtime.lastCoords = { lat, lng };
        const now = Date.now();
        if (now - runtime.lastSentAt >= INTERVAL_MS) {
          runtime.lastSentAt = now;
          sendLocation(lat, lng, runtime.status);
        }
      },
      (err) => {
        runtime.error = `Location error: ${err.message}`;
        runtime.isSharing = false;
        if (runtime.watchId !== null) {
          navigator.geolocation.clearWatch(runtime.watchId);
          runtime.watchId = null;
        }
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        notifyListeners();
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    runtime.watchId = id;
    notifyListeners();
  }, [sendLocation]);

  const stopSharing = useCallback(async () => {
    if (runtime.watchId !== null) {
      navigator.geolocation.clearWatch(runtime.watchId);
      runtime.watchId = null;
    }

    runtime.isSharing = false;
    runtime.lastSentAt = 0;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    notifyListeners();

    // Send offline status
    if (runtime.lastCoords) {
      await sendLocation(
        runtime.lastCoords.lat,
        runtime.lastCoords.lng,
        "offline",
      );
    }
  }, [sendLocation]);

  const updateStatus = useCallback(
    (newStatus: DriverStatus) => {
      runtime.status = newStatus;
      notifyListeners();

      if (runtime.isSharing && runtime.lastCoords) {
        sendLocation(runtime.lastCoords.lat, runtime.lastCoords.lng, newStatus);
      }
    },
    [sendLocation],
  );

  useEffect(() => {
    const sync = syncFromRuntime.current;
    runtime.listeners.add(sync);
    sync();

    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY) === "1" &&
      !runtime.isSharing
    ) {
      startSharing();
    }

    return () => {
      runtime.listeners.delete(sync);
    };
  }, [startSharing]);

  return {
    isSharing,
    status,
    lastShareAt,
    error,
    startSharing,
    stopSharing,
    updateStatus,
    lastCoords: runtime.lastCoords,
  };
}
