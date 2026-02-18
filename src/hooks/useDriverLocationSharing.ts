import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";

type DriverStatus = "on-route" | "idle" | "offline";

const INTERVAL_MS = 10000;

export function useDriverLocationSharing() {
  const { getToken } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState<DriverStatus>("idle");
  const [lastShareAt, setLastShareAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const sendLocation = useCallback(
    async (lat: number, lng: number, driverStatus: DriverStatus) => {
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/driver-tracking/location",
          { lat, lng, status: driverStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLastShareAt(new Date().toLocaleTimeString());
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Failed to share location");
      }
    },
    [getToken]
  );

  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setError(null);
    setIsSharing(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        lastCoordsRef.current = { lat, lng };
        const now = Date.now();
        if (now - lastSentRef.current >= INTERVAL_MS) {
          lastSentRef.current = now;
          sendLocation(lat, lng, status);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    watchIdRef.current = id;
  }, [sendLocation, status]);

  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);

    // Send offline status
    if (lastCoordsRef.current) {
      await sendLocation(
        lastCoordsRef.current.lat,
        lastCoordsRef.current.lng,
        "offline"
      );
    }
  }, [sendLocation]);

  const updateStatus = useCallback(
    (newStatus: DriverStatus) => {
      setStatus(newStatus);
      if (isSharing && lastCoordsRef.current) {
        sendLocation(
          lastCoordsRef.current.lat,
          lastCoordsRef.current.lng,
          newStatus
        );
      }
    },
    [isSharing, sendLocation]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isSharing,
    status,
    lastShareAt,
    error,
    startSharing,
    stopSharing,
    updateStatus,
    lastCoords: lastCoordsRef.current,
  };
}
