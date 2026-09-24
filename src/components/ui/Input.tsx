import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<"input"> & {
  label?: string
  description?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, id, label, description, error, "aria-describedby": ariaDescribedBy, ...props },
  ref
) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedByIds = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(" ") || undefined

  const inputElement = (
    <InputPrimitive
      ref={ref}
      id={inputId}
      type={type}
      data-slot="input"
      aria-invalid={error ? true : props["aria-invalid"]}
      aria-describedby={describedByIds}
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-border bg-input/40 px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:bg-input/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )

  if (!label && !description && !error) {
    return inputElement
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-foreground">
          {label}
        </label>
      )}
      {inputElement}
      {description && (
        <p id={descriptionId} className="text-[11px] text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
export { Input }
