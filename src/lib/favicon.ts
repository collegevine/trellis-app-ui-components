import type { LogoAnalysis, LogoTone } from "./analyze-logo.js"

const FAVICON_MAX_RATIO = 1.25
const LIGHT_TONES: LogoTone[] = ["color", "black"]

export type FaviconPlan = { kind: "logo"; logo: LogoAnalysis } | { kind: "mark" }

function squareness(ratio: number) {
  return Math.abs(Math.log(ratio))
}

function mostSquare(versions: LogoAnalysis[], tones: LogoTone[]): LogoAnalysis | null {
  const square = versions.filter((v) => v.ratio <= FAVICON_MAX_RATIO && v.ratio >= 1 / FAVICON_MAX_RATIO)
  for (const tone of tones) {
    const matching = square.filter((v) => v.tone === tone)
    if (matching.length > 0) return matching.reduce((a, b) => (squareness(b.ratio) < squareness(a.ratio) ? b : a))
  }
  return null
}

export function faviconPlan(versions: LogoAnalysis[]): FaviconPlan {
  const logo = mostSquare(versions, LIGHT_TONES)
  return logo ? { kind: "logo", logo } : { kind: "mark" }
}
