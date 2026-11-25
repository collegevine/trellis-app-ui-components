"use client"

import { Drawer } from "@base-ui/react/drawer"
import { SidebarSimple, X } from "@phosphor-icons/react"
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"

import { cn } from "../lib/utils.js"
import { buttonVariants } from "./button.js"

const WIDE = "(min-width: 1024px)"
const MIN_WIDTH = 256
const DEFAULT_WIDTH = 384
const MAX_WIDTH = 576
const STEP = 16

function clamp(width: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))
}

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
 * On a screen 1024px or wider, the panel sits beside the main content and
 * opens at the `sm` width (384px), on every page, so side panels match from app
 * to app. A person resizes it between 256px and 576px, the limit of a `small`
 * {@link ContentColumn}. They drag the handle between the panel and the main
 * content, or focus the handle and press the arrow keys (16px a press), Home
 * (narrowest) or End (widest). A double click on the handle puts the panel back
 * at its opening width. The main content takes the rest of the row.
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
  style,
  children,
  ...props
}: SidePanelLayoutProps) {
  const wide = useWideScreen()
  const panelId = useId()
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [resizing, setResizing] = useState(false)
  const drag = useRef<{ x: number; width: number } | null>(null)
  const toward = side === "start" ? 1 : -1
  const [ownOpen, setOwnOpen] = useState(false)
  const open = panelOpen ?? ownOpen
  const setOpen = (next: boolean) => {
    setOwnOpen(next)
    onPanelOpenChange?.(next)
  }

  useEffect(() => {
    if (wide && open) setOpen(false)
  }, [wide])

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, width }
    setResizing(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    if (event.buttons === 0) return endDrag()
    setWidth(clamp(drag.current.width + (event.clientX - drag.current.x) * toward))
  }

  function endDrag() {
    drag.current = null
    setResizing(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = {
      ArrowRight: width + STEP * toward,
      ArrowLeft: width - STEP * toward,
      Home: MIN_WIDTH,
      End: MAX_WIDTH,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    setWidth(clamp(next))
  }

  if (wide) {
    return (
      <div
        data-slot="side-panel-layout"
        data-resizing={resizing ? "" : undefined}
        className={cn("group/layout flex flex-row items-start data-resizing:select-none", className)}
        style={{ ...style, "--side-panel-width": `${width}px` } as CSSProperties}
        {...props}
      >
        <div data-slot="side-panel-main" className={cn("min-w-0 flex-1", side === "start" ? "order-3" : "order-1")}>
          {children}
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${panelLabel}`}
          aria-controls={panelId}
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onLostPointerCapture={endDrag}
          onKeyDown={onKeyDown}
          onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
          data-slot="side-panel-handle"
          className="group/handle order-2 flex w-4 shrink-0 cursor-col-resize touch-none justify-center self-stretch outline-none"
        >
          <span
            aria-hidden
            className="w-px bg-border group-hover/handle:w-0.5 group-hover/handle:bg-foreground/30 group-focus-visible/handle:w-0.5 group-focus-visible/handle:bg-ring group-data-resizing/layout:w-0.5 group-data-resizing/layout:bg-foreground/30"
          />
        </div>
        {resizing && (
          <div
            data-slot="side-panel-resize-shield"
            aria-hidden
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            className="fixed inset-0 z-50 cursor-col-resize"
          />
        )}
        <aside
          id={panelId}
          aria-label={panelLabel}
          data-slot="side-panel"
          className={cn("w-(--side-panel-width) min-w-0 shrink-0", side === "start" ? "order-1" : "order-3")}
        >
          {panel}
        </aside>
      </div>
    )
  }

  const fromStart = side === "start"
  return (
    <div data-slot="side-panel-layout" className={cn("flex flex-col", className)} style={style} {...props}>
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
