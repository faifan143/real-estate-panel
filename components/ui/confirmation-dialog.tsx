"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ConfirmationVariant = "default" | "destructive" | "warning" | "success" | "info"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: ConfirmationVariant
  loading?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
  },
  destructive: {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
  },
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="gap-4">
          <div className="flex justify-center">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full",
                config.iconBg
              )}
            >
              <Icon className={cn("h-8 w-8", config.iconColor)} />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-base text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 rounded-xl h-12"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-xl h-12"
          >
            {loading ? "جاري التحميل..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: ConfirmationVariant
    onConfirm: () => void
    onCancel?: () => void
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    onConfirm: () => {},
  })

  const openDialog = React.useCallback(
    (config: Omit<typeof dialogState, "open">) => {
      setDialogState({ ...config, open: true })
    },
    []
  )

  const closeDialog = React.useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    dialogState,
    openDialog,
    closeDialog,
  }
}

