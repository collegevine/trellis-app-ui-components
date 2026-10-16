"use client"

import type { ComponentProps } from "react"

import { cn } from "../lib/utils.js"

/** Props for {@link Label}: every prop of a `<label>`. */
export type LabelProps = ComponentProps<"label">

/**
 * The visible name of a control. Renders a `<label>`. Inside a {@link Field},
 * use {@link FieldLabel} instead.
 *
 * @example
 * ```tsx
 * <Label htmlFor="search">Search students</Label>
 * ```
 */
export function Label(props: LabelProps) {
  const { className, ...rest } = props
  return (
    <label
      data-slot="label"
      className={cn(
        "gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    />
  )
}
