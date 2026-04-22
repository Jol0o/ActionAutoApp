"use client";

import * as React from "react"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDashboardStats } from "@/hooks/useDashboardStats"

// Modular Insight Components
import { StatHero } from "./components/StatHero"
import { LeaderboardPro } from "./components/LeaderboardPro"
import { LogisticsMonitor } from "./components/LogisticsMonitor"
import { RevenueIntelligence } from "./components/RevenueIntelligence"
import { OperationalHealth } from "./components/OperationalHealth"

export default function Dashboard() {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [revenuePeriod, setRevenuePeriod] = React.useState<string>("1Y");
  const [leaderboardMonth, setLeaderboardMonth] = React.useState<string>("Mar");

  const {
    data: metrics,
    isLoading,
    error,
  } = useDashboardStats(revenuePeriod, leaderboardMonth);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center p-8 border border-destructive/20 bg-destructive/5 rounded-3xl backdrop-blur-sm">
          <p className="text-destructive font-black tracking-tight text-lg mb-2">Intelligence Stream Offline</p>
          <p className="text-muted-foreground text-sm mb-6">We encountered a secure protocol error while fetching your metrics.</p>
          <Button variant="outline" className="border-destructive/20 hover:bg-destructive/10" onClick={() => window.location.reload()}>
            Re-establish Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 container mx-auto min-h-screen pb-12 animate-in fade-in duration-700">

      {/* ── Header Layer ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black tracking-widest uppercase px-2 py-0.5">
              Command Intelligence
            </Badge>
            <div className="size-1 rounded-full bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-3" />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              <span className="text-primary/60 font-black tabular-nums">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground italic">
            Dealership <span className="text-primary">Intelligence</span> Center
          </h1>
        </div>

        {/* Live Active Reps List */}
        <div className="flex items-center gap-3 bg-card/40 p-2 pl-4 rounded-2xl border border-border/20 backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mr-2">Active Reps</p>
          <div className="flex -space-x-2 mr-2">
            {metrics?.activeReps?.map((rep: any) => (
              <Avatar key={rep.name} className="border-2 border-background lg:size-10 md:size-8 size-6 shadow-xl transition-all hover:scale-110 hover:-translate-y-1 cursor-pointer ring-1 ring-primary/10">
                <AvatarImage src={rep.avatar} />
                <AvatarFallback className="text-xs bg-muted font-bold">{rep.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Performance Layer (Phase 1 Deep Intelligence) ─────────────── */}
      <StatHero metrics={metrics} isLoading={isLoading} />

      {/* ── Operational Dynamics (Leaderboard & Logistics) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8">
          <LeaderboardPro />
        </div>
        <div className="lg:col-span-4 h-full">
          <LogisticsMonitor data={metrics?.logistics} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Financial Trajectory Layer ───────────────────────────────────── */}
      <RevenueIntelligence
        trajectory={metrics?.revenueTrajectory || []}
        livePayments={metrics?.livePayments || []}
        period={revenuePeriod}
        onPeriodChange={setRevenuePeriod}
        isLoading={isLoading}
      />

      {/* ── Efficiency & Pipeline Health ─────────────────────────────────── */}
      <OperationalHealth metrics={metrics} isLoading={isLoading} />

    </div>
  );
}

function Select({
  children,
  defaultValue,
}: {
  children: React.ReactNode;
  defaultValue: string;
}) {
  return <div className="flex items-center">{children}</div>;
}
