import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-2.5!",
  {
    variants: {
      variant: {
        default: "border-indigo-500/30 bg-indigo-500/15 text-indigo-300 [a]:hover:bg-indigo-500/25",
        secondary:
          "border-border bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "border-rose-500/30 bg-rose-500/15 text-rose-300 focus-visible:ring-rose-500/20 [a]:hover:bg-rose-500/25",
        danger:
          "border-rose-500/30 bg-rose-500/15 text-rose-300 focus-visible:ring-rose-500/20 [a]:hover:bg-rose-500/25",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 focus-visible:ring-emerald-500/20 [a]:hover:bg-emerald-500/25",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-300 focus-visible:ring-amber-500/20 [a]:hover:bg-amber-500/25",
        outline:
          "border-border bg-transparent text-muted-foreground [a]:hover:bg-muted [a]:hover:text-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export default Badge
export { Badge, badgeVariants }
