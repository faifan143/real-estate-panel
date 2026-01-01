"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AlertVariant = "default" | "error" | "warning" | "success" | "info"

interface AlertDialogCustomProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  buttonText?: string
  variant?: AlertVariant
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    buttonVariant: "default" as const,
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    buttonVariant: "default" as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
    buttonVariant: "default" as const,
  },
  info: {
    icon: AlertCircle,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    buttonVariant: "default" as const,
  },
}

export function AlertDialogCustom({
  open,
  onOpenChange,
  title,
  description,
  buttonText = "حسناً",
  variant = "default",
}: AlertDialogCustomProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

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
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant={config.buttonVariant}
            onClick={() => onOpenChange(false)}
            className="min-w-[120px] rounded-xl h-12"
          >
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useAlertDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean
    title: string
    description?: string
    buttonText?: string
    variant?: AlertVariant
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
  })

  const showAlert = React.useCallback(
    (config: Omit<typeof dialogState, "open">) => {
      setDialogState({ ...config, open: true })
    },
    []
  )

  const closeAlert = React.useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    alertState: dialogState,
    showAlert,
    closeAlert,
  }
}

