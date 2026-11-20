import { contrastRatio, normalizeHex } from "./color.js"

/** A school's brand colors, as hex values. */
export interface SchoolColors {
  /** The main school color, such as `#003da5`. */
  main: string
}

const DARK_TEXT = "#111111"
const LIGHT_TEXT = "#ffffff"
const PAGE = "#ffffff"
const SELECTED_CONTRAST = 3

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
 * The fill for selected controls: a selected tab, a checked checkbox or radio
 * button, a switch that is on, the selected option in a segmented control,
 * the current page number in a table, the selected day in a date picker.
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
 *   out when selected controls keep the neutral look.
 *
 * Buttons, the error red, the focus outline and the corner radius stay
 * CollegeVine, so the values do not touch them.
 *
 * @example
 * ```tsx
 * // app/root.tsx
 * <html lang="en" style={schoolTheme({ main: "#003da5" })}>
 * ```
 */
export function schoolTheme(colors: SchoolColors): Record<string, string> {
  const selected = selectedFill(colors)
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
  }
}

/** The colors of the app frame. */
export interface FrameColors {
  frame: string
  frameText: string
  page: string
  navSelected: string
  navSelectedText: string
  navHover: string
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
