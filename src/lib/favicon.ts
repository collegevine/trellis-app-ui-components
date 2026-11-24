import type { LogoAnalysis, LogoTone } from "./analyze-logo.js"

const FAVICON_MAX_RATIO = 1.25
const LIGHT_TONES: LogoTone[] = ["color", "black"]
const DARK_TONES: LogoTone[] = ["white", "color"]

export type FaviconPlan = { kind: "logo"; logo: LogoAnalysis } | { kind: "mark" }

export interface FaviconPlans {
  light: FaviconPlan
  dark: FaviconPlan
}

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

const MARK: FaviconPlans = { light: { kind: "mark" }, dark: { kind: "mark" } }

export function faviconPlans(versions: LogoAnalysis[]): FaviconPlans {
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
