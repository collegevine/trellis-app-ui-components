import { Drawer } from "@base-ui/react/drawer"
import { List } from "@phosphor-icons/react"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { NavLink, useLocation, type NavLinkProps } from "react-router"

import {
  frameColors,
  plainPageColor,
  unbrandedFrameColors,
  type BrandingStep,
  type FrameColors,
} from "../lib/branding.js"
import { drawFavicon } from "../lib/draw-favicon.js"
import { faviconPlan, type FaviconPlan } from "../lib/favicon.js"
import { pickLogo, type LogoSpace } from "../lib/logo.js"
import { analyzeLogo, type LogoAnalysis } from "../lib/analyze-logo.js"
import { cn } from "../lib/utils.js"

/** One version of a school logo, such as the one-line logo, the stacked logo or the white logo. */
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
  /** The school's name, used next to the logo, in the logo's text alternative, and in place of the logo when the school has none. */
  name: string
  /** The school's primary color, as a hex value. */
  primaryColor: string
  /**
   * Every version of the school logo that the app has, in any order. The frame
   * removes the empty space around each logo and sizes each one so that a wide
   * logo and a compact logo cover about the same area. In each place, it shows
   * the widest version that is still large enough to read, so a one-line logo
   * gives way to a stacked logo where space is short. The full-color frame
   * shows a white version, or turns another version white when there is none.
   */
  logos: SchoolLogo[]
}

/**
 * Where the frame puts the nav.
 *
 * - `top`: the app name and the nav sit in the top edge of the frame, next to
 *   the logo. Without a school, the app name starts the top edge.
 * - `left`: the nav runs down the left side of the frame, under the logo and
 *   the app name.
 * - `plain`: no frame. The logo sits above the page. With a school brand, the
 *   page is white at the `low` level, a light gray at the
 *   `medium` level, and a very light tint in the hue of the school's primary
 *   color at the `high` level. A primary color close to gray, black or white
 *   gets the light gray page at the `high` level too. Use the plain layout on
 *   a page where a user fills out a form and sees nothing else of the app.
 *   The frame is for school staff who work in the app. On a page that both non-staff and
 *   school staff use (non-staff fill out the form, and staff view, edit or
 *   manage it), pick the layout for each viewer when the page loads: a
 *   signed-in member of the school staff sees the frame, and every other
 *   viewer sees the plain layout. A form page that anyone with the link can
 *   open has no sign-in, so it cannot tell staff from non-staff, and every
 *   viewer sees the plain layout there.
 */
export type AppFrameLayout = "top" | "left" | "plain"

/** The school brand for {@link AppFrame}, or none. */
export type AppFrameBrand =
  | {
      /** The school whose brand the frame shows. */
      school: FrameSchool
      /** The level on the branding scale. */
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

const TOP_EDGE: LogoSpace = { area: 3920, minHeight: 16, maxHeight: 32, maxWidth: 280 }
const LEFT_NAV: LogoSpace = { area: 3920, minHeight: 16, maxHeight: 32, maxWidth: 192 }
const PHONE_BAR: LogoSpace = { area: 3920, minHeight: 16, maxHeight: 32, maxWidth: 220 }
const ABOVE_PAGE: LogoSpace = { area: 5120, minHeight: 18, maxHeight: 44, maxWidth: 320 }

type LogoAnalyses = Map<string, LogoAnalysis | null>

function useLogoAnalyses(logos: SchoolLogo[]): LogoAnalyses | null {
  const key = logos.map((logo) => logo.src).join("\n")
  const [analyses, setAnalyses] = useState<{ key: string; value: LogoAnalyses } | null>(null)
  useEffect(() => {
    let current = true
    Promise.all(logos.map((logo) => analyzeLogo(logo))).then((results) => {
      if (!current) return
      setAnalyses({ key, value: new Map(logos.map((logo, i) => [logo.src, results[i] ?? null])) })
    })
    return () => {
      current = false
    }
  }, [key])
  return analyses?.key === key ? analyses.value : null
}

function analysesOf(logos: SchoolLogo[], analyses: LogoAnalyses) {
  return logos.flatMap((logo) => {
    const analysis = analyses.get(logo.src)
    return analysis ? [analysis] : []
  })
}

function planKey(plan: FaviconPlan) {
  if (plan.kind === "logo") return `logo:${plan.logo.logo.src}`
  return "mark"
}

async function drawWithFallback(plan: FaviconPlan) {
  const href = await drawFavicon(plan)
  if (href || plan.kind !== "logo") return href
  return drawFavicon({ kind: "mark" })
}

function useFavicon(school: FrameSchool | undefined, analyses: LogoAnalyses | null): string | null {
  const waiting = Boolean(school && school.logos.length > 0 && !analyses)
  const versions = school && analyses ? analysesOf(school.logos, analyses) : []
  const plan = waiting ? null : faviconPlan(versions)
  const key = plan ? planKey(plan) : null
  const [icon, setIcon] = useState<{ key: string; href: string | null } | null>(null)
  useEffect(() => {
    if (!plan || !key) return
    let current = true
    drawWithFallback(plan).then((href) => {
      if (current) setIcon({ key, href })
    })
    return () => {
      current = false
    }
  }, [key])
  return icon?.key === key ? icon.href : null
}

function Logo({
  school,
  look,
  space,
  analyses,
}: {
  school: FrameSchool
  look: FrameColors["logo"]
  space: LogoSpace
  analyses: LogoAnalyses | null
}) {
  const versions = analyses ? analysesOf(school.logos, analyses) : []
  const choice = pickLogo(versions, space, look)
  const fallback = school.logos[0]
  const logo = choice?.logo ?? fallback
  if (!logo) return null
  const recolor = choice ? choice.recolor : look !== "original"
  const filter = recolor ? (look === "white" ? WHITE_LOGO : BLACK_LOGO) : undefined
  const name = logo.showsName ? null : <span className="truncate text-sm font-semibold">{school.name}</span>
  if (!choice) {
    return (
      <span className="flex min-w-0 items-center gap-2.5">
        <img
          data-slot="app-frame-logo"
          src={logo.src}
          alt={`${school.name} logo`}
          className="h-7 w-auto shrink-0"
          style={{ filter, visibility: analyses ? undefined : "hidden" }}
        />
        {name}
      </span>
    )
  }
  const { width, height } = choice.size
  const { crop, cleanSrc } = choice.analysis
  const image = cleanSrc ? (
    <img
      data-slot="app-frame-logo"
      src={cleanSrc}
      alt={`${school.name} logo`}
      className="block shrink-0"
      style={{ width, height, filter }}
    />
  ) : (
    <span className="relative block shrink-0 overflow-hidden" style={{ width, height }}>
      <img
        data-slot="app-frame-logo"
        src={logo.src}
        alt={`${school.name} logo`}
        className="absolute max-w-none"
        style={{
          width: width / crop.width,
          height: height / crop.height,
          left: -(crop.x * width) / crop.width,
          top: -(crop.y * height) / crop.height,
          filter,
        }}
      />
    </span>
  )
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {image}
      {name}
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
 * The `step` is the level on the branding scale, which sets how much school
 * color the frame shows. Call `defaultBrandingStep` with who the app is for to
 * get the level of a school's first app.
 *
 * - `low`: a very light gray frame around a white page.
 * - `medium`: a light frame in the hue of the school's primary color, around
 *   a white page. A primary color close to gray, black or white gets the light
 *   gray frame of the `low` level.
 * - `high`: the school's primary color around a white page, with
 *   the logo in white.
 *
 * The selected nav item takes its fill from the frame, so it shows on every
 * frame. Put the values from `schoolTheme` on the `<html>` element too, for
 * the neutrals and the selected controls in the page.
 *
 * @example
 * ```tsx
 * <AppFrame
 *   school={{ name: "Monza University", primaryColor: brand.primaryColor, logos: brand.logos }}
 *   step={defaultBrandingStep("staff")}
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

  const colors = school ? frameColors(school.primaryColor, step) : unbrandedFrameColors()
  const hasLogo = Boolean(school && school.logos.length > 0)
  const analyses = useLogoAnalyses(school?.logos ?? [])
  const faviconHref = useFavicon(school, analyses)
  const favicon = faviconHref ? <link rel="icon" href={faviconHref} /> : null
  const logoIn = (space: LogoSpace, look: FrameColors["logo"] = colors.logo) =>
    school ? <Logo school={school} look={look} space={space} analyses={analyses} /> : null
  const schoolName = school ? <span className="min-w-0 truncate text-sm font-semibold">{school.name}</span> : null
  const identityIn = (logo: ReactNode) => (hasLogo ? logo : schoolName)

  if (layout === "plain" || (!school && !nav)) {
    return (
      <div
        data-slot="app-frame"
        data-layout="plain"
        className="min-h-screen bg-(--frame-page) text-foreground"
        style={{ "--frame-page": school ? plainPageColor(school.primaryColor, step) : colors.page } as CSSProperties}
      >
        {favicon}
        {school ? (
          <header className="flex h-14 items-center px-6">
            {identityIn(logoIn(ABOVE_PAGE, "original"))}
          </header>
        ) : null}
        <main className={className}>{children}</main>
      </div>
    )
  }

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
      <div className="flex h-14 shrink-0 items-center px-6">{school ? identityIn(logoIn(LEFT_NAV)) : title}</div>
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
      <span className={cn("flex min-w-0 items-center", nav ? "" : "px-2")}>{school ? identityIn(logoIn(PHONE_BAR)) : title}</span>
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
        data-step={step ?? "unbranded"}
        style={vars}
        className="flex h-dvh flex-col overflow-hidden bg-(--frame) text-(--frame-foreground) md:flex-row"
      >
        {canvas}
        {favicon}
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
      {favicon}
      {mobileBar}
      <header className="hidden h-14 shrink-0 items-center gap-4 px-4 md:flex">
        {school ? identityIn(logoIn(TOP_EDGE)) : title}
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
