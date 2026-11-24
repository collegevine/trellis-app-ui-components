import type { LogoTone, MeasuredLogo } from "./logo.js"

const FAVICON_MAX_RATIO = 1.25
const LIGHT_TONES: LogoTone[] = ["color", "black"]

export type FaviconPlan<T extends MeasuredLogo = MeasuredLogo> = { kind: "logo"; logo: T } | { kind: "mark" }

function squareness(ratio: number) {
  return Math.abs(Math.log(ratio))
}

function mostSquare<T extends MeasuredLogo>(versions: T[], tones: LogoTone[]): T | null {
  const square = versions.filter((v) => v.ratio <= FAVICON_MAX_RATIO && v.ratio >= 1 / FAVICON_MAX_RATIO)
  for (const tone of tones) {
    const matching = square.filter((v) => v.tone === tone)
    if (matching.length > 0) return matching.reduce((a, b) => (squareness(b.ratio) < squareness(a.ratio) ? b : a))
  }
  return null
}

export function faviconPlan<T extends MeasuredLogo>(versions: T[]): FaviconPlan<T> {
  const logo = mostSquare(versions, LIGHT_TONES)
  return logo ? { kind: "logo", logo } : { kind: "mark" }
}
