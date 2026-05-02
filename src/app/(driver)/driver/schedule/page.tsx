"use client";

import * as React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
  Package,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

const ORANGE = "#E55A00";
const PAGE_BG = "#07070a";
const CARD_BG = "#0f0f14";
const BORDER = "rgba(255,255,255,0.07)";
const DISPLAY = "'Rajdhani', var(--font-sans), sans-serif";
const MONO = "'Share Tech Mono', 'Roboto Mono', monospace";

const statusThemes: Record<string, { bg: string; color: string; border: string }> = {
  "Posted": { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  "Assigned": { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  "Accepted": { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  "Picked Up": { bg: "rgba(249,115,22,0.1)", color: "#fb923c", border: "rgba(249,115,22,0.2)" },
  "In-Transit": { bg: "rgba(16,185,129,0.1)", color: "#34d399", border: "rgba(16,185,129,0.2)" },
  "Delivered": { bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "rgba(34,197,94,0.2)" },
  "Cancelled": { bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
};

interface GroupedLoads {
  [date: string]: any[];
}

export default function DriverSchedulePage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get("/api/driver-tracking/my-loads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // FIX: Correctly extract loads array from the nested data property
      const loadsData = res.data?.data?.loads || res.data?.data || [];
      setLoads(Array.isArray(loadsData) ? loadsData : []);
    } catch (e) {
      console.error("Failed to fetch schedule:", e);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upcoming = loads.filter(
    (l) => l.status !== "Delivered" && l.status !== "Cancelled"
  );

  const grouped = React.useMemo(() => {
    const groups: GroupedLoads = {};
    upcoming.forEach((load) => {
      const deadline = load.dates?.pickupDeadline || load.dates?.firstAvailable;
      const dateStr = deadline
        ? new Date(deadline).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        : "Unscheduled";
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(load);
    });
    return groups;
  }, [upcoming]);

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === "Unscheduled") return 1;
    if (b === "Unscheduled") return -1;
    // We need to parse back or use a more stable key, but for simple display this works
    // if the strings are formatted correctly. Better to sort by the actual first load's date.
    const dateA = grouped[a][0].dates?.pickupDeadline || grouped[a][0].dates?.firstAvailable;
    const dateB = grouped[b][0].dates?.pickupDeadline || grouped[b][0].dates?.firstAvailable;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  if (isLoading) {
    return (
      <div style={{ background: PAGE_BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: ORANGE, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", color: "#fff", padding: "24px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>My Schedule</h1>
        <p style={{ fontFamily: DISPLAY, fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          {upcoming.length} upcoming {upcoming.length === 1 ? "assignment" : "assignments"}
        </p>
      </header>

      {sortedDates.length === 0 ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.03)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Package style={{ width: 24, height: 24, color: "rgba(255,255,255,0.2)" }} />
          </div>
          <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, margin: 0 }}>Schedule Clear</h3>
          <p style={{ fontFamily: DISPLAY, fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8, maxWidth: 240, margin: "8px auto 0" }}>
            No upcoming loads assigned. Check the load board for new opportunities.
          </p>
          <Link href="/driver/available-loads" style={{ display: "inline-block", marginTop: 24, background: ORANGE, color: "#fff", padding: "10px 24px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontFamily: DISPLAY, fontSize: 14 }}>
            Browse Loads
          </Link>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {/* Vertical Timeline Line */}
          <div style={{ position: "absolute", left: 7, top: 20, bottom: 0, width: 2, background: "linear-gradient(to bottom, rgba(229,90,0,0.3) 0%, rgba(229,90,0,0) 100%)", borderRadius: 1 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {sortedDates.map((date, dateIdx) => (
              <motion.div 
                key={date}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dateIdx * 0.1 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, position: "relative", zIndex: 1 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: ORANGE, border: "4px solid #07070a", boxShadow: `0 0 0 1px ${ORANGE}33` }} />
                  <h2 style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{date}</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 28 }}>
                  {grouped[date].map((load, loadIdx) => {
                    const theme = statusThemes[load.status] || { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" };
                    
                    return (
                      <Link 
                        key={load._id} 
                        href={`/driver/loads/${load._id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <motion.div 
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ 
                            background: CARD_BG, 
                            border: `1px solid ${BORDER}`, 
                            borderRadius: 16, 
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            transition: "border-color 0.2s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <div>
                              <p style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.05em" }}>LOAD #</p>
                              <p style={{ fontFamily: MONO, fontSize: 14, color: "#fff", margin: 0, marginTop: 2 }}>{load.trackingNumber || load.loadNumber}</p>
                            </div>
                            <div style={{ 
                              background: theme.bg, 
                              color: theme.color, 
                              border: `1px solid ${theme.border}`,
                              padding: "4px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: DISPLAY,
                              textTransform: "uppercase"
                            }}>
                              {load.status}
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
                            <div>
                              <p style={{ fontFamily: DISPLAY, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", margin: 0 }}>Origin</p>
                              <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, margin: "2px 0 0", color: "#fff" }}>{load.origin || `${load.pickupLocation?.city}, ${load.pickupLocation?.state}`}</p>
                            </div>
                            <ArrowRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.1)" }} />
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontFamily: DISPLAY, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", margin: 0 }}>Destination</p>
                              <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, margin: "2px 0 0", color: "#fff" }}>{load.destination || `${load.deliveryLocation?.city}, ${load.deliveryLocation?.state}`}</p>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Clock style={{ width: 12, height: 12, color: ORANGE }} />
                              <span style={{ fontFamily: MONO, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                {load.dates?.pickupDeadline ? new Date(load.dates.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Flexible"}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: ORANGE }}>
                              <span style={{ fontFamily: DISPLAY, fontSize: 12, fontWeight: 700 }}>Details</span>
                              <ChevronRight style={{ width: 14, height: 14 }} />
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
