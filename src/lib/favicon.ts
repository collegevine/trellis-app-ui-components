import type { LogoTone, MeasuredLogo } from "./logo.js"

const FAVICON_MAX_RATIO = 1.25
const LIGHT_TONES: LogoTone[] = ["color", "black"]
const DARK_TONES: LogoTone[] = ["white", "color"]

export interface FaviconLogo extends MeasuredLogo {
  readsOnDark: boolean
}

export type FaviconPlan<T extends FaviconLogo = FaviconLogo> = { kind: "logo"; logo: T } | { kind: "mark" }

export interface FaviconPlans<T extends FaviconLogo = FaviconLogo> {
  light: FaviconPlan<T>
  dark: FaviconPlan<T>
}

function squareness(ratio: number) {
  return Math.abs(Math.log(ratio))
}

function mostSquare<T extends FaviconLogo>(versions: T[], tones: LogoTone[]): T | null {
  const square = versions.filter((v) => v.ratio <= FAVICON_MAX_RATIO && v.ratio >= 1 / FAVICON_MAX_RATIO)
  for (const tone of tones) {
    const matching = square.filter((v) => v.tone === tone)
    if (matching.length > 0) return matching.reduce((a, b) => (squareness(b.ratio) < squareness(a.ratio) ? b : a))
  }
  return null
}

const MARK: FaviconPlans<never> = { light: { kind: "mark" }, dark: { kind: "mark" } }

export function faviconPlans<T extends FaviconLogo>(versions: T[]): FaviconPlans<T> {
  const logo =
    mostSquare(versions.filter((v) => v.logo.background !== "dark"), LIGHT_TONES) ??
    mostSquare(versions, LIGHT_TONES)
  const readable = versions.filter((v) => v.readsOnDark)
  const darkLogo =
    mostSquare(readable.filter((v) => v.logo.background === "dark"), DARK_TONES) ??
    mostSquare(readable.filter((v) => v.logo.background !== "light"), ["white"]) ??
    logo
  return {
    light: logo ? { kind: "logo", logo } : MARK.light,
    dark: darkLogo ? { kind: "logo", logo: darkLogo } : MARK.dark,
  }
}
