"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Zap,
  Info,
  ArrowLeft,
  CreditCard,
  Settings,
  Terminal,
  CheckCircle2,
  Phone,
  MessageSquare,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { marketplacePlugins, Plugin, CATEGORIES } from "@/data/plugins";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PluginMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>(marketplacePlugins);

  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "installed"
          ? p.status === "active"
          : p.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [plugins, searchQuery, selectedCategory]);

  const handleEnroll = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, status: "enrolling" } : p)),
    );

    setTimeout(() => {
      setPlugins((prev) => {
        const updated = prev.map((p) =>
          p.id === pluginId ? { ...p, status: "active" as const } : p,
        );
        const newPlugin = updated.find((p) => p.id === pluginId);
        if (newPlugin) setSelectedPlugin(newPlugin);
        return updated;
      });
      toast.success("Plugin Activated", {
        description: `${plugins.find((p) => p.id === pluginId)?.name} is now ready for use.`,
      });
    }, 2000);
  };

  const handleDeactivate = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, status: "idle" } : p)),
    );
    setSelectedPlugin(null);
    toast.error("Plugin Deactivated", {
      description: "Billing has been stopped for this cycle.",
    });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-500">
      {/* Header Area */}
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Terminal className="size-5 text-primary" />
          <h1 className="text-lg font-extrabold tracking-tight uppercase">
            Expand Market
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-secondary transition-all hover:border-primary/30 group cursor-help">
            <CreditCard className="size-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Credits:
            </span>
            <span className="text-xs font-black text-primary">$50.00</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
          >
            <Settings className="size-3.5" />
            Billing Logic
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Pane */}
        <aside className="w-64 border-r bg-card/30 flex flex-col shrink-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                className="pl-9 h-9 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 py-4">
            <div className="px-3 space-y-1">
              <p className="px-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 opacity-50">
                Filter by Category
              </p>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold tracking-tight transition-all group",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1"
                      : "hover:bg-primary/5 text-muted-foreground hover:text-primary",
                  )}
                >
                  <span>{cat.name}</span>
                  <Badge
                    variant={
                      selectedCategory === cat.id ? "outline" : "secondary"
                    }
                    className={cn(
                      "text-[9px] h-4 px-1.5 leading-none border-none font-black",
                      selectedCategory === cat.id
                        ? "bg-white/20 text-white"
                        : "text-muted-foreground/60",
                    )}
                  >
                    {cat.count}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 relative bg-muted/5">
          <ScrollArea className="h-full">
            <div className="p-10 max-w-[1500px] mx-auto">
              <div className="mb-10 space-y-2">
                <h2 className="text-3xl font-black tracking-tighter uppercase">
                  Power-Ups Library
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Browse, enroll, and manage professional-grade tools for your
                  IDE environment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredPlugins.map((plugin) => (
                  <MarketplacePluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onClick={() => setSelectedPlugin(plugin)}
                  />
                ))}
              </div>

              {filteredPlugins.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="size-20 rounded-full bg-muted flex items-center justify-center">
                    <Search className="size-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-lg font-bold text-muted-foreground">
                    No plugins found for "{searchQuery}"
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Plugin Detail Overlay (Management & Enrollment) */}
          {selectedPlugin && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xl z-50 flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-primary/20 flex flex-col">
                <PluginDetailView
                  plugin={selectedPlugin}
                  onClose={() => setSelectedPlugin(null)}
                  onEnroll={() => handleEnroll(selectedPlugin.id)}
                  onDeactivate={() => handleDeactivate(selectedPlugin.id)}
                />
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MarketplacePluginCard({
  plugin,
  onClick,
}: {
  plugin: Plugin;
  onClick: () => void;
}) {
  const Icon = plugin.icon;
  const isInstalled = plugin.status === "active";

  return (
    <Card
      className={cn(
        "group relative h-full flex flex-col bg-card border-border/40 hover:border-primary/40 transition-all duration-500 cursor-pointer overflow-hidden transform-gpu",
        isInstalled
          ? "ring-2 ring-primary/10 shadow-lg"
          : "hover:shadow-2xl hover:-translate-y-2",
      )}
      onClick={onClick}
    >
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start justify-between mb-6">
          <div
            className={cn(
              "size-14 rounded-2xl flex items-center justify-center transition-all duration-700 ring-4 ring-transparent shrink-0",
              isInstalled
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-xl group-hover:shadow-primary/20",
            )}
          >
            <Icon className="size-7" />
          </div>
          <div className="flex flex-col items-end gap-2">
            {isInstalled && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-none p-1.5 h-7 w-7 flex items-center justify-center rounded-full animate-in zoom-in-50"
              >
                <Settings className="size-4 animate-spin-slow" />
              </Badge>
            )}
            {plugin.badge && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase tracking-widest px-2 h-6 font-black border-none shadow-sm",
                  plugin.badge === "Plus"
                    ? "bg-purple-500/10 text-purple-600"
                    : plugin.badge === "Essentials"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-green-500/10 text-green-600",
                )}
              >
                {plugin.badge}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
          {plugin.name}
          {isInstalled && (
            <span className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          )}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80 font-medium line-clamp-2 mt-2 leading-relaxed">
          {plugin.description}
        </CardDescription>
      </CardHeader>

      <div
        className={cn(
          "mt-auto p-6 pt-3 flex items-center justify-between border-t transition-colors",
          isInstalled
            ? "bg-primary/5 border-primary/10"
            : "bg-muted/10 group-hover:bg-muted/30 border-border/20",
        )}
      >
        {isInstalled ? (
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
            <TrendingUp className="size-3.5" />
            Manage Scale
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Pricing
            </span>
            <span className="text-sm font-black text-primary">
              {plugin.price}
            </span>
          </div>
        )}
        <Button
          variant={isInstalled ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-8 text-[10px] font-black uppercase tracking-widest gap-2 shadow-none rounded-lg",
            !isInstalled && "hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {isInstalled ? "Control Panel" : "View Specs"}{" "}
          <Info className="size-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function PluginDetailView({
  plugin,
  onClose,
  onEnroll,
  onDeactivate,
}: {
  plugin: Plugin;
  onClose: () => void;
  onEnroll: () => void;
  onDeactivate: () => void;
}) {
  const Icon = plugin.icon;
  const isEnrolling = plugin.status === "enrolling";
  const isInstalled = plugin.status === "active";

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b flex items-center justify-between bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-2 h-9 px-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
        >
          <ArrowLeft className="size-4" /> Back to Market
        </Button>
        <div className="flex gap-2">
          {isInstalled && (
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border-none px-3 h-7 flex items-center shadow-inner"
            >
              Active License
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="uppercase tracking-widest font-black text-[10px] px-3 h-7 flex items-center bg-primary/10 text-primary border-none"
          >
            {plugin.category}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-10 space-y-10">
          <div className="flex gap-8 items-start">
            <div className="size-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner group relative">
              <Icon className="size-12 group-hover:scale-110 transition-transform duration-500" />
              {isInstalled && (
                <div className="absolute -top-2 -right-2 size-8 bg-green-500 rounded-full flex items-center justify-center text-white border-4 border-background shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="size-4" />
                </div>
              )}
            </div>
            <div className="space-y-4 pt-2">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic">
                {plugin.name}
              </h2>
              <div className="p-4 rounded-2xl bg-primary/5 border-l-4 border-primary/40">
                <p className="text-sm font-bold text-foreground/80 leading-relaxed italic">
                  "{plugin.description}"
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/50" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                Technical Capabilities
              </h4>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <p className="text-base leading-relaxed text-muted-foreground font-medium">
              {plugin.longDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-[1.5rem] bg-muted/40 border border-border/50 flex flex-col justify-between hover:border-primary/20 transition-all cursor-default">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">
                  Billing Tier
                </p>
                <p className="text-2xl font-black text-primary">
                  {plugin.price}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                <CreditCard className="size-3.5" /> Post-Paid Monthly
              </div>
            </div>
            <div className="p-6 rounded-[1.5rem] bg-muted/40 border border-border/50 space-y-4 hover:border-primary/20 transition-all cursor-default">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">
                    Real-time Usage
                  </p>
                  <p className="text-2xl font-black tracking-tighter">
                    {isInstalled ? "420" : "0"}{" "}
                    <span className="text-sm text-muted-foreground font-bold">
                      / 5,000 unit
                    </span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] font-black tracking-tighter mb-1 border-primary/20 text-primary"
                >
                  8% Capacity
                </Badge>
              </div>
              <Progress
                value={isInstalled ? 8 : 0}
                className="h-2 bg-muted-foreground/10 rounded-full overflow-hidden"
              />
            </div>
          </div>

          <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 space-y-8 shadow-inner shadow-primary/5">
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary flex items-center gap-3">
              <Settings className="size-4 animate-spin-slow" /> Management
              Control Panel
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-card border border-primary/10 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer group transform-gpu active:scale-95">
                <div className="flex items-center justify-between">
                  <TrendingUp className="size-5 text-primary" />
                  <Badge
                    variant="secondary"
                    className="text-[8px] font-black tracking-widest bg-primary/10 text-primary"
                  >
                    Pro Feature
                  </Badge>
                </div>
                <div className="space-y-1 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                    Scale Infrastructure
                  </span>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-tight">
                    Upgrade or Downgrade your plan instantly based on drift.
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex flex-col gap-2 p-5 rounded-2xl bg-card border border-destructive/10 hover:border-destructive/30 hover:shadow-xl transition-all cursor-pointer group transform-gpu active:scale-95",
                  !isInstalled && "opacity-50 grayscale cursor-not-allowed",
                )}
                onClick={() => isInstalled && onDeactivate()}
              >
                <div className="flex items-center justify-between">
                  <XCircle className="size-5 text-destructive" />
                  <Badge
                    variant="outline"
                    className="text-[8px] font-black tracking-widest border-destructive/20 text-destructive uppercase"
                  >
                    Security First
                  </Badge>
                </div>
                <div className="space-y-1 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest group-hover:text-destructive transition-colors">
                    Instant Deactivation
                  </span>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-tight italic">
                    {" "}
                    billing stops at the end of the current cycle. No lock-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-8 border-t bg-card mt-auto flex items-center gap-4">
        {isInstalled ? (
          <Button
            variant="outline"
            className="flex-1 h-14 text-xs font-black uppercase tracking-widest gap-3 bg-green-500/5 hover:bg-green-500/10 text-green-700 border-green-500/20 shadow-inner rounded-[1rem]"
            disabled
          >
            <CheckCircle2 className="size-5" /> Subscribed & Verified
          </Button>
        ) : (
          <Button
            className="flex-1 h-14 text-xs font-black uppercase tracking-[0.15em] gap-3 shadow-lg shadow-primary/20 animate-pulse rounded-[1rem]"
            onClick={onEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling ? (
              <Zap className="size-4 animate-bounce" />
            ) : (
              <Zap className="size-4 fill-primary-foreground" />
            )}
            {isEnrolling
              ? "Provisioning Logic..."
              : "Activate Risk-Free Enrollment"}
          </Button>
        )}
        <Button
          variant="outline"
          className="h-14 w-14 p-0 rounded-[1.25rem] border-primary/20 hover:border-primary/50 transition-all group"
          onClick={onClose}
        >
          <Info className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>
      </div>
    </div>
  );
}
