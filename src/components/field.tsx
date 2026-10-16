"use client"

import { cva } from "class-variance-authority"
import { useMemo, type ComponentProps } from "react"

import { cn } from "../lib/utils.js"
import { Label } from "./label.js"

/** Props for {@link FieldSet}: every prop of a `<fieldset>`. */
export type FieldSetProps = ComponentProps<"fieldset">

/**
 * A group of fields that answer one question, such as the parts of an
 * address. Renders a `<fieldset>`. Name the group with a {@link FieldLegend}.
 *
 * @example
 * ```tsx
 * <FieldSet>
 *   <FieldLegend>Mailing address</FieldLegend>
 *   <FieldGroup>…</FieldGroup>
 * </FieldSet>
 * ```
 */
export function FieldSet(props: FieldSetProps) {
  const { className, ...rest } = props
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3 flex flex-col",
        className
      )}
      {...rest}
    />
  )
}

/** Props for {@link FieldLegend}: every prop of a `<legend>`, plus its size. */
export type FieldLegendProps = ComponentProps<"legend"> & {
  /**
   * `legend` is `text-base`, for the name of a section. `label` is `text-sm`,
   * the size of a {@link FieldLabel}, for a group that reads as one field.
   * Defaults to `legend`.
   */
  variant?: "legend" | "label"
}

/** The name of a {@link FieldSet}. Renders a `<legend>`. */
export function FieldLegend(props: FieldLegendProps) {
  const { className, variant = "legend", ...rest } = props
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className
      )}
      {...rest}
    />
  )
}

/** Props for {@link FieldGroup}: every prop of a `<div>`. */
export type FieldGroupProps = ComponentProps<"div">

/**
 * A stack of {@link Field}s with the standard gap between them.
 *
 * @example
 * ```tsx
 * <FieldGroup>
 *   <Field>…</Field>
 *   <Field>…</Field>
 * </FieldGroup>
 * ```
 */
export function FieldGroup(props: FieldGroupProps) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="field-group"
      className={cn(
        "gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4 group/field-group @container/field-group flex w-full flex-col",
        className
      )}
      {...rest}
    />
  )
}

const orientations: Record<FieldOrientation, string> = {
  vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
  horizontal:
    "flex-row items-center *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
  responsive:
    "flex-col *:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:*:data-[slot=field-label]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
}

/**
 * Where a {@link Field}'s label sits.
 *
 * - `vertical`: the label above the control.
 * - `horizontal`: the label beside the control, on one row.
 * - `responsive`: vertical in a narrow {@link FieldGroup}, horizontal once the
 *   group is `md` wide or more.
 */
export type FieldOrientation = "vertical" | "horizontal" | "responsive"

const fieldClasses = cva("data-[invalid=true]:text-destructive gap-2 group/field flex w-full", {
  variants: { orientation: orientations },
  defaultVariants: { orientation: "vertical" },
})

/** Props for {@link Field}: every prop of a `<div>`, plus where the label sits. */
export type FieldProps = ComponentProps<"div"> & {
  /** Where the label sits. Defaults to `vertical`. */
  orientation?: FieldOrientation
}

/**
 * One form field: its label, its control, and any description or error.
 * Set `data-invalid` on the field and `aria-invalid` on its control when the
 * value fails a check, and add a {@link FieldError} that says what to fix.
 *
 * @example
 * ```tsx
 * <Field data-invalid={!!error}>
 *   <FieldLabel htmlFor="gpa">Minimum GPA</FieldLabel>
 *   <Input id="gpa" name="gpa" aria-invalid={!!error} />
 *   <FieldDescription>On a 4.0 scale.</FieldDescription>
 *   <FieldError>{error}</FieldError>
 * </Field>
 * ```
 */
export function Field(props: FieldProps) {
  const { className, orientation = "vertical", ...rest } = props
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldClasses({ orientation }), className)}
      {...rest}
    />
  )
}

/** Props for {@link FieldContent}: every prop of a `<div>`. */
export type FieldContentProps = ComponentProps<"div">

/**
 * Holds a field's label and description together, so that they stack beside a
 * control in a `horizontal` {@link Field}, such as a switch.
 */
export function FieldContent(props: FieldContentProps) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="field-content"
      className={cn("gap-0.5 group/field-content flex flex-1 flex-col leading-snug", className)}
      {...rest}
    />
  )
}

/** Props for {@link FieldLabel}: every prop of a {@link Label}. */
export type FieldLabelProps = ComponentProps<typeof Label>

/** The visible name of a {@link Field}'s control. Renders a {@link Label}. */
export function FieldLabel(props: FieldLabelProps) {
  const { className, ...rest } = props
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "has-data-checked:bg-primary/5 has-data-checked:border-primary/30 gap-2 group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border *:data-[slot=field]:p-2.5 group/field-label peer/field-label flex w-fit leading-snug",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...rest}
    />
  )
}

/** Props for {@link FieldTitle}: every prop of a `<div>`. */
export type FieldTitleProps = ComponentProps<"div">

/**
 * Text with a {@link FieldLabel}'s look, for a field whose control already has
 * its own `<label>`.
 */
export function FieldTitle(props: FieldTitleProps) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="field-label"
      className={cn(
        "gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50 flex w-fit items-center leading-snug",
        className
      )}
      {...rest}
    />
  )
}

/** Props for {@link FieldDescription}: every prop of a `<p>`. */
export type FieldDescriptionProps = ComponentProps<"p">

/** A line of help under a field's control, in the muted color. */
export function FieldDescription(props: FieldDescriptionProps) {
  const { className, ...rest } = props
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-left text-sm [[data-variant=legend]+&]:-mt-1.5 leading-normal font-normal group-has-data-horizontal/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...rest}
    />
  )
}

/** Props for {@link FieldError}: every prop of a `<div>`, plus a list of errors. */
export type FieldErrorProps = ComponentProps<"div"> & {
  /**
   * Errors to show when the error has no children, such as the errors that a
   * form library returns. Repeated messages show once. More than one message
   * shows as a list.
   */
  errors?: Array<{ message?: string } | undefined>
}

/**
 * The error for a {@link Field}, under its control, in the destructive color.
 * It has the `alert` role, so screen readers read it out when it appears. It
 * renders nothing when it has no children and no errors.
 */
export function FieldError(props: FieldErrorProps) {
  const { className, children, errors, ...rest } = props
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()]

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...rest}
    >
      {content}
    </div>
  )
}
