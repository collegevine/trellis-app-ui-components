import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { NavLink, useLocation, type NavLinkProps } from "react-router"

import { frameColors, type BrandingStep, type FrameColors } from "../lib/branding.js"
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
 *   the logo.
 * - `left`: the nav runs down the left side of the frame, under the logo and
 *   the app name.
 * - `plain`: no frame. The logo sits above the page. Use it for a page that
 *   people outside the school staff fill out, such as a form for students.
 */
export type AppFrameLayout = "top" | "left" | "plain"

/** Props for {@link AppFrame}. */
export interface AppFrameProps {
  /** The school whose brand the frame shows. */
  school: FrameSchool
  /** The step on the branding scale. The `plain` layout ignores it. */
  step: BrandingStep
  /** Where the frame puts the nav. Defaults to `top`. */
  layout?: AppFrameLayout
  /** The app's name, shown in the frame. */
  appName?: string
  /** The nav, made of {@link AppFrameNavLink} elements. */
  nav?: ReactNode
  /** The page. */
  children?: ReactNode
  /** Classes to merge onto the page area, the part that scrolls. */
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
 * The frame around a school-branded app. It wraps the page on all four sides,
 * with the school logo in its top edge, and holds the app's nav.
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
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
  }, [pathname])

  if (layout === "plain") {
    return (
      <div data-slot="app-frame" data-layout="plain" className="min-h-screen bg-background text-foreground">
        <header className="flex h-14 items-center px-6">
          <Logo school={school} look="original" />
        </header>
        <main className={className}>{children}</main>
      </div>
    )
  }

  const colors = frameColors(school.main, step)
  const vars = {
    "--frame": colors.frame,
    "--frame-foreground": colors.frameText,
    "--frame-page": colors.page,
    "--frame-nav-selected": colors.navSelected,
    "--frame-nav-selected-foreground": colors.navSelectedText,
    "--frame-nav-hover": colors.navHover,
  } as CSSProperties
  const logo = <Logo school={school} look={colors.logo} />
  const canvas = (
    <style>{`html{background-color:${colors.frame};scrollbar-gutter:auto}body{background-color:transparent}`}</style>
  )
  const page = (
    <main
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-(--frame-page) text-foreground",
        layout === "left" ? "my-2 mr-2" : "mx-2 mb-2"
      )}
    >
      <div
        ref={scroller}
        data-slot="app-frame-page"
        className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      >
        {children}
      </div>
    </main>
  )

  if (layout === "left") {
    return (
      <div
        data-slot="app-frame"
        data-layout="left"
        data-step={step}
        style={vars}
        className="flex h-dvh overflow-hidden bg-(--frame) text-(--frame-foreground)"
      >
        {canvas}
        <aside className="flex w-60 shrink-0 flex-col overflow-y-auto">
          <div className="flex h-14 items-center px-6">{logo}</div>
          {appName ? <div className="px-6 pt-2 pb-2 text-sm font-semibold">{appName}</div> : null}
          {nav ? (
            <nav data-slot="app-frame-nav" className="flex flex-col gap-0.5 px-3">
              {nav}
            </nav>
          ) : null}
        </aside>
        {page}
      </div>
    )
  }

  return (
    <div
      data-slot="app-frame"
      data-layout="top"
      data-step={step}
      style={vars}
      className="flex h-dvh flex-col overflow-hidden bg-(--frame) text-(--frame-foreground)"
    >
      {canvas}
      <header className="flex h-14 shrink-0 items-center gap-4 px-4">
        {logo}
        {appName ? (
          <>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-current opacity-30" />
            <span className="shrink-0 text-sm font-semibold">{appName}</span>
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
