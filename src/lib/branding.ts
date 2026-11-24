import { contrastRatio, fromOklch, normalizeHex, toOklch } from "./color.js"

/**
 * A level on the branding scale, from least to most school color.
 *
 * - `low`: a very light gray frame around a white page. Selected controls
 *   keep the neutral look.
 * - `medium`: a light frame in the hue of the school's primary color, around
 *   a white page. Every school gets the same lightness and the same small
 *   amount of color. A primary color close to gray, black or white has no hue
 *   to show, so it gets the light gray frame of the `low` level. Selected
 *   controls take the school's primary color when it stands out from the page (see {@link selectedFill}).
 * - `high`: the school's primary color as the frame, around a white
 *   page. Selected controls take the school's primary color when it stands out
 *   from the page.
 */
export type BrandingStep = "low" | "medium" | "high"

/** The levels of the branding scale, from least to most school color. */
export const BRANDING_STEPS: readonly BrandingStep[] = [
  "low",
  "medium",
  "high",
]

/** A school's brand colors, as hex values. */
export interface SchoolColors {
  /** The school's primary color, such as `#003da5`. */
  primaryColor: string
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
 * - `non-staff`: people outside the school staff, such as students,
 *   applicants, admitted students, families, alumni or donors.
 * - `staff`: school staff. Use it too when the audience is mixed or unclear.
 */
export type AppAudience = "non-staff" | "staff"

/**
 * The level on the branding scale for a school's first app, picked from who the
 * app is for. An app for non-staff starts at `medium`, and an app for
 * staff starts at `low`. It never returns `high`.
 *
 * @example
 * ```ts
 * defaultBrandingStep("non-staff") // "medium"
 * defaultBrandingStep("staff") // "low"
 * ```
 */
export function defaultBrandingStep(audience: AppAudience): BrandingStep {
  if (audience === "non-staff") return "medium"
  if (audience === "staff") return "low"
  throw new Error(`Expected "non-staff" or "staff", got "${String(audience)}"`)
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
 * The fill is the school's primary color. A selected control must stand out from
 * the white page, so when the primary color has less than 3:1 contrast with
 * white, the result is `null` and selected controls keep the neutral look.
 * Yellow, bright green and bright orange primary colors fall in that range.
 */
export function selectedFill(colors: SchoolColors): Fill | null {
  const main = normalizeHex(colors.primaryColor)
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
 * - `--school-main` and `--school-main-foreground`: the school's primary color and
 *   the text that goes on it.
 * - `--school-selected` and `--school-selected-foreground`: the fill for
 *   selected controls and its text (see {@link selectedFill}). They are left
 *   out at the `low` level, and when the primary color is too light for
 *   the page, so selected controls keep the neutral look.
 *
 * Buttons, the error red, the focus outline and the corner radius stay
 * CollegeVine, so the values do not touch them.
 *
 * @example
 * ```tsx
 * // app/root.tsx
 * <html lang="en" style={schoolTheme({ primaryColor: "#003da5" }, "medium")}>
 * ```
 */
export function schoolTheme(colors: SchoolColors, step: BrandingStep): Record<string, string> {
  const selected = step === "low" ? null : selectedFill(colors)
  return {
    ...HUELESS_NEUTRALS,
    "--school-main": normalizeHex(colors.primaryColor),
    "--school-main-foreground": readableText(colors.primaryColor),
    ...(selected
      ? {
          "--school-selected": selected.fill,
          "--school-selected-foreground": selected.text,
        }
      : {}),
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
}


const LIGHT_GRAY_FRAME = HUELESS_NEUTRALS["--muted"]

const HUE_FRAME_LIGHTNESS = 0.9625
const YELLOW_HUE_FRAME_LIGHTNESS = 0.98
const HUE_FRAME_STRENGTH = 0.0159

function isYellowHue(hue: number): boolean {
  return hue >= 105 && hue < 125
}

function hueFrame(mainColor: string): Pick<FrameColors, "frame" | "navSelected" | "navHover"> {
  const hue = toOklch(mainColor).h
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
 * The colors of the app frame for a primary color at one level of the
 * branding scale. The selected nav item takes its fill from the frame, so it
 * shows on every frame, even where the school color matches the frame.
 */
export function frameColors(color: string, step: BrandingStep): FrameColors {
  const mainColor = normalizeHex(color)
  if (step === "high") {
    const frameText = readableText(mainColor)
    return {
      frame: mainColor,
      frameText,
      page: PAGE,
      navSelected: tint(mainColor, 8),
      navSelectedText: DARK_TEXT,
      navHover: `color-mix(in srgb, ${frameText} 14%, transparent)`,
    }
  }
  if (step === "medium" && !isNeutral(mainColor)) {
    return {
      ...hueFrame(mainColor),
      frameText: DARK_TEXT,
      page: PAGE,
      navSelectedText: DARK_TEXT,
    }
  }
  return {
    frame: LIGHT_GRAY_FRAME,
    frameText: DARK_TEXT,
    page: PAGE,
    navSelected: darken(LIGHT_GRAY_FRAME, 8),
    navSelectedText: DARK_TEXT,
    navHover: darken(LIGHT_GRAY_FRAME, 4),
  }
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
  }
}
