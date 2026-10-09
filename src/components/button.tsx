"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import type { ComponentProps } from "react"
import { Link as RouterLink } from "react-router"

import { cn } from "../lib/utils.js"
import { linkStyles } from "./link.js"

/**
 * The button's look.
 *
 * - `default`: filled with the primary color.
 * - `outline`: a border on the page background, filled with the muted color on hover.
 * - `secondary`: filled with the secondary color.
 * - `ghost`: no fill and no border until hover.
 * - `destructive`: a light fill and text in the destructive color.
 * - `link`: the {@link Link} component's look.
 */
export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link"

/**
 * The button's size. The `icon` sizes are square, for a button that holds
 * only an icon.
 *
 * - `xs`: height `h-6`, text `text-xs`.
 * - `sm`: height `h-7`, text `text-xs`.
 * - `default`: height `h-8`, text `text-sm`.
 * - `lg`: height `h-9`, text `text-sm`.
 * - `icon-xs`, `icon-sm`, `icon`, `icon-lg`: squares of the same four heights.
 */
export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg"

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
  ghost:
    "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
  destructive:
    "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 text-destructive focus-visible:border-destructive/40",
  // For text that opens a page, use the Link component.
  // This style stays only so that code written from shadcn habit still shows the link look.
  link: `${linkStyles} cursor-pointer`,
} satisfies Record<ButtonVariant, string>

const sizes = {
  default:
    "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  xs: "h-6 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 gap-1 rounded-md px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  icon: "size-8",
  "icon-xs":
    "size-6 rounded-md in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-7 rounded-md in-data-[slot=button-group]:rounded-lg",
  "icon-lg": "size-9",
} satisfies Record<ButtonSize, string>

const variantClasses = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap cursor-default transition-all pointer-fine:active:not-aria-[haspopup]:scale-98 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: { variant: variants, size: sizes },
    defaultVariants: { variant: "default", size: "default" },
  }
)

/** The style props that every {@link Button} accepts. */
export interface ButtonStyleProps {
  /** The button's look. Defaults to `default`. */
  variant?: ButtonVariant
  /** The button's size. Defaults to `default`. */
  size?: ButtonSize
}

/** Options for {@link buttonVariants}: the style props, plus classes to merge in. */
export interface ButtonVariantsOptions extends ButtonStyleProps {
  /** Classes to merge after the button's own. */
  className?: string
}

/**
 * The class string for a button's look, for an element that is not a
 * {@link Button}.
 *
 * @example
 * ```tsx
 * <label className={buttonVariants({ variant: "outline" })}>Upload</label>
 * ```
 */
export function buttonVariants(
  options: ButtonVariantsOptions = {}
): string {
  const { variant, size, className } = options
  return cn(variantClasses({ variant, size }), className)
}

/**
 * Props for a {@link Button} that performs an action: every prop of Base UI's
 * `Button`, plus the style props.
 */
export type ButtonActionProps = ButtonPrimitive.Props &
  ButtonStyleProps & {
    href?: undefined
  }

/**
 * Props for a {@link Button} that opens a page: every prop of React Router's
 * `Link` except `to`, plus the style props.
 */
export type ButtonLinkProps = Omit<ComponentProps<typeof RouterLink>, "to"> &
  ButtonStyleProps & {
    /**
     * The address of the page to open. With `href`, the button renders a React
     * Router link instead of a `<button>`, so screen readers announce it as a
     * link.
     */
    href: string
  }

/** Props for {@link Button}. */
export type ButtonProps = ButtonActionProps | ButtonLinkProps

/**
 * A button. Without `href`, it renders Base UI's `Button` as a `<button>`.
 * With `href`, it renders a React Router link that looks like a button.
 *
 * The cursor stays an arrow on every style except `link`. On a device with a
 * mouse, the button scales to 98% while pressed.
 *
 * @example
 * ```tsx
 * <Button onClick={save}>Save</Button>
 * <Button variant="outline" size="sm" href="/students">All students</Button>
 * ```
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { className, variant, size, href, ...rest } = props
    return (
      <RouterLink
        data-slot="button"
        to={href}
        className={buttonVariants({ variant, size, className })}
        {...rest}
      />
    )
  }

  const { className, variant, size, ...rest } = props
  return (
    <ButtonPrimitive
      data-slot="button"
      className={
        typeof className === "function"
          ? (state) => buttonVariants({ variant, size, className: className(state) })
          : buttonVariants({ variant, size, className })
      }
      {...rest}
    />
  )
}
