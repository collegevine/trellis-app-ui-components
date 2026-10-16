"use client"

import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "../lib/utils.js"

/** The text field's look, shared with {@link Textarea}'s border, focus and error states. */
export const textFieldStyles =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive disabled:bg-input/50 rounded-lg border bg-transparent px-2.5 text-base transition-colors focus-visible:ring-3 aria-invalid:ring-3 md:text-sm placeholder:text-muted-foreground w-full min-w-0 outline-none disabled:cursor-not-allowed disabled:opacity-50"

/** Props for {@link Input}: every prop of Base UI's `Input`. */
export type InputProps = InputPrimitive.Props

/**
 * A one-line text field. Renders Base UI's `Input` as an `<input>`.
 *
 * Put it in a {@link Field} with a {@link FieldLabel}, so that the field has a
 * visible name. Set `aria-invalid` when the value fails a check, and the
 * border and focus ring turn to the destructive color.
 *
 * Text is `text-base` below the `md` breakpoint, so that phones do not zoom in
 * when the field gets focus, and `text-sm` above it.
 *
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel htmlFor="email">Email</FieldLabel>
 *   <Input id="email" type="email" name="email" />
 * </Field>
 * ```
 */
export function Input(props: InputProps) {
  const { className, ...rest } = props
  const classes = (extra?: string) =>
    cn(
      textFieldStyles,
      "h-8 py-1 file:text-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium",
      extra
    )
  return (
    <InputPrimitive
      data-slot="input"
      className={
        typeof className === "function"
          ? (state) => classes(className(state))
          : classes(className)
      }
      {...rest}
    />
  )
}
