import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:scale-[0.98]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-sm hover:shadow-md active:scale-[0.98]",
        outline:
          "border-2 border-foreground bg-transparent hover:bg-foreground/5 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-sm hover:shadow-md active:scale-[0.98]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground rounded-xl active:scale-[0.98]",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3 has-[>svg]:px-3",
        sm: "h-10 rounded-lg gap-1.5 px-4 has-[>svg]:px-2.5",
        lg: "h-14 rounded-lg px-8 has-[>svg]:px-5 text-base",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
