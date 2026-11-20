import { Drawer } from "@base-ui/react/drawer"
import { List } from "@phosphor-icons/react"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { NavLink, useLocation, type NavLinkProps } from "react-router"

import { unbrandedFrameColors } from "../lib/branding.js"
import { cn } from "../lib/utils.js"

/**
 * Where the frame puts the nav.
 *
 * - `top`: the app name and the nav sit in the top edge of the frame.
 * - `left`: the nav runs down the left side of the frame, under the app name.
 */
export type AppFrameLayout = "top" | "left"

/** Props for {@link AppFrame}. */
export interface AppFrameProps {
  /** Where the frame puts the nav. Defaults to `top`. */
  layout?: AppFrameLayout
  /** The app's name, shown in the frame. */
  appName?: string
  /** The nav, made of {@link AppFrameNavLink} elements. With no nav, there is no frame. */
  nav?: ReactNode
  /** The page. */
  children?: ReactNode
  /** Classes to merge onto the page area. */
  className?: string
}

/**
 * The frame around an app with a nav. It wraps the page on all four sides,
 * holds the app's nav, and shows the app name in its top edge. The frame takes
 * the CollegeVine look. An app with no nav gets no frame.
 *
 * Only the page scrolls, and the frame stays in place. The bottom edge of the
 * frame comes into view when the user scrolls to the end of the page. Where the
 * browser draws a scrollbar beside the page, the page's right corners are
 * square, so that the page meets the scrollbar, and the scrollbar's top end
 * takes the rounded corner.
 *
 * Below tablet width, the top nav and the left nav both give way to a menu
 * button in the top edge. The button opens the nav in a drawer from the left
 * side, and the drawer closes when a nav item opens another page.
 *
 * @example
 * ```tsx
 * <AppFrame
 *   appName="Admissions dashboard"
 *   nav={
 *     <>
 *       <AppFrameNavLink to="/" end>Overview</AppFrameNavLink>
 *       <AppFrameNavLink to="/by-college">By college</AppFrameNavLink>
 *     </>
 *   }
 * >
 *   <Outlet />
 * </AppFrame>
 * ```
 */
export function AppFrame({ layout = "top", appName, nav, children, className }: AppFrameProps) {
  const { pathname } = useLocation()
  const scroller = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasScrollbar, setHasScrollbar] = useState(false)
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
    setMenuOpen(false)
  }, [pathname])
  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const measure = () => setHasScrollbar(element.offsetWidth - element.clientWidth > 0)
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)
    return () => observer.disconnect()
  }, [layout])

  if (!nav) {
    return (
      <div data-slot="app-frame" data-layout="plain" className="min-h-screen bg-background text-foreground">
        <main className={className}>{children}</main>
      </div>
    )
  }

  const colors = unbrandedFrameColors()
  const vars = {
    "--frame": colors.frame,
    "--frame-foreground": colors.frameText,
    "--frame-page": colors.page,
    "--frame-nav-selected": colors.navSelected,
    "--frame-nav-selected-foreground": colors.navSelectedText,
    "--frame-nav-hover": colors.navHover,
  } as CSSProperties
  const title = appName ? <span className="shrink-0 text-sm font-semibold">{appName}</span> : null
  const canvas = (
    <style>{`html{background-color:${colors.frame};scrollbar-gutter:auto}body{background-color:transparent}`}</style>
  )
  const sideNav = (
    <>
      <div className="flex h-14 shrink-0 items-center px-6">{title}</div>
      <nav data-slot="app-frame-nav" className="flex flex-col gap-0.5 px-3 pb-3">
        {nav}
      </nav>
    </>
  )
  const mobileBar = (
    <div data-slot="app-frame-mobile-bar" className="flex h-14 shrink-0 items-center gap-2 px-2 md:hidden">
      <Drawer.Root open={menuOpen} onOpenChange={setMenuOpen} swipeDirection="left">
        <Drawer.Trigger
          aria-label="Open menu"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-(--frame-foreground) hover:bg-(--frame-nav-hover)"
        >
          <List className="size-5" aria-hidden="true" />
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 bg-foreground/30 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Drawer.Viewport className="fixed inset-0">
            <Drawer.Popup
              data-slot="app-frame-menu"
              style={vars}
              className="fixed inset-y-0 left-0 flex w-72 max-w-full translate-x-(--drawer-swipe-movement-x,0px) flex-col overflow-y-auto bg-(--frame) text-(--frame-foreground) shadow-lg outline-none transition-transform duration-200 ease-out data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full"
            >
              <Drawer.Title className="sr-only">{appName ?? "Menu"}</Drawer.Title>
              {sideNav}
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <span className="flex min-w-0 items-center">{title}</span>
    </div>
  )
  const page = (
    <main
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-t-xl",
        layout === "left" ? "mx-2 md:mt-2 md:ml-0" : "mx-2"
      )}
    >
      <div
        ref={scroller}
        data-slot="app-frame-scroll"
        data-scrollbar={hasScrollbar ? "" : undefined}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div
          data-slot="app-frame-page"
          className={cn(
            "relative shrink-0 grow overflow-clip rounded-xl bg-(--frame-page) text-foreground",
            hasScrollbar && "rounded-r-none",
            className
          )}
        >
          {children}
        </div>
        <div aria-hidden="true" className="h-2 shrink-0" />
      </div>
    </main>
  )

  if (layout === "left") {
    return (
      <div
        data-slot="app-frame"
        data-layout="left"
        style={vars}
        className="flex h-dvh flex-col overflow-hidden bg-(--frame) text-(--frame-foreground) md:flex-row"
      >
        {canvas}
        {mobileBar}
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto md:flex">{sideNav}</aside>
        {page}
      </div>
    )
  }

  return (
    <div
      data-slot="app-frame"
      data-layout="top"
      style={vars}
      className="flex h-dvh flex-col overflow-hidden bg-(--frame) text-(--frame-foreground)"
    >
      {canvas}
      {mobileBar}
      <header className="hidden h-14 shrink-0 items-center gap-4 px-4 md:flex">
        {title}
        <nav data-slot="app-frame-nav" className="flex min-w-0 items-center gap-1">
          {nav}
        </nav>
      </header>
      {page}
    </div>
  )
}

/** Props for {@link AppFrameNavLink}: every prop of React Router's `NavLink`. */
export type AppFrameNavLinkProps = NavLinkProps

/**
 * A nav item in the {@link AppFrame}. It is a React Router `NavLink`, so it
 * marks itself as the current page. The current item fills with a color from
 * the frame, and the other items fill with a lighter version on hover.
 */
export function AppFrameNavLink({ className, ...props }: AppFrameNavLinkProps) {
  return (
    <NavLink
      data-slot="app-frame-nav-link"
      className={(state) =>
        cn(
          "rounded-md px-3 py-1.5 text-sm text-(--frame-foreground) transition-colors hover:not-aria-[current=page]:bg-(--frame-nav-hover) aria-[current=page]:bg-(--frame-nav-selected) aria-[current=page]:text-(--frame-nav-selected-foreground)",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    />
  )
}
