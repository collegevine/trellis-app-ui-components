import type { SchoolLogo } from "../components/app-frame.js"
import type { LogoAnalysis, LogoTone } from "./analyze-logo.js"

export interface LogoSpace {
  area: number
  minHeight: number
  maxHeight: number
  maxWidth: number
}

export type LogoLook = "original" | "white" | "black"

export interface LogoSize {
  width: number
  height: number
  fits: boolean
}

export interface LogoChoice {
  logo: SchoolLogo
  analysis: LogoAnalysis
  recolor: boolean
  size: LogoSize
}

export function logoSize(ratio: number, space: LogoSpace): LogoSize {
  const ideal = Math.sqrt(space.area / ratio)
  let height = Math.min(space.maxHeight, Math.max(space.minHeight, ideal))
  if (height * ratio > space.maxWidth) height = space.maxWidth / ratio
  const width = height * ratio
  return {
    width: Math.round(width),
    height: Math.round(height),
    fits: height >= space.minHeight && width <= space.maxWidth,
  }
}

export function pickLogo(versions: LogoAnalysis[], space: LogoSpace, look: LogoLook): LogoChoice | null {
  if (versions.length === 0) return null
  const withTone = (tone: LogoTone) => versions.filter((v) => v.tone === tone)
  const preferred =
    look === "original"
      ? [withTone("color"), withTone("black")]
      : look === "white"
        ? [withTone("white")]
        : [withTone("black")]
  const matching = preferred.find((group) => group.length > 0)
  const nonWhite = versions.filter((v) => v.tone !== "white")
  const candidates = matching ?? (look === "white" || nonWhite.length === 0 ? versions : nonWhite)
  const recolor = !matching
  const sized = candidates.map((analysis) => ({ analysis, size: logoSize(analysis.ratio, space) }))
  const fitting = sized.filter((s) => s.size.fits)
  const pool = fitting.length > 0 ? fitting : sized
  const best = pool.reduce((a, b) =>
    fitting.length > 0 ? (b.analysis.ratio > a.analysis.ratio ? b : a) : b.size.height > a.size.height ? b : a
  )
  return { logo: best.analysis.logo, analysis: best.analysis, recolor, size: best.size }
}
