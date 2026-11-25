import type { ComponentProps } from "react"

import { cn } from "../lib/utils.js"

/**
 * How wide a page's content can grow.
 *
 * - `small`: up to 576px (`max-w-xl`). A form, or a flow where a student
 *   does one task.
 * - `medium`: up to 896px (`max-w-4xl`). A report, a full-page chat, or a
 *   conversation.
 * - `large`: up to 1280px (`max-w-7xl`). A dashboard, a table, or the
 *   details of one record.
 * - `full`: no limit. A board, or a queue with a detail pane beside it.
 */
export type ContentColumnWidth = "small" | "medium" | "large" | "full"

const CAPS: Record<ContentColumnWidth, string> = {
  small: "max-w-xl",
  medium: "max-w-4xl",
  large: "max-w-7xl",
  full: "max-w-none",
}

/** Props for {@link ContentColumn}. */
export type ContentColumnProps = ComponentProps<"div"> & {
  /** How wide the content can grow. Every page picks one. */
  width: ContentColumnWidth
}

/**
 * The column that holds a page's content. Put all of a page's content in one
 * column.
 *
 * The column grows with the screen until it reaches the limit of its
 * {@link ContentColumnWidth}, then stays centered. Each width has one limit, so
 * pages of the same kind line up from page to page. A class passed in
 * `className` cannot change the limit, and every other class applies.
 *
 * The column keeps a margin at each side, so content never touches the edge of
 * the screen. The margin sits outside the limit.
 *
 * @example
 * ```tsx
 * <ContentColumn width="large" className="flex flex-col gap-6 py-6">
 *   <h1>Enrollment overview</h1>
 *   …
 * </ContentColumn>
 * ```
 */
export function ContentColumn({ width, className, children, ...props }: ContentColumnProps) {
  return (
    <div data-slot="content-column-gutter" className="px-4 md:px-6">
      <div data-slot="content-column" className={cn("mx-auto w-full", className, CAPS[width])} {...props}>
        {children}
      </div>
    </div>
  )
}
