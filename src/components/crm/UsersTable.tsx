"use client"

import * as React from "react"
import { Loader2, UserX, MoreVertical, Pencil, Trash2, PowerOff, Power, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiClient } from "@/lib/api-client"
import { EditUserModal } from "@/components/crm/EditUserModal"
import { ResetPasswordModal } from "@/components/crm/ResetPasswordModal"

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
      <td className="px-5 py-3.5">
        <div className="h-6 w-6 rounded-lg bg-muted/30 animate-pulse" />
      </td>
    </tr>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsersTable({ token, refreshKey }: UsersTableProps) {
  const [users, setUsers] = React.useState<CrmUserRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actioningId, setActioningId] = React.useState<string | null>(null)
  const [editTarget, setEditTarget] = React.useState<CrmUserRow | null>(null)
  const [resetTarget, setResetTarget] = React.useState<CrmUserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<CrmUserRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const fetchUsers = React.useCallback(() => {
    if (!token) return
    setLoading(true)
    apiClient
      .get("/api/crm/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUsers(res.data?.data?.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [token])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers, refreshKey])

  // ── Toggle active/inactive ──
  const handleToggleStatus = async (user: CrmUserRow) => {
    setActioningId(user._id)
    try {
      await apiClient.patch(
        `/api/crm/users/${user._id}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${user.fullName} has been ${user.isActive ? "deactivated" : "reactivated"}.`)
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status.")
    } finally {
      setActioningId(null)
    }
  }

  // ── Delete (confirmed via AlertDialog) ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.delete(`/api/crm/users/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success(`${deleteTarget.fullName} has been deleted.`)
      setDeleteTarget(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete user.")
    } finally {
      setDeleting(false)
    }
  }

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
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Actions</th>
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
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-muted/2">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">User</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Employee ID</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Role</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Joined</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u._id}
                className="border-b border-border/20 last:border-0 hover:bg-muted/2.5 transition-colors"
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

                {/* Actions */}
                <td className="px-5 py-3.5">
                  {actioningId === u._id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground/40 hover:text-muted-foreground/70">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-lg border-border/40">
                        <DropdownMenuItem
                          onClick={() => setEditTarget(u)}
                          className="rounded-lg text-xs h-8 gap-2.5 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          Edit User
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setResetTarget(u)}
                          className="rounded-lg text-xs h-8 gap-2.5 cursor-pointer"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-amber-600">Reset Password</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(u)}
                          className="rounded-lg text-xs h-8 gap-2.5 cursor-pointer"
                        >
                          {u.isActive ? (
                            <>
                              <PowerOff className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-amber-600">Deactivate</span>
                            </>
                          ) : (
                            <>
                              <Power className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-600">Reactivate</span>
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(u)}
                          className="rounded-lg text-xs h-8 gap-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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

      {/* Edit modal */}
      <EditUserModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        token={token}
        user={editTarget}
        onUpdated={() => {
          setEditTarget(null)
          fetchUsers()
        }}
      />

      {/* Reset password modal */}
      <ResetPasswordModal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        token={token}
        user={resetTarget}
        onReset={() => setResetTarget(null)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Delete user?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground/60 leading-relaxed">
              This will permanently delete <span className="font-semibold text-foreground">{deleteTarget?.fullName}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="h-9 rounded-xl text-xs font-semibold border-border/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="h-9 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/20 gap-2"
            >
              {deleting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</> : <><Trash2 className="h-3.5 w-3.5" /> Delete</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
