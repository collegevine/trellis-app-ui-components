"use client"

import { Fieldset } from "@base-ui/react/fieldset"
import type { ComponentProps, ReactNode } from "react"

import { cn } from "../lib/utils.js"

/** Props for {@link FieldGroup}: every prop of a `<div>`. */
export type FieldGroupProps = ComponentProps<"div">

/**
 * A stack of fields with the standard gap between them.
 *
 * @example
 * ```tsx
 * <FieldGroup>
 *   <TextField label="First name" name="firstName" />
 *   <TextField label="Last name" name="lastName" />
 * </FieldGroup>
 * ```
 */
export function FieldGroup(props: FieldGroupProps) {
  const { className, ...rest } = props
  return <div data-slot="field-group" className={cn("flex w-full flex-col gap-5", className)} {...rest} />
}

/** Props for {@link FieldSet}. */
export interface FieldSetProps {
  /** The section's visible name, above its fields. Every section has one. */
  legend: string
  /** The section's fields, usually in a {@link FieldGroup}. */
  children: ReactNode
  /** Classes for the whole section. */
  className?: string
}

/**
 * A section of a form whose fields answer one question, such as the parts of
 * an address. Renders a `<fieldset>` with its name in a `<legend>`, so screen
 * readers announce the section's name with each field in it.
 *
 * @example
 * ```tsx
 * <FieldSet legend="Mailing address">
 *   <FieldGroup>
 *     <TextField label="Street" name="street" />
 *     <TextField label="City" name="city" />
 *   </FieldGroup>
 * </FieldSet>
 * ```
 */
export function FieldSet(props: FieldSetProps) {
  const { legend, children, className } = props
  return (
    <Fieldset.Root data-slot="field-set" className={cn("flex flex-col gap-4", className)}>
      <Fieldset.Legend className="text-base font-medium">{legend}</Fieldset.Legend>
      {children}
    </Fieldset.Root>
  )
}
