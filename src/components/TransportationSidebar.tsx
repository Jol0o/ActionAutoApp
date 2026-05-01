"use client";

import { X, Phone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadStats } from "@/lib/api/loads";
import { LoadStatus } from "@/types/load";

interface TransportationSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  stats: LoadStats;
  loadStats?: LoadStats;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function TransportationSidebar({
  activeTab,
  setActiveTab,
  selectedStatus,
  setSelectedStatus,
  stats,
  loadStats,
  isSidebarOpen,
  setIsSidebarOpen,
}: TransportationSidebarProps) {
  const colorMap: Record<
    string,
    { light: string; dark: string; bg: string; bgDark: string }
  > = {
    Posted: {
      light: "bg-green-50 text-green-700",
      dark: "dark:bg-green-950 dark:text-green-300",
      bg: "bg-green-500",
      bgDark: "dark:bg-green-400",
    },
    Assigned: {
      light: "bg-blue-50 text-blue-700",
      dark: "dark:bg-blue-950 dark:text-blue-300",
      bg: "bg-blue-500",
      bgDark: "dark:bg-blue-400",
    },
    Accepted: {
        light: "bg-purple-50 text-purple-700",
        dark: "dark:bg-purple-950 dark:text-purple-300",
        bg: "bg-purple-500",
        bgDark: "dark:bg-purple-400",
    },
    "Picked Up": {
      light: "bg-indigo-50 text-indigo-700",
      dark: "dark:bg-indigo-950 dark:text-indigo-300",
      bg: "bg-indigo-500",
      bgDark: "dark:bg-indigo-400",
    },
    "In-Transit": {
      light: "bg-sky-50 text-sky-700",
      dark: "dark:bg-sky-950 dark:text-sky-300",
      bg: "bg-sky-500",
      bgDark: "dark:bg-sky-400",
    },
    Delivered: {
      light: "bg-emerald-50 text-emerald-700",
      dark: "dark:bg-emerald-950 dark:text-emerald-300",
      bg: "bg-emerald-500",
      bgDark: "dark:bg-emerald-400",
    },
    Cancelled: {
      light: "bg-red-50 text-red-700",
      dark: "dark:bg-red-950 dark:text-red-300",
      bg: "bg-red-500",
      bgDark: "dark:bg-red-400",
    },
  };

  const defaultColor = {
    light: "bg-slate-50 text-slate-700",
    dark: "dark:bg-slate-950 dark:text-slate-300",
    bg: "bg-slate-500",
    bgDark: "dark:bg-slate-400",
  };

  const currentStats = activeTab === "load-board" ? (loadStats || stats) : stats;

  return (
    <div
      className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 sm:w-72 md:w-80 lg:w-64 bg-card border-r border-border min-h-screen p-4 sm:p-5 md:p-6
            transform transition-transform duration-300 ease-in-out
            overflow-y-auto
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
    >
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="lg:hidden absolute top-4 right-4 p-1 hover:bg-muted rounded"
      >
        <X className="w-5 h-5 text-foreground" />
      </button>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-8 sm:h-10">
          <TabsTrigger
            value="shipments"
            className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-2"
          >
            My Loads
          </TabsTrigger>
          <TabsTrigger
            value="drafts"
            className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-2"
          >
            Quotes
          </TabsTrigger>
          <TabsTrigger
            value="load-board"
            className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-2"
          >
            Board
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-1.5 sm:space-y-2">
        <button
          onClick={() => {
            setSelectedStatus("all");
            setIsSidebarOpen(false);
          }}
          className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm transition-colors ${selectedStatus === "all"
            ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
            : "hover:bg-muted text-foreground"
            }`}
        >
          <span className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 dark:bg-yellow-500 rounded-sm"></span>
            <span className="truncate">Show All</span>
          </span>
          <span className="text-muted-foreground ml-2 font-mono">{currentStats.all}</span>
        </button>

        {Object.entries(currentStats).map(([status, count]) => {
          if (status === "all") return null;
          const colors = colorMap[status] || defaultColor;
          return (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm transition-colors ${selectedStatus === status
                ? `${colors.light} ${colors.dark}`
                : "hover:bg-muted text-foreground"
                }`}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors.bg} ${colors.bgDark} rounded-sm`}
                ></span>
                <span className="truncate">{status}</span>
              </span>
              <span className="text-muted-foreground ml-2 font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border">
        <p className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-foreground uppercase tracking-wider">
          Support Center
        </p>
        <div className="space-y-3 text-xs sm:text-sm">
          <a
            href="mailto:support@actionautoutah.com"
            className="flex items-center gap-2 text-primary hover:underline font-medium"
          >
            support@actionautoutah.com
          </a>
          <a
            href="tel:8554316570"
            className="flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <Phone className="size-3.5 sm:size-4" />
            (855) 431-6570
          </a>
        </div>
      </div>
    </div>
  );
}
