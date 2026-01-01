import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground flex field-sizing-content min-h-24 w-full rounded-lg border bg-white px-4 py-3 text-base shadow-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-foreground focus:ring-2 focus:ring-foreground/10 hover:border-foreground/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
