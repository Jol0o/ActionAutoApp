"use client"

import * as React from "react"
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import { apiClient } from "@/lib/api-client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateUserForm {
  fullName: string
  email: string
  password: string
  role: string
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  role?: string
}

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  token: string
  onCreated?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form: CreateUserForm): FormErrors {
  const errors: FormErrors = {}

  if (!form.fullName.trim()) {
    errors.fullName = "Full name is required."
  }
  if (!form.email.trim()) {
    errors.email = "Email is required."
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Enter a valid email address."
  }
  if (!form.password) {
    errors.password = "Password is required."
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters."
  }
  if (!form.role) {
    errors.role = "Please select a role."
  }

  return errors
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateUserModal({ open, onClose, token, onCreated }: CreateUserModalProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [employeeId, setEmployeeId] = React.useState("")
  const [loadingId, setLoadingId] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [form, setForm] = React.useState<CreateUserForm>({
    fullName: "",
    email: "",
    password: "",
    role: "",
  })

  // Fetch next employee ID whenever modal opens
  React.useEffect(() => {
    if (!open || !token) return

    setLoadingId(true)
    setEmployeeId("")

    apiClient
      .get("/api/crm/next-employee-id", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data?.data || res.data
        setEmployeeId(data.employeeId ?? "")
      })
      .catch(() => setEmployeeId(""))
      .finally(() => setLoadingId(false))
  }, [open, token])

  const handleClose = () => {
    if (submitting) return
    setForm({ fullName: "", email: "", password: "", role: "" })
    setErrors({})
    setShowPassword(false)
    setEmployeeId("")
    onClose()
  }

  const setField = (k: keyof CreateUserForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }))
      if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }))
    }

  const setRole = (v: string) => {
    setForm((p) => ({ ...p, role: v }))
    if (errors.role) setErrors((p) => ({ ...p, role: undefined }))
  }

  const handleSubmit = async () => {
    if (submitting) return

    const fieldErrors = validate(form)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    if (!employeeId) return

    setSubmitting(true)
    try {
      await apiClient.post(
        "/api/crm/users",
        {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success(`Account created — Employee ID: ${employeeId}`)
      onCreated?.()
      handleClose()
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create user. Try again."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

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
              onChange={setField("fullName")}
              className={`h-10 rounded-xl text-sm border-border/50 focus-visible:ring-emerald-500/30 ${errors.fullName ? "border-red-400 focus-visible:ring-red-400/30" : ""}`}
            />
            {errors.fullName && (
              <p className="text-[11px] text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Employee ID + Email row */}
          <div className="grid grid-cols-2 gap-3">

            {/* Employee ID — auto generated, read-only */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                Employee ID
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                  Auto
                </span>
              </Label>
              <div className="relative">
                <Input
                  readOnly
                  value={loadingId ? "" : employeeId}
                  placeholder="Generating…"
                  className="h-10 rounded-xl text-sm border-border/50 font-mono bg-muted/30 text-muted-foreground cursor-default select-none"
                />
                {loadingId && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground/40" />
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Email
              </Label>
              <Input
                type="email"
                placeholder="juan@actionauto.com"
                value={form.email}
                onChange={setField("email")}
                className={`h-10 rounded-xl text-sm border-border/50 focus-visible:ring-emerald-500/30 ${errors.email ? "border-red-400 focus-visible:ring-red-400/30" : ""}`}
              />
              {errors.email && (
                <p className="text-[11px] text-red-500">{errors.email}</p>
              )}
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
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={setField("password")}
                className={`h-10 rounded-xl text-sm border-border/50 focus-visible:ring-emerald-500/30 pr-10 ${errors.password ? "border-red-400 focus-visible:ring-red-400/30" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Role
            </Label>
            <Select value={form.role} onValueChange={setRole}>
              <SelectTrigger className={`h-10 rounded-xl text-sm border-border/50 focus:ring-emerald-500/30 ${errors.role ? "border-red-400 focus:ring-red-400/30" : ""}`}>
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
            {errors.role && (
              <p className="text-[11px] text-red-500">{errors.role}</p>
            )}
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
            disabled={submitting}
            className="flex-1 h-10 rounded-xl text-sm font-semibold border-border/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loadingId}
            className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/15 gap-2 disabled:opacity-40"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Create User</>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
