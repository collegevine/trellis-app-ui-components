import { Drawer } from "@base-ui/react/drawer"
import { List } from "@phosphor-icons/react"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { NavLink, useLocation, type NavLinkProps } from "react-router"

import {
  frameColors,
  unbrandedFrameColors,
  type BrandingStep,
  type FrameColors,
} from "../lib/branding.js"
import { cn } from "../lib/utils.js"

/** A logo image. */
export interface SchoolLogo {
  /** The address of the image. */
  src: string
  /**
   * True when the image already shows the school's name, as a wordmark does.
   * The frame then leaves out the name next to the logo.
   */
  showsName?: boolean
}

/** The school whose brand the frame shows. */
export interface FrameSchool {
  /** The school's name, used next to the logo and in the logo's text alternative. */
  name: string
  /** The main school color, as a hex value. */
  main: string
  /** The school's full-color logo. */
  logo: SchoolLogo
  /**
   * The school's approved white logo, for the full-color frame. Without it,
   * the frame turns the full-color logo white.
   */
  whiteLogo?: SchoolLogo
}

/**
 * Where the frame puts the nav.
 *
 * - `top`: the app name and the nav sit in the top edge of the frame, next to
 *   the logo. Without a school, the app name starts the top edge.
 * - `left`: the nav runs down the left side of the frame, under the logo and
 *   the app name.
 * - `plain`: no frame. The logo sits above the page. Use it for a page that
 *   people outside the school staff fill out, such as a form for students.
 */
export type AppFrameLayout = "top" | "left" | "plain"

/** The school brand for {@link AppFrame}, or none. */
export type AppFrameBrand =
  | {
      /** The school whose brand the frame shows. */
      school: FrameSchool
      /** The step on the branding scale. The `plain` layout ignores it. */
      step: BrandingStep
    }
  | {
      /**
       * No school brand. The frame takes the CollegeVine look, and the app
       * name sits where the logo goes. With no nav, there is no frame.
       */
      school?: undefined
      step?: undefined
    }

/** Props for {@link AppFrame}. */
export type AppFrameProps = AppFrameBrand & {
  /** Where the frame puts the nav. Defaults to `top`. */
  layout?: AppFrameLayout
  /** The app's name, shown in the frame. */
  appName?: string
  /** The nav, made of {@link AppFrameNavLink} elements. */
  nav?: ReactNode
  /** The page. */
  children?: ReactNode
  /** Classes to merge onto the page area. */
  className?: string
}

const WHITE_LOGO = "brightness(0) invert(1)"
const BLACK_LOGO = "brightness(0)"

function Logo({ school, look }: { school: FrameSchool; look: FrameColors["logo"] }) {
  const white = look === "white" ? school.whiteLogo : undefined
  const logo = white ?? school.logo
  const filter = white || look === "original" ? undefined : look === "white" ? WHITE_LOGO : BLACK_LOGO
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <img
        data-slot="app-frame-logo"
        src={logo.src}
        alt={`${school.name} logo`}
        className={cn("w-auto shrink-0", logo.showsName ? "h-7" : "h-8")}
        style={filter ? { filter } : undefined}
      />
      {logo.showsName ? null : (
        <span className="truncate text-sm font-semibold">{school.name}</span>
      )}
    </span>
  )
}

/**
 * The frame around an app. It wraps the page on all four sides, holds the
 * app's nav, and shows the school logo in its top edge.
 *
 * Without a `school`, the frame takes the CollegeVine look, and the app name
 * sits where the logo goes. An app with no school and no nav gets no frame.
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
 * The `step` sets how much school color the frame shows. Call
 * `defaultBrandingStep` for the step of a school's first app.
 *
 * - `logo-only`: a light gray frame around a lighter gray page.
 * - `tinted-frame`: a light tint of the main school color around a neutral page.
 * - `full-color-frame`: the main school color around a faintly tinted page, with
 *   the logo in white.
 *
 * The selected nav item takes its fill from the frame, so it shows on every
 * frame. Put the values from `schoolTheme` on the `<html>` element too, for
 * the neutrals and the selected controls in the page.
 *
 * @example
 * ```tsx
 * <AppFrame
 *   school={{ name: "DePaul University", main: brand.main, logo: { src: "/logo.svg" } }}
 *   step={defaultBrandingStep(brand.main)}
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
export function AppFrame({
  school,
  step,
  layout = "top",
  appName,
  nav,
  children,
  className,
}: AppFrameProps) {
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

  if (layout === "plain" || (!school && !nav)) {
    return (
      <div data-slot="app-frame" data-layout="plain" className="min-h-screen bg-background text-foreground">
        {school ? (
          <header className="flex h-14 items-center px-6">
            <Logo school={school} look="original" />
          </header>
        ) : null}
        <main className={className}>{children}</main>
      </div>
    )
  }

  const colors = school ? frameColors(school.main, step) : unbrandedFrameColors()
  const vars = {
    "--frame": colors.frame,
    "--frame-foreground": colors.frameText,
    "--frame-page": colors.page,
    "--frame-nav-selected": colors.navSelected,
    "--frame-nav-selected-foreground": colors.navSelectedText,
    "--frame-nav-hover": colors.navHover,
  } as CSSProperties
  const title = appName ? <span className="shrink-0 text-sm font-semibold">{appName}</span> : null
  const logo = school ? <Logo school={school} look={colors.logo} /> : title
  const canvas = (
    <style>{`html{background-color:${colors.frame};scrollbar-gutter:auto}body{background-color:transparent}`}</style>
  )
  const sideNav = (
    <>
      <div className="flex h-14 shrink-0 items-center px-6">{logo}</div>
      {school && appName ? <div className="px-6 pt-2 pb-2 text-sm font-semibold">{appName}</div> : null}
      {nav ? (
        <nav data-slot="app-frame-nav" className="flex flex-col gap-0.5 px-3 pb-3">
          {nav}
        </nav>
      ) : null}
    </>
  )
  const mobileBar = (
    <div data-slot="app-frame-mobile-bar" className="flex h-14 shrink-0 items-center gap-2 px-2 md:hidden">
      {nav ? (
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
                <Drawer.Title className="sr-only">{appName ?? school?.name ?? "Menu"}</Drawer.Title>
                {sideNav}
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      ) : null}
      <span className={cn("flex min-w-0 items-center", nav ? "" : "px-2")}>{logo}</span>
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
            "shrink-0 grow rounded-xl bg-(--frame-page) text-foreground",
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
        data-step={step ?? "unbranded"}
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
      data-step={step ?? "unbranded"}
      style={vars}
      className="flex h-dvh flex-col overflow-hidden bg-(--frame) text-(--frame-foreground)"
    >
      {canvas}
      {mobileBar}
      <header className="hidden h-14 shrink-0 items-center gap-4 px-4 md:flex">
        {logo}
        {school && title ? (
          <>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-current opacity-30" />
            {title}
          </>
        ) : null}
        {nav ? (
          <nav data-slot="app-frame-nav" className="flex min-w-0 items-center gap-1">
            {nav}
          </nav>
        ) : null}
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
