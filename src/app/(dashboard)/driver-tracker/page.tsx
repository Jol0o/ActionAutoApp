"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import { DriverTrackingItem, DriverStatus } from "@/types/driver-tracking";
import { Shipment } from "@/types/transportation";
import { DriverTrackerMap } from "@/components/driver-tracker/DriverTrackerMap";
import { DriverTrackerShareCard } from "@/components/driver-tracker/DriverTrackerShareCard";
import { DriverTrackerLoadsCard } from "@/components/driver-tracker/DriverTrackerLoadsCard";
import { DriverTrackerListCard } from "@/components/driver-tracker/DriverTrackerListCard";
import { DriverAssignLoadModal } from "@/components/driver-tracker/DriverAssignLoadModal";
import { Input } from "@/components/ui/input";

type FilterKey = "all" | "active" | "offline";

const statusLabel: Record<DriverStatus, string> = {
  "on-route": "On Route",
  idle: "Idle",
  offline: "Offline",
};

const statusStyles: Record<DriverStatus, string> = {
  "on-route": "bg-emerald-500",
  idle: "bg-amber-500",
  offline: "bg-slate-400",
};

const statusText: Record<DriverStatus, string> = {
  "on-route": "text-emerald-600",
  idle: "text-amber-600",
  offline: "text-slate-500",
};

const mapPinColor: Record<DriverStatus, string> = {
  "on-route": "#10b981",
  idle: "#f59e0b",
  offline: "#94a3b8",
};

const LOCATION_INTERVAL_MS = 10000;
const MAP_CENTER = { lat: 39.8283, lng: -98.5795 };

export default function DriverTrackerPage() {
  const { getToken, isSignedIn } = useAuth();
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [driverQuery, setDriverQuery] = React.useState("");
  const [drivers, setDrivers] = React.useState<DriverTrackingItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareStatus, setShareStatus] =
    React.useState<DriverStatus>("on-route");
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [lastShareAt, setLastShareAt] = React.useState<string | null>(null);
  const [mapNotice, setMapNotice] = React.useState<string | null>(null);
  const [availableShipments, setAvailableShipments] = React.useState<
    Shipment[]
  >([]);
  const [shipmentsLoading, setShipmentsLoading] = React.useState(false);
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);
  const [assigningTo, setAssigningTo] =
    React.useState<DriverTrackingItem | null>(null);

  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<mapboxgl.Map | null>(null);
  const markersRef = React.useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupsRef = React.useRef<Map<string, mapboxgl.Popup>>(new Map());
  const watchIdRef = React.useRef<number | null>(null);
  const lastSentRef = React.useRef<number>(0);
  const lastCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const hasFlownRef = React.useRef<boolean>(false);
  const locationNamesRef = React.useRef<Map<string, string>>(new Map());

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const normalizedToken = mapboxToken?.trim();

  const filteredDrivers = React.useMemo(() => {
    const query = driverQuery.trim().toLowerCase();
    const matchesQuery = (driver: DriverTrackingItem) => {
      if (!query) return true;
      const name = driver.driver?.name?.toLowerCase() || "";
      const tracking =
        driver.shipments
          ?.map((s) => s.trackingNumber?.toLowerCase() || "")
          .join(" ") || "";
      return name.includes(query) || tracking.includes(query);
    };
    if (filter === "offline") {
      return drivers.filter(
        (driver) => driver.status === "offline" && matchesQuery(driver),
      );
    }
    if (filter === "active") {
      return drivers.filter(
        (driver) => driver.status !== "offline" && matchesQuery(driver),
      );
    }
    return drivers.filter(matchesQuery);
  }, [drivers, filter, driverQuery]);

  const activeDrivers = React.useMemo(() => {
    const query = driverQuery.trim().toLowerCase();
    const matchesQuery = (driver: DriverTrackingItem) => {
      if (!query) return true;
      const name = driver.driver?.name?.toLowerCase() || "";
      const tracking =
        driver.shipments
          ?.map((s) => s.trackingNumber?.toLowerCase() || "")
          .join(" ") || "";
      return name.includes(query) || tracking.includes(query);
    };
    return drivers.filter((d) => d.status !== "offline" && matchesQuery(d));
  }, [drivers, driverQuery]);

  const driversWithLoads = React.useMemo(
    () => drivers.filter((d) => d.shipments && d.shipments.length > 0),
    [drivers],
  );

  const fetchDrivers = React.useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const statusParam = filter === "offline" ? "offline" : "all";
      const response = await apiClient.get("/api/driver-tracking/active", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          status: statusParam,
        },
      });
      const data = response.data?.data || [];
      const normalized = data.map((item: DriverTrackingItem) => ({
        ...item,
        shipments: Array.isArray(item.shipments) ? item.shipments : [],
      }));
      setDrivers(normalized);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to load drivers",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn, filter]);

  const fetchAvailableShipments = React.useCallback(async () => {
    if (!isSignedIn) return;
    setShipmentsLoading(true);
    try {
      const token = await getToken();
      const response = await apiClient.get("/api/shipments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all: Shipment[] = response.data?.data || response.data || [];
      setAvailableShipments(
        all.filter(
          (s) => s.status === "Available for Pickup" && !s.assignedDriverId,
        ),
      );
    } catch {
      // non-critical — silent fail
    } finally {
      setShipmentsLoading(false);
    }
  }, [getToken, isSignedIn]);

  const handleAssignLoad = React.useCallback(
    async (shipmentId: string) => {
      if (!assigningTo?.driver?.id || !isSignedIn) return;
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/assign-load",
        { shipmentId, driverId: assigningTo.driver.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchDrivers();
      fetchAvailableShipments();
    },
    [assigningTo, getToken, isSignedIn, fetchDrivers, fetchAvailableShipments],
  );

  React.useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, LOCATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  React.useEffect(() => {
    fetchAvailableShipments();
  }, [fetchAvailableShipments]);

  React.useEffect(() => {
    if (!normalizedToken || !mapRef.current || mapInstanceRef.current) return;

    if (!normalizedToken.startsWith("pk.")) {
      setMapNotice(
        "Invalid Mapbox token. Use a public token starting with pk.",
      );
      return;
    }

    if (!mapboxgl.supported()) {
      setMapNotice(
        "Mapbox requires WebGL. Please enable hardware acceleration.",
      );
      return;
    }

    mapboxgl.accessToken = normalizedToken;
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [MAP_CENTER.lng, MAP_CENTER.lat],
      zoom: 4,
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    setMapNotice("Loading map tiles...");

    const handleLoad = () => {
      map.resize();
    };

    const handleIdle = () => {
      setMapNotice(null);
    };

    const handleError = (event: any) => {
      const status = event?.error?.status;
      const message = event?.error?.message || "Map failed to load";
      const detail = status ? `${message} (HTTP ${status})` : message;
      setMapNotice(detail);
    };

    const loadTimeout = window.setTimeout(() => {
      if (!map.isStyleLoaded()) {
        setMapNotice(
          "Map style not loaded. Check token or network restrictions.",
        );
        return;
      }
      const rect = mapRef.current?.getBoundingClientRect();
      const sizeInfo = rect
        ? ` (size ${Math.round(rect.width)}x${Math.round(rect.height)})`
        : "";
      setMapNotice(
        `Map tiles are not loading. Check token or network restrictions.${sizeInfo}`,
      );
    }, 8000);

    const resizeTimeout = window.setTimeout(() => {
      map.resize();
    }, 500);

    const handleLoadWithTimeout = () => {
      window.clearTimeout(loadTimeout);
      handleLoad();
    };

    map.on("load", handleLoadWithTimeout);
    map.on("idle", handleIdle);
    map.on("error", handleError);

    return () => {
      window.clearTimeout(loadTimeout);
      window.clearTimeout(resizeTimeout);
      map.off("load", handleLoadWithTimeout);
      map.off("idle", handleIdle);
      map.off("error", handleError);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapboxToken]);

  React.useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const markers = markersRef.current;
    const popups = popupsRef.current;
    const activeIds = new Set<string>();

    filteredDrivers.forEach((driver) => {
      if (!driver.coords) return;
      const position = [driver.coords.lng, driver.coords.lat] as [
        number,
        number,
      ];

      const coordKey = `${driver.coords.lat.toFixed(2)},${driver.coords.lng.toFixed(2)}`;
      const cachedLocation = locationNamesRef.current.get(coordKey);

      const buildPopupHtml = (locationName?: string) => `
        <div style="font-size:12px;line-height:1.5;padding:2px 4px;min-width:130px;color:#111827">
          <div style="font-weight:600;margin-bottom:2px;color:#111827">${driver.driver?.name || "Unknown Driver"}</div>
          <div style="color:${mapPinColor[driver.status]};margin-bottom:2px">${statusLabel[driver.status]}</div>
          ${locationName ? `<div style="color:#374151;font-size:11px;margin-bottom:1px">${locationName}</div>` : ""}
          ${driver.shipments.length > 0 ? `<div style="color:#6b7280;font-size:11px">${driver.shipments.length} load${driver.shipments.length !== 1 ? "s" : ""}</div>` : ""}
        </div>`;

      const popupHtml = buildPopupHtml(cachedLocation);

      const buildPinSvg = (color: string) =>
        `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events:none">
          <path d="M14 1C7.925 1 3 5.925 3 12C3 19.5 14 34 14 34C14 34 25 19.5 25 12C25 5.925 20.075 1 14 1Z"
            fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="14" cy="12" r="4.5" fill="white"/>
        </svg>`;

      let marker = markers.get(driver.id);
      if (!marker) {
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.style.width = "28px";
        el.style.height = "36px";
        el.innerHTML = buildPinSvg(mapPinColor[driver.status]);

        const popup = new mapboxgl.Popup({
          offset: [0, -36],
          closeButton: false,
          className: "driver-popup",
        }).setHTML(popupHtml);

        marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(position)
          .setPopup(popup)
          .addTo(map);

        markers.set(driver.id, marker);
        popups.set(driver.id, popup);
      } else {
        marker.setLngLat(position);
        const path = marker.getElement().querySelector("path");
        if (path) path.setAttribute("fill", mapPinColor[driver.status]);
        popups.get(driver.id)?.setHTML(popupHtml);
      }
      activeIds.add(driver.id);

      if (!locationNamesRef.current.has(coordKey) && normalizedToken) {
        const driverId = driver.id;
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${driver.coords.lng},${driver.coords.lat}.json?types=neighborhood,locality,place&limit=1&access_token=${normalizedToken}`,
        )
          .then((r) => r.json())
          .then((data) => {
            const raw: string = data.features?.[0]?.place_name ?? "";
            const locationName = raw.split(",").slice(0, 2).join(",").trim();
            if (locationName) {
              locationNamesRef.current.set(coordKey, locationName);
              popupsRef.current
                .get(driverId)
                ?.setHTML(buildPopupHtml(locationName));
            }
          })
          .catch(() => {});
      }
    });

    markers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        markers.delete(id);
        popups.get(id)?.remove();
        popups.delete(id);
      }
    });
  }, [filteredDrivers]);

  const sendLocationUpdate = React.useCallback(
    async (
      coords: { lat: number; lng: number },
      statusOverride?: DriverStatus,
    ) => {
      if (!isSignedIn) return;
      const token = await getToken();
      await apiClient.post(
        "/api/driver-tracking/location",
        {
          lat: coords.lat,
          lng: coords.lng,
          status: statusOverride ?? shareStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    },
    [getToken, isSignedIn, shareStatus],
  );

  React.useEffect(() => {
    if (!isSharing) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setShareError("Geolocation is not supported on this device");
      setIsSharing(false);
      return;
    }

    setShareError(null);
    hasFlownRef.current = false;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastSentRef.current < LOCATION_INTERVAL_MS) return;

        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        lastCoordsRef.current = coords;
        lastSentRef.current = now;

        if (!hasFlownRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 15,
            essential: true,
          });
          hasFlownRef.current = true;
        }

        try {
          await sendLocationUpdate(coords);
          setLastShareAt(new Date().toLocaleTimeString());
        } catch (err: any) {
          setShareError(
            err.response?.data?.message ||
              err.message ||
              "Failed to send location",
          );
        }
      },
      (error) => {
        setShareError(error.message);
        setIsSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    watchIdRef.current = watchId;
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSharing, sendLocationUpdate]);

  const handleStopSharing = async () => {
    setIsSharing(false);
    if (lastCoordsRef.current) {
      try {
        await sendLocationUpdate(
          {
            lat: lastCoordsRef.current.lat,
            lng: lastCoordsRef.current.lng,
          },
          "offline",
        );
      } catch (err: any) {
        setShareError(
          err.response?.data?.message ||
            err.message ||
            "Failed to update status",
        );
      }
    }
  };

  const zoomMap = (delta: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const nextZoom = map.getZoom() + delta;
    map.setZoom(Math.max(2, Math.min(18, nextZoom)));
  };

  const centerOnMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.setCenter([position.coords.longitude, position.coords.latitude]);
      map.setZoom(12);
    });
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Driver Tracker
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Real-time GPS tracking and monitoring
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-muted p-1 w-fit">
            {(
              [
                { key: "all", label: "All Drivers" },
                { key: "active", label: "Active" },
                { key: "offline", label: "Offline" },
              ] as { key: FilterKey; label: string }[]
            ).map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={filter === item.key ? "default" : "ghost"}
                className={
                  filter === item.key
                    ? "h-8 rounded-full px-4 text-xs"
                    : "h-8 rounded-full px-4 text-xs text-muted-foreground"
                }
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Input
            value={driverQuery}
            onChange={(event) => setDriverQuery(event.target.value)}
            placeholder="Search driver or load..."
            className="h-9 w-full sm:w-56 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <DriverTrackerMap
          mapboxToken={normalizedToken}
          mapRef={mapRef}
          onZoomIn={() => zoomMap(1)}
          onZoomOut={() => zoomMap(-1)}
          onCenter={centerOnMe}
          mapNotice={mapNotice}
        />

        <div className="space-y-4">
          <DriverTrackerShareCard
            shareStatus={shareStatus}
            onStatusChange={setShareStatus}
            isSharing={isSharing}
            onToggleSharing={() =>
              isSharing ? handleStopSharing() : setIsSharing(true)
            }
            lastShareAt={lastShareAt}
            shareError={shareError}
          />

          <DriverTrackerLoadsCard
            drivers={driversWithLoads}
            isLoading={isLoading}
            error={error}
          />

          <DriverTrackerListCard
            drivers={activeDrivers}
            isLoading={isLoading}
            error={error}
            statusLabel={statusLabel}
            statusStyles={statusStyles}
            statusText={statusText}
            onDriverClick={(driver) => {
              const map = mapInstanceRef.current;
              if (!map || !driver.coords) return;
              map.flyTo({
                center: [driver.coords.lng, driver.coords.lat],
                zoom: 15,
                essential: true,
              });
            }}
            onAssignLoad={(driver) => {
              setAssigningTo(driver);
              setAssignModalOpen(true);
            }}
          />
        </div>
      </div>

      <DriverAssignLoadModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        driver={assigningTo}
        availableShipments={availableShipments}
        isLoading={shipmentsLoading}
        onAssign={handleAssignLoad}
      />
    </div>
  );
}
