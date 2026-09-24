import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25",
        danger:
          "border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 text-xs/relaxed",
        md: "h-9 px-3.5 text-xs/relaxed",
        xs: "h-6 rounded-md px-2 text-[0.6875rem]",
        sm: "h-8 rounded-md px-2.5 text-xs/relaxed",
        lg: "h-11 rounded-lg px-4 text-sm font-semibold",
        icon: "size-9 rounded-lg p-0",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps = Omit<ButtonPrimitive.Props, "size"> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    loadingLabel?: string
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
  }

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  loadingLabel,
  leadingIcon,
  trailingIcon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const content = loading ? (
    <>
      <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
      <span>{loadingLabel ?? children}</span>
    </>
  ) : (
    <>
      {leadingIcon}
      {children}
      {trailingIcon}
    </>
  )

  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {content}
    </ButtonPrimitive>
  )
}

export default Button
export { Button, buttonVariants }
