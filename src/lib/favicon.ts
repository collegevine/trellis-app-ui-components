import type { LogoTone, MeasuredLogo } from "./logo.js"

const FAVICON_MAX_RATIO = 1.25
const LIGHT_TONES: LogoTone[] = ["color", "black"]

export interface FaviconLogo extends MeasuredLogo {
  round: boolean
}

export type FaviconBacking = "none" | "circle" | "square"

export type FaviconPlan<T extends FaviconLogo = FaviconLogo> =
  | { kind: "logo"; logo: T; backing: FaviconBacking }
  | { kind: "mark" }

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
  const logo = mostSquare(versions, LIGHT_TONES)
  if (!logo) return MARK
  const white = mostSquare(versions, ["white"])
  return {
    light: { kind: "logo", logo, backing: "none" },
    dark: white
      ? { kind: "logo", logo: white, backing: "none" }
      : { kind: "logo", logo, backing: logo.round ? "circle" : "square" },
  }
}
