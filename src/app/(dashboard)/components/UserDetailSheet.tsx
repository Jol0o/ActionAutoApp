"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  Users, 
  Calendar, 
  Package, 
  TrendingUp, 
  Mail, 
  MapPin, 
  Activity,
  ArrowUpRight
} from "lucide-react"
import { LeaderboardUser } from "@/hooks/useInfiniteLeaderboard"

interface UserDetailSheetProps {
  user: LeaderboardUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
  if (!user) return null

  const stats = [
    { label: "Calls", value: user.calls, icon: Phone, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Conversations", value: user.convs, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Appointments", value: user.appts, icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Shipments", value: user.shipments, icon: Package, color: "text-amber-500", bg: "bg-amber-500/10" },
  ]

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md border-l border-border/40 bg-background/95 backdrop-blur-xl p-0 h-dvh max-h-dvh overflow-hidden">
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            {/* Header Section */}
            <div className="relative h-32 bg-linear-to-br from-primary/20 via-primary/5 to-transparent border-b border-primary/10">
              <div className="absolute -bottom-10 left-6">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-2xl">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="pt-14 px-6 pb-8 space-y-8">
              {/* User Info */}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight min-w-0 wrap-break-word pr-2">{user.name}</h2>
                  <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-500 border-none font-black uppercase text-[10px]">
                    Active Now
                  </Badge>
                </div>
                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 wrap-break-word">
                  {user.role} • Employee ID: #AA-{user.id.slice(-4).toUpperCase()}
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/20 transition-all group">
                    <div className={`size-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="size-4" />
                    </div>
                    <p className="text-2xl font-black tabular-nums">{stat.value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Performance Insight */}
              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <TrendingUp className="size-16" />
                </div>
                <div className="relative">
                  <h3 className="text-sm font-black flex items-center gap-2 mb-4">
                    <Activity className="size-4 text-primary" />
                    Performance Insight
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {user.name} is currently in the <span className="text-foreground font-bold">Top 10%</span> for shipment conversions this month. Response time is <span className="text-emerald-500 font-bold">12% faster</span> than the departmental average.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer">
                    View productivity log <ArrowUpRight className="size-3" />
                  </div>
                </div>
              </div>

              {/* Contact & Meta */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Mail className="size-4 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/40 leading-none mb-1">Email Address</p>
                    <p className="font-bold break-all sm:wrap-break-word">{user.name.toLowerCase().replace(' ', '.')}@actionauto.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="size-4 text-muted-foreground/60" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/40 leading-none mb-1">Primary Location</p>
                    <p className="font-bold">Orem Main Hub, UT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
