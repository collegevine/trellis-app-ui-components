import { contrastRatio, normalizeHex, toOklch } from "./color.js"

/** A school's brand colors, as hex values. */
export interface SchoolColors {
  /** The main school color, such as `#003da5`. */
  main: string
  /** The second school color, if the school has one. */
  second?: string
}

const DARK_TEXT = "#111111"
const LIGHT_TEXT = "#ffffff"

const NEUTRAL_CHROMA = 0.04

function isNeutral(color: string): boolean {
  return toOklch(color).c < NEUTRAL_CHROMA
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

function isNearBlack(color: string): boolean {
  const { l } = toOklch(color)
  return isNeutral(color) && l < 0.4
}

function isNearWhite(color: string): boolean {
  const { l } = toOklch(color)
  return isNeutral(color) && l > 0.95
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
 * The fill is the second school color. When the second color is black or a
 * dark gray, it looks like a button, so the main school color fills instead.
 * With no second color, or a white one, the result is `null` and selected
 * controls keep the neutral look.
 */
export function selectedFill(colors: SchoolColors): Fill | null {
  const main = normalizeHex(colors.main)
  const second = colors.second === undefined ? undefined : normalizeHex(colors.second)
  if (second === undefined || isNearWhite(second)) return null
  const fill = isNearBlack(second) ? main : second
  return { fill, text: readableText(fill) }
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
 * <html lang="en" style={schoolTheme({ main: "#003da5", second: "#e4002b" })}>
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
