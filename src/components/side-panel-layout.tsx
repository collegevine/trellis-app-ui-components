"use client"

import { Drawer } from "@base-ui/react/drawer"
import { SidebarSimple, X } from "@phosphor-icons/react"
import { useEffect, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react"

import { cn } from "../lib/utils.js"
import { buttonVariants } from "./button.js"

const WIDE = "(min-width: 1024px)"

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useWideScreen() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => true
  )
}

/** Props for {@link SidePanelLayout}. */
export type SidePanelLayoutProps = Omit<ComponentProps<"div">, "children"> & {
  /** What the panel holds, such as a list that picks what the main content shows. */
  panel: ReactNode
  /** A short name for the panel. Screen readers announce it, and the button that opens the panel on a small screen shows it. */
  panelLabel: string
  /** Which side of the main content the panel sits on. Defaults to `end`. */
  side?: "start" | "end"
  /**
   * On a small screen, whether the panel's drawer is open. Pass it with
   * `onPanelOpenChange` to close the drawer from the panel, such as when a
   * person picks an item in it.
   */
  panelOpen?: boolean
  /** Called when the panel's drawer opens or closes on a small screen. */
  onPanelOpenChange?: (open: boolean) => void
  /** The main content. */
  children: ReactNode
}

/**
 * A main area with a side panel beside it.
 *
 * On a screen 1024px or wider, the panel sits beside the main content at the
 * `sm` width (384px), on every page, so side panels match from app to app. The
 * main content takes the rest of the row.
 *
 * On a narrower screen, a button above the main content opens the panel in a
 * drawer, the same way the app frame opens its nav. The drawer slides in from
 * the panel's side and covers most of the screen, above a dimmed page. It
 * closes from its close button, a tap on the dimmed page, a swipe, or Escape.
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
export function SidePanelLayout({
  panel,
  panelLabel,
  side = "end",
  panelOpen,
  onPanelOpenChange,
  className,
  children,
  ...props
}: SidePanelLayoutProps) {
  const wide = useWideScreen()
  const [ownOpen, setOwnOpen] = useState(false)
  const open = panelOpen ?? ownOpen
  const setOpen = (next: boolean) => {
    setOwnOpen(next)
    onPanelOpenChange?.(next)
  }

  useEffect(() => {
    if (wide && open) setOpen(false)
  }, [wide])

  if (wide) {
    return (
      <div data-slot="side-panel-layout" className={cn("flex flex-row items-start", className)} {...props}>
        <div data-slot="side-panel-main" className={cn("min-w-0 flex-1", side === "start" ? "order-3" : "order-1")}>
          {children}
        </div>
        <aside
          aria-label={panelLabel}
          data-slot="side-panel"
          className={cn("w-sm min-w-0 shrink-0", side === "start" ? "order-1" : "order-3")}
        >
          {panel}
        </aside>
      </div>
    )
  }

  const fromStart = side === "start"
  return (
    <div data-slot="side-panel-layout" className={cn("flex flex-col", className)} {...props}>
      <Drawer.Root open={open} onOpenChange={setOpen} swipeDirection={fromStart ? "left" : "right"}>
        <Drawer.Trigger
          data-slot="side-panel-trigger"
          className={buttonVariants({ variant: "outline", className: "self-start" })}
        >
          <SidebarSimple aria-hidden="true" className={cn(!fromStart && "-scale-x-100")} />
          {panelLabel}
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 bg-foreground/30 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
          <Drawer.Viewport className="fixed inset-0">
            <Drawer.Popup
              data-slot="side-panel"
              className={cn(
                "fixed inset-y-0 flex w-11/12 max-w-sm flex-col bg-background text-foreground shadow-lg outline-none transition-transform duration-200 ease-out motion-reduce:transition-none",
                fromStart
                  ? "left-0 translate-x-(--drawer-swipe-movement-x,0px) data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full"
                  : "right-0 translate-x-(--drawer-swipe-movement-x,0px) data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full"
              )}
            >
              <div className="flex h-14 shrink-0 items-center justify-between gap-2 pr-2 pl-4">
                <Drawer.Title className="text-base font-medium">{panelLabel}</Drawer.Title>
                <Drawer.Close
                  aria-label={`Close ${panelLabel}`}
                  className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
                >
                  <X aria-hidden="true" />
                </Drawer.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{panel}</div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <div data-slot="side-panel-main" className="min-w-0">
        {children}
      </div>
    </div>
  )
}
