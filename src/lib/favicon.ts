import { readableText } from "./branding.js"
import { normalizeHex } from "./color.js"
import type { LogoTone, MeasuredLogo } from "./logo.js"

const FAVICON_MAX_RATIO = 1.25
const LIGHT_TONES: LogoTone[] = ["color", "black"]
const GENERIC_WORDS = new Set(["the", "of", "and", "at", "university", "college", "institute", "school"])

export interface FaviconLogo extends MeasuredLogo {
  round: boolean
}

export type FaviconBacking = "none" | "circle" | "square"

export type FaviconPlan<T extends FaviconLogo = FaviconLogo> =
  | { kind: "logo"; logo: T; backing: FaviconBacking }
  | { kind: "letter"; letter: string; fill: string; text: string }
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

export function faviconLetter(name: string): string {
  const words = name.split(/\s+/).map((word) => word.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean)
  const word = words.find((w) => !GENERIC_WORDS.has(w.toLowerCase())) ?? words[0] ?? ""
  return word.charAt(0).toUpperCase()
}

export function faviconPlans<T extends FaviconLogo>(
  school: { name: string; main: string } | undefined,
  versions: T[]
): FaviconPlans<T> {
  if (!school) return { light: { kind: "mark" }, dark: { kind: "mark" } }
  const logo = mostSquare(versions, LIGHT_TONES)
  if (!logo) {
    const fill = normalizeHex(school.main)
    const tile: FaviconPlan<T> = { kind: "letter", letter: faviconLetter(school.name), fill, text: readableText(fill) }
    return { light: tile, dark: tile }
  }
  const white = mostSquare(versions, ["white"])
  return {
    light: { kind: "logo", logo, backing: "none" },
    dark: white
      ? { kind: "logo", logo: white, backing: "none" }
      : { kind: "logo", logo, backing: logo.round ? "circle" : "square" },
  }
}
