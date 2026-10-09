"use client"

import type { ComponentProps } from "react"
import { Link as RouterLink } from "react-router"

import { cn } from "../lib/utils.js"

/** The Link component's look, shared with the button's `link` style. */
export const linkStyles = "text-primary underline-offset-4 hover:underline"

/**
 * Props for {@link Link}: every prop of React Router's `Link`, with `href` in
 * place of `to`.
 */
export type LinkProps = Omit<ComponentProps<typeof RouterLink>, "to"> & {
  /** The address of the page to open. */
  href: string
}

/**
 * Text that opens another page. Renders a React Router link: text in the
 * primary color, underlined on hover, with a focus ring for keyboard users.
 *
 * @example
 * ```tsx
 * <Link href={`/students/${student.id}`}>{student.name}</Link>
 * ```
 */
export function Link(props: LinkProps) {
  const { className, href, ...rest } = props
  return (
    <RouterLink
      data-slot="link"
      to={href}
      className={cn(
        linkStyles,
        "rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...rest}
    />
  )
}
