"use client"

import * as React from "react"
import { UserPlus, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateUserForm {
  fullName: string
  username: string
  email: string
  password: string
  role: string
}

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [form, setForm] = React.useState<CreateUserForm>({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "",
  })

  const handleClose = () => {
    setForm({ fullName: "", username: "", email: "", password: "", role: "" })
    setShowPassword(false)
    onClose()
  }

  const set = (k: keyof CreateUserForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const isValid =
    form.fullName.trim() &&
    form.username.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    form.role

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-border/40 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold">Create New User</DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground/50 mt-0.5">
                Add a new CRM user and assign their role.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Full Name
            </Label>
            <Input
              placeholder="e.g. Juan dela Cruz"
              value={form.fullName}
              onChange={set("fullName")}
              className="h-10 rounded-xl text-sm border-border/50 focus-visible:ring-emerald-500/30"
            />
          </div>

          {/* Employee ID + Email row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Employee ID
              </Label>
              <Input
                placeholder="e.g. 2026-00001"
                value={form.username}
                onChange={set("username")}
                className="h-10 rounded-xl text-sm border-border/50 focus-visible:ring-emerald-500/30 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Email
              </Label>
              <Input
                type="email"
                placeholder="juan@actionauto.com"
                value={form.email}
                onChange={set("email")}
                className="h-10 rounded-xl text-sm border-border/50 focus-visible:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Set a strong password"
                value={form.password}
                onChange={set("password")}
                className="h-10 rounded-xl text-sm border-border/50 focus-visible:ring-emerald-500/30 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Role
            </Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
            >
              <SelectTrigger className="h-10 rounded-xl text-sm border-border/50 focus:ring-emerald-500/30">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="employee" className="rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Employee
                  </div>
                </SelectItem>
                <SelectItem value="manager" className="rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Manager
                  </div>
                </SelectItem>
                <SelectItem value="admin" className="rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role hint */}
          {form.role && (
            <div className={`rounded-xl p-3 text-xs border ${
              form.role === "admin"
                ? "bg-violet-500/5 border-violet-500/15 text-violet-600"
                : form.role === "manager"
                ? "bg-blue-500/5 border-blue-500/15 text-blue-600"
                : "bg-emerald-500/5 border-emerald-500/15 text-emerald-600"
            }`}>
              {form.role === "admin" && (
                <><p className="font-bold">Admin Access</p><p className="opacity-70 mt-0.5">Full access to settings, user management, and all CRM features.</p></>
              )}
              {form.role === "manager" && (
                <><p className="font-bold">Manager Access</p><p className="opacity-70 mt-0.5">Can manage appointments, leads, and view team performance.</p></>
              )}
              {form.role === "employee" && (
                <><p className="font-bold">Employee Access</p><p className="opacity-70 mt-0.5">Standard access to appointments, time clock, and personal profile.</p></>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 h-10 rounded-xl text-sm font-semibold border-border/50"
          >
            Cancel
          </Button>
          <Button
            disabled={!isValid}
            className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/15 gap-2 disabled:opacity-40"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
