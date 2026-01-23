// components/AlertDialog.tsx

import * as React from "react"
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type AlertType = "success" | "error" | "warning" | "info" | "confirm"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: AlertType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    buttonColor: "bg-green-600 hover:bg-green-700"
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    buttonColor: "bg-red-600 hover:bg-red-700"
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    buttonColor: "bg-yellow-600 hover:bg-yellow-700"
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    buttonColor: "bg-blue-600 hover:bg-blue-700"
  },
  confirm: {
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    buttonColor: "bg-blue-600 hover:bg-blue-700"
  }
}

export function AlertDialog({
  open,
  onOpenChange,
  type,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}: AlertDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const config = alertConfig[type]
  const Icon = config.icon
  const isConfirmDialog = type === "confirm"

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true)
      try {
        await onConfirm()
        onOpenChange(false)
      } catch (error) {
        console.error("Error in confirmation:", error)
      } finally {
        setIsLoading(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 rounded-full p-3 ${config.bgColor} border-2 ${config.borderColor}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-gray-600 leading-relaxed pl-16">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 gap-2 sm:gap-2">
          {isConfirmDialog ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="border-gray-300 hover:bg-gray-50"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={config.buttonColor}
              >
                {isLoading ? "Processing..." : confirmText}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleConfirm}
              className={config.buttonColor}
              autoFocus
            >
              OK
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier alert usage
export function useAlert() {
  const [alertState, setAlertState] = React.useState<{
    open: boolean
    type: AlertType
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void | Promise<void>
    onCancel?: () => void
  }>({
    open: false,
    type: "info",
    title: "",
    message: ""
  })

  const showAlert = React.useCallback((config: Omit<typeof alertState, "open">) => {
    setAlertState({ ...config, open: true })
  }, [])

  const hideAlert = React.useCallback(() => {
    setAlertState(prev => ({ ...prev, open: false }))
  }, [])

  const confirm = React.useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText = "Yes",
    cancelText = "No"
  ) => {
    return new Promise<boolean>((resolve) => {
      showAlert({
        type: "confirm",
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: async () => {
          await onConfirm()
          resolve(true)
        },
        onCancel: () => {
          resolve(false)
        }
      })
    })
  }, [showAlert])

  return {
    alert: alertState,
    showAlert,
    hideAlert,
    confirm,
    AlertComponent: () => (
      <AlertDialog
        {...alertState}
        onOpenChange={hideAlert}
      />
    )
  }
}