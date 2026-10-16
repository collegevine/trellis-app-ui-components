"use client"

import type { ComponentProps } from "react"

import { cn } from "../lib/utils.js"
import { textFieldStyles } from "./input.js"

/** Props for {@link Textarea}: every prop of a `<textarea>`. */
export type TextareaProps = ComponentProps<"textarea">

/**
 * A text field for more than one line. Renders a `<textarea>` with the same
 * border, focus and error states as {@link Input}. It starts two lines tall
 * and grows with its text.
 *
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel htmlFor="note">Note to the student</FieldLabel>
 *   <Textarea id="note" name="note" />
 * </Field>
 * ```
 */
export function Textarea(props: TextareaProps) {
  const { className, ...rest } = props
  return (
    <textarea
      data-slot="textarea"
      className={cn(textFieldStyles, "flex field-sizing-content min-h-16 py-2", className)}
      {...rest}
    />
  )
}
