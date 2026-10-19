"use client"

import { Field } from "@base-ui/react/field"
import type { ReactElement, ReactNode } from "react"

import { cn } from "../lib/utils.js"

const controlStyles =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive disabled:bg-input/50 rounded-lg border bg-transparent px-2.5 text-base transition-colors focus-visible:ring-3 aria-invalid:ring-3 md:text-sm placeholder:text-muted-foreground w-full min-w-0 outline-none disabled:cursor-not-allowed disabled:opacity-50"

/** Props that {@link TextField} and {@link TextArea} share. */
export interface FieldTextProps {
  /** The field's visible name, above the control. Every field has one. */
  label: string
  /** A line of help under the control, in the muted color. */
  description?: ReactNode
  /**
   * What is wrong with the value and how to fix it. When set, the field shows
   * it under the control in the destructive color, marks the control as
   * invalid, and screen readers read it out.
   */
  error?: string
  /** Classes for the whole field, such as its width in a grid. */
  className?: string
}

/**
 * Props for {@link TextField}: every prop of Base UI's `Field.Control`, which
 * reach the `<input>`, plus the field's label, help line and error.
 */
export type TextFieldProps = FieldTextProps & Omit<Field.Control.Props, "className" | "render">

/**
 * Props for {@link TextArea}: every prop of Base UI's `Field.Control`, which
 * reach the `<textarea>`, plus the field's label, help line and error.
 */
export type TextAreaProps = FieldTextProps & Omit<Field.Control.Props, "className" | "render">

function FieldShell(
  props: FieldTextProps & Omit<Field.Control.Props, "className"> & {
    controlClassName: string
    slot: string
    control?: ReactElement
  }
) {
  const { label, description, error, className, controlClassName, slot, control, disabled, ...rest } =
    props
  return (
    <Field.Root
      data-slot={slot}
      disabled={disabled}
      invalid={error ? true : undefined}
      className={cn("group/field flex w-full flex-col gap-1.5", className)}
    >
      <Field.Label className="flex w-fit items-center gap-2 text-sm leading-snug font-medium select-none data-disabled:opacity-50">
        {label}
      </Field.Label>
      <Field.Control render={control} className={cn(controlStyles, controlClassName)} {...rest} />
      {description ? (
        <Field.Description className="text-muted-foreground text-sm leading-normal">
          {description}
        </Field.Description>
      ) : null}
      {error ? (
        <Field.Error match className="text-destructive text-sm">
          {error}
        </Field.Error>
      ) : (
        <Field.Error className="text-destructive text-sm" />
      )}
    </Field.Root>
  )
}

/**
 * A one-line text field with its label above it. Renders an `<input>` inside
 * Base UI's `Field`, which connects the label, the help line and the error to
 * the input for screen readers.
 *
 * Pass `error` when the value fails a check. When a browser check such as
 * `required` fails, the browser shows its own message in a popup.
 *
 * Text is `text-base` below the `md` breakpoint, so that phones do not zoom in
 * when the field gets focus, and `text-sm` above it.
 *
 * @example
 * ```tsx
 * <TextField label="Minimum GPA" name="gpa" description="On a 4.0 scale." error={errors.gpa} />
 * ```
 */
export function TextField(props: TextFieldProps) {
  return (
    <FieldShell
      {...props}
      slot="text-field"
      controlClassName="h-8 py-1 file:text-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium"
    />
  )
}

/**
 * A text field for more than one line, with its label above it. It starts
 * two lines tall and grows with its text. Otherwise the same as
 * {@link TextField}.
 *
 * @example
 * ```tsx
 * <TextArea label="Note to the student" name="note" />
 * ```
 */
export function TextArea(props: TextAreaProps) {
  return (
    <FieldShell
      {...props}
      slot="text-area"
      control={<textarea />}
      controlClassName="flex field-sizing-content min-h-16 py-2"
    />
  )
}
