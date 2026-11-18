import { chartColors } from "./chart-colors.js"
import { contrastRatio, fromOklch, normalizeHex, toOklch } from "./color.js"

/**
 * A step on the branding scale, from least to most school color.
 *
 * - `neutral-frame`: a very light gray frame around a white page. The school color
 *   appears in the logo. Selected controls and charts keep the neutral look.
 * - `tinted-frame`: a light frame in the hue of the main school color, around
 *   a white page. Every school gets the same lightness and the same small
 *   amount of color, and a main color close to gray, black or white gets a
 *   warm neutral. Selected controls take the main school color when it
 *   stands out from the page (see {@link selectedFill}). Charts open with the
 *   school colors (see `chartColors`).
 * - `full-color-frame`: the main school color as the frame, around a white
 *   page. The logo shows in white. Selected controls take the main school
 *   color when it stands out from the page, and charts open with the school
 *   colors.
 */
export type BrandingStep = "neutral-frame" | "tinted-frame" | "full-color-frame"

/** The steps of the branding scale, from least to most school color. */
export const BRANDING_STEPS: readonly BrandingStep[] = [
  "neutral-frame",
  "tinted-frame",
  "full-color-frame",
]

/** A school's brand colors, as hex values. */
export interface SchoolColors {
  /** The main school color, such as `#003da5`. */
  main: string
  /** The second school color, if the school has one. Only charts use it. */
  second?: string
}

const DARK_TEXT = "#111111"
const LIGHT_TEXT = "#ffffff"
const PAGE = "#ffffff"
const SELECTED_CONTRAST = 3

const NEUTRAL_CHROMA = 0.04

function isNeutral(color: string): boolean {
  return toOklch(color).c < NEUTRAL_CHROMA
}

/**
 * Who an app is for.
 *
 * - `students`: students or other people outside the school staff, such as
 *   applicants, admitted students, families, alumni or donors.
 * - `staff`: school staff. Use it too when the audience is mixed or unclear.
 */
export type AppAudience = "students" | "staff"

/**
 * The step on the branding scale for a school's first app, picked from who the
 * app is for. An app for students starts at `tinted-frame`, and an app for
 * staff starts at `neutral-frame`. It never returns `full-color-frame`.
 *
 * @example
 * ```ts
 * defaultBrandingStep("students") // "tinted-frame"
 * defaultBrandingStep("staff") // "neutral-frame"
 * ```
 */
export function defaultBrandingStep(audience: AppAudience): BrandingStep {
  if (audience === "students") return "tinted-frame"
  if (audience === "staff") return "neutral-frame"
  throw new Error(`Expected "students" or "staff", got "${String(audience)}"`)
}

/**
 * Black or white text for a fill, whichever has more contrast with it. On
 * every fill, at least one of the two reaches 4.5:1.
 */
export function readableText(fill: string): string {
  return contrastRatio(fill, LIGHT_TEXT) >= contrastRatio(fill, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT
}

/** A fill and the text that goes on it. */
export interface Fill {
  fill: string
  text: string
}

/**
 * The fill for selected controls: a checked checkbox or radio button, a switch
 * that is on, the filled part of a slider, the current page number in a table,
 * the selected day in a date picker. Tabs, segmented controls and filters keep
 * the neutral look.
 *
 * The fill is the main school color. A selected control must stand out from
 * the white page, so when the main color has less than 3:1 contrast with
 * white, the result is `null` and selected controls keep the neutral look.
 * Yellow, bright green and bright orange main colors fall in that range.
 */
export function selectedFill(colors: SchoolColors): Fill | null {
  const main = normalizeHex(colors.main)
  if (contrastRatio(main, PAGE) < SELECTED_CONTRAST) return null
  return { fill: main, text: readableText(main) }
}

const HUELESS_NEUTRALS = {
  "--background": "#fafafa",
  "--muted": "#f5f5f5",
  "--secondary": "#f0f0f0",
  "--accent": "#f0f0f0",
  "--border": "#e5e5e5",
  "--input": "#e5e5e5",
  "--sidebar": "#f5f5f5",
  "--sidebar-accent": "#f0f0f0",
  "--sidebar-border": "#e5e5e5",
}

/**
 * The theme values for a school-branded app, as CSS custom properties. Put
 * them on the `<html>` element, so that menus and dialogs, which render
 * outside the page, get them too.
 *
 * - The neutrals lose their warm hue, because warm grays can clash with a
 *   cool school color such as navy.
 * - `--school-main` and `--school-main-foreground`: the main school color and
 *   the text that goes on it.
 * - `--school-selected` and `--school-selected-foreground`: the fill for
 *   selected controls and its text (see {@link selectedFill}). They are left
 *   out at the `neutral-frame` step, and when the main color is too light for
 *   the page, so selected controls keep the neutral look.
 * - `--chart-1` to `--chart-5`: the school's chart colors, the school colors
 *   first and generated colors after them (see `chartColors`). They are left
 *   out at the `neutral-frame` step, and when no school color passes the chart
 *   checks, so charts keep the theme's colors.
 *
 * Buttons, the error red, the focus outline and the corner radius stay
 * CollegeVine, so the values do not touch them.
 *
 * @example
 * ```tsx
 * // app/root.tsx
 * <html lang="en" style={schoolTheme({ main: "#003da5" }, "tinted-frame")}>
 * ```
 */
export function schoolTheme(colors: SchoolColors, step: BrandingStep): Record<string, string> {
  const selected = step === "neutral-frame" ? null : selectedFill(colors)
  const charts = step === "neutral-frame" ? [] : chartColors(colors)
  return {
    ...HUELESS_NEUTRALS,
    "--school-main": normalizeHex(colors.main),
    "--school-main-foreground": readableText(colors.main),
    ...(selected
      ? {
          "--school-selected": selected.fill,
          "--school-selected-foreground": selected.text,
        }
      : {}),
    ...Object.fromEntries(charts.map((color, index) => [`--chart-${index + 1}`, color])),
  }
}

/** The colors of the app frame at one step of the branding scale. */
export interface FrameColors {
  frame: string
  frameText: string
  page: string
  navSelected: string
  navSelectedText: string
  navHover: string
  logo: "original" | "white" | "black"
}


const NEUTRAL_PAGE = HUELESS_NEUTRALS["--background"]

const LIGHT_GRAY_FRAME = HUELESS_NEUTRALS["--background"]

const HUE_FRAME_LIGHTNESS = 0.9625
const YELLOW_HUE_FRAME_LIGHTNESS = 0.98
const HUE_FRAME_STRENGTH = 0.0159
const WARM_NEUTRAL_HUE = 97

function isYellowHue(hue: number): boolean {
  return hue >= 105 && hue < 125
}

const PLAIN_PAGE_TINT_LIGHTNESS = 0.98
const YELLOW_PLAIN_PAGE_TINT_LIGHTNESS = 0.9885
const PLAIN_PAGE_TINT_STRENGTH = 0.0138

function schoolHue(mainColor: string): number {
  return isNeutral(mainColor) ? WARM_NEUTRAL_HUE : toOklch(mainColor).h
}

function hueFrame(mainColor: string): Pick<FrameColors, "frame" | "navSelected" | "navHover"> {
  const hue = schoolHue(mainColor)
  const lightness = isYellowHue(hue) ? YELLOW_HUE_FRAME_LIGHTNESS : HUE_FRAME_LIGHTNESS
  const shade = (darker: number, strength: number) =>
    fromOklch({ l: lightness - darker, c: HUE_FRAME_STRENGTH * strength, h: hue })
  return {
    frame: shade(0, 1),
    navHover: shade(0.017, 1.13),
    navSelected: shade(0.034, 1.26),
  }
}

function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, ${LIGHT_TEXT})`
}

function darken(color: string, percent: number): string {
  return `color-mix(in oklab, ${color}, #000000 ${percent}%)`
}

/**
 * The colors of the app frame for a main school color at one step of the
 * branding scale. The selected nav item takes its fill from the frame, so it
 * shows on every frame, even where the school color matches the frame.
 */
export function frameColors(color: string, step: BrandingStep): FrameColors {
  const mainColor = normalizeHex(color)
  if (step === "full-color-frame") {
    const frameText = readableText(mainColor)
    return {
      frame: mainColor,
      frameText,
      page: PAGE,
      navSelected: tint(mainColor, 8),
      navSelectedText: DARK_TEXT,
      navHover: `color-mix(in srgb, ${frameText} 14%, transparent)`,
      logo: frameText === LIGHT_TEXT ? "white" : "black",
    }
  }
  if (step === "tinted-frame") {
    return {
      ...hueFrame(mainColor),
      frameText: DARK_TEXT,
      page: PAGE,
      navSelectedText: DARK_TEXT,
      logo: "original",
    }
  }
  return {
    frame: LIGHT_GRAY_FRAME,
    frameText: DARK_TEXT,
    page: PAGE,
    navSelected: darken(LIGHT_GRAY_FRAME, 8),
    navSelectedText: DARK_TEXT,
    navHover: darken(LIGHT_GRAY_FRAME, 4),
    logo: "original",
  }
}

export function plainPageColor(color: string, step: BrandingStep): string {
  if (step === "neutral-frame") return PAGE
  if (step === "tinted-frame") return NEUTRAL_PAGE
  const hue = schoolHue(normalizeHex(color))
  const lightness = isYellowHue(hue) ? YELLOW_PLAIN_PAGE_TINT_LIGHTNESS : PLAIN_PAGE_TINT_LIGHTNESS
  return fromOklch({ l: lightness, c: PLAIN_PAGE_TINT_STRENGTH, h: hue })
}

/**
 * The colors of the app frame for an app with no school brand. They come from
 * the theme's warm CollegeVine neutrals, so the frame has the CollegeVine look.
 */
export function unbrandedFrameColors(): FrameColors {
  const frame = "var(--secondary)"
  return {
    frame,
    frameText: "var(--foreground)",
    page: "var(--background)",
    navSelected: `color-mix(in oklab, ${frame}, var(--foreground) 8%)`,
    navSelectedText: "var(--foreground)",
    navHover: `color-mix(in oklab, ${frame}, var(--foreground) 4%)`,
    logo: "original",
  }
}
