"use client"

import {
  CheckCircle,
  Info,
  Spinner,
  Warning,
  XCircle,
} from "@phosphor-icons/react"
import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

export { toast } from "sonner"
export type { ToasterProps } from "sonner"

/**
 * The container that shows toasts. Mount it once, in the root layout, inside
 * the body after the page content. Fire a toast with `toast`, which this
 * package re-exports from Sonner so that the app and the Toaster share one copy
 * of Sonner.
 *
 * The Toaster takes its colors, border and corner radius from the theme, and
 * its icons from Phosphor. It accepts every prop of Sonner's `Toaster`.
 *
 * @example
 * ```tsx
 * // app/root.tsx, inside <body>, after the page content
 * <Toaster />
 *
 * // anywhere in the app
 * toast("Saved")
 * ```
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CheckCircle className="size-4" />,
        info: <Info className="size-4" />,
        warning: <Warning className="size-4" />,
        error: <XCircle className="size-4 text-destructive" />,
        loading: <Spinner className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}
