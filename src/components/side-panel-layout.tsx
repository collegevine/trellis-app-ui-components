import type { ComponentProps, ReactNode } from "react"

import { cn } from "../lib/utils.js"

/** Props for {@link SidePanelLayout}. */
export type SidePanelLayoutProps = Omit<ComponentProps<"div">, "children"> & {
  /** What the panel holds, such as a list that picks what the main content shows. */
  panel: ReactNode
  /** A short name for the panel. Screen readers announce it. */
  panelLabel: string
  /** Which side of the main content the panel sits on, on a large screen. Defaults to `end`. */
  side?: "start" | "end"
  /** The main content. */
  children: ReactNode
}

/**
 * A main area with a side panel beside it.
 *
 * The panel is 352px wide on every page, so side panels match from app to app.
 * The main content takes the rest of the row.
 *
 * On a screen narrower than 1024px the panel stacks under the main content at
 * full width.
 *
 * @example
 * ```tsx
 * <ContentColumn width="full">
 *   <SidePanelLayout side="start" panelLabel="Applicants" panel={<ApplicantList />} className="gap-6">
 *     <ApplicantDetails />
 *   </SidePanelLayout>
 * </ContentColumn>
 * ```
 */
export function SidePanelLayout({ panel, panelLabel, side = "end", className, children, ...props }: SidePanelLayoutProps) {
  return (
    <div data-slot="side-panel-layout" className={cn("flex flex-col lg:flex-row lg:items-start", className)} {...props}>
      <div data-slot="side-panel-main" className={cn("min-w-0 flex-1", side === "start" ? "lg:order-3" : "lg:order-1")}>
        {children}
      </div>
      <aside
        aria-label={panelLabel}
        data-slot="side-panel"
        className={cn("min-w-0 shrink-0 lg:w-88", side === "start" ? "lg:order-1" : "lg:order-3")}
      >
        {panel}
      </aside>
    </div>
  )
}
