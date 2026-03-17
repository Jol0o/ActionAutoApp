"use client"

import * as React from "react"
import { Loader2, UserX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrmUserRow {
  _id: string
  fullName: string
  username: string
  email: string
  role: "employee" | "manager" | "admin"
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

interface UsersTableProps {
  token: string
  refreshKey: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ini(n: string) {
  return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; className: string }> = {
    admin: {
      label: "Admin",
      className: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    },
    manager: {
      label: "Manager",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    employee: {
      label: "Employee",
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
  }
  const cfg = map[role] ?? { label: role, className: "" }
  return (
    <Badge
      variant="outline"
      className={`text-[10px] h-5 px-2 rounded-full font-semibold capitalize ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] h-5 px-2 rounded-full font-semibold ${
        isActive
          ? "bg-green-500/10 text-green-600 border-green-500/20"
          : "bg-red-500/8 text-red-500 border-red-500/20"
      }`}
    >
      <span
        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-green-500" : "bg-red-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  )
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/20 last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-muted/40 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-28 rounded bg-muted/40 animate-pulse" />
            <div className="h-2 w-36 rounded bg-muted/30 animate-pulse" />
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="h-2.5 w-24 rounded bg-muted/40 animate-pulse" />
      </td>
      <td className="px-5 py-3.5">
        <div className="h-5 w-16 rounded-full bg-muted/40 animate-pulse" />
      </td>
      <td className="px-5 py-3.5">
        <div className="h-5 w-14 rounded-full bg-muted/40 animate-pulse" />
      </td>
      <td className="px-5 py-3.5">
        <div className="h-2.5 w-20 rounded bg-muted/30 animate-pulse" />
      </td>
    </tr>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsersTable({ token, refreshKey }: UsersTableProps) {
  const [users, setUsers] = React.useState<CrmUserRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!token) return

    setLoading(true)
    apiClient
      .get("/api/crm/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data?.data?.users || []
        setUsers(data)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [token, refreshKey])

  // ── Loading state ──
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">User</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Employee ID</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Role</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Joined</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Empty state ──
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="h-14 w-14 rounded-2xl border-2 border-dashed border-border/25 flex items-center justify-center mb-4">
          <UserX className="h-6 w-6 text-muted-foreground/15" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground/40">No users found</p>
        <p className="text-xs text-muted-foreground/25 mt-1 max-w-xs">
          Create a new CRM account by clicking the button above.
        </p>
      </div>
    )
  }

  // ── Table ──
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 bg-muted/[0.02]">
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">User</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Employee ID</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Role</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Status</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u._id}
              className="border-b border-border/20 last:border-0 hover:bg-muted/[0.025] transition-colors"
            >
              {/* User */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback
                      className={`text-[9px] font-bold text-white ${
                        u.role === "admin"
                          ? "bg-violet-500"
                          : u.role === "manager"
                          ? "bg-blue-500"
                          : "bg-emerald-600"
                      }`}
                    >
                      {ini(u.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{u.fullName}</p>
                    <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5">{u.email}</p>
                  </div>
                </div>
              </td>

              {/* Employee ID */}
              <td className="px-5 py-3.5">
                <span className="text-xs font-mono text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded-md">
                  {u.username}
                </span>
              </td>

              {/* Role */}
              <td className="px-5 py-3.5">
                <RoleBadge role={u.role} />
              </td>

              {/* Status */}
              <td className="px-5 py-3.5">
                <StatusBadge isActive={u.isActive} />
              </td>

              {/* Joined */}
              <td className="px-5 py-3.5">
                <span className="text-[11px] text-muted-foreground/40">
                  {formatDate(u.createdAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer count */}
      <div className="px-5 py-3 border-t border-border/20 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground/30">
          {users.length} {users.length === 1 ? "user" : "users"} total
        </p>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
          <p className="text-[11px] text-muted-foreground/30">
            {users.filter((u) => u.isActive).length} active
          </p>
        </div>
      </div>
    </div>
  )
}
