import type { SchoolLogo } from "../components/app-frame.js"

export interface LogoSpace {
  area: number
  minHeight: number
  maxHeight: number
  maxWidth: number
}

export type LogoTone = "white" | "black" | "color"

export type LogoLook = "original" | "white" | "black"

export interface InkBounds {
  left: number
  top: number
  right: number
  bottom: number
  background: [number, number, number] | null
  tone: LogoTone
}

export interface MeasuredLogo {
  logo: SchoolLogo
  ratio: number
  tone: LogoTone
}

export interface LogoSize {
  width: number
  height: number
  fits: boolean
}

export interface LogoChoice<T extends MeasuredLogo = MeasuredLogo> {
  logo: T["logo"]
  measured: T
  recolor: boolean
  size: LogoSize
}

const CLEAR_ALPHA = 12
const BACKGROUND_DISTANCE = 36
const WHITE_CHANNEL = 180
const WHITE_SHARE = 0.5
const BLACK_CHANNEL = 80
const BLACK_SHARE = 0.7

function channel(pixels: Uint8ClampedArray, i: number) {
  return pixels[i] ?? 0
}

function distance(pixels: Uint8ClampedArray, i: number, color: [number, number, number]) {
  return (
    Math.abs(channel(pixels, i) - color[0]) +
    Math.abs(channel(pixels, i + 1) - color[1]) +
    Math.abs(channel(pixels, i + 2) - color[2])
  )
}

function solidCorner(pixels: Uint8ClampedArray, width: number, height: number): [number, number, number] | null {
  const corners = [0, width - 1, (height - 1) * width, height * width - 1].map((p) => p * 4)
  const first = corners[0] ?? 0
  const color: [number, number, number] = [channel(pixels, first), channel(pixels, first + 1), channel(pixels, first + 2)]
  const same = corners.every(
    (i) =>
      channel(pixels, i + 3) > 200 &&
      distance(pixels, i, color) + Math.abs(channel(pixels, i + 3) - channel(pixels, first + 3)) < 24
  )
  return same ? color : null
}

export function clearBackground(pixels: Uint8ClampedArray, background: [number, number, number]) {
  for (let i = 0; i < pixels.length; i += 4) {
    if (distance(pixels, i, background) <= BACKGROUND_DISTANCE) pixels[i + 3] = 0
  }
}

export function inkBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  { solidBackground }: { solidBackground: boolean }
): InkBounds | null {
  const background = solidBackground ? solidCorner(pixels, width, height) : null
  let top = height
  let bottom = -1
  let left = width
  let right = -1
  let ink = 0
  let whiteInk = 0
  let blackInk = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (channel(pixels, i + 3) <= CLEAR_ALPHA) continue
      if (background && distance(pixels, i, background) <= BACKGROUND_DISTANCE) continue
      ink++
      if (Math.min(channel(pixels, i), channel(pixels, i + 1), channel(pixels, i + 2)) > WHITE_CHANNEL) whiteInk++
      if (Math.max(channel(pixels, i), channel(pixels, i + 1), channel(pixels, i + 2)) < BLACK_CHANNEL) blackInk++
      if (y < top) top = y
      if (y > bottom) bottom = y
      if (x < left) left = x
      if (x > right) right = x
    }
  }
  if (bottom < 0) return null
  const tone: LogoTone =
    whiteInk / ink >= WHITE_SHARE ? "white" : blackInk / ink >= BLACK_SHARE ? "black" : "color"
  return { left, top, right, bottom, background, tone }
}

const CORNER_SHARE = 0.12

function isClear(pixels: Uint8ClampedArray, i: number, background: InkBounds["background"]) {
  return channel(pixels, i + 3) <= CLEAR_ALPHA || (background !== null && distance(pixels, i, background) <= BACKGROUND_DISTANCE)
}

export function isRound(pixels: Uint8ClampedArray, width: number, bounds: InkBounds) {
  const inkWidth = bounds.right - bounds.left + 1
  const inkHeight = bounds.bottom - bounds.top + 1
  const corner = Math.max(1, Math.round(CORNER_SHARE * Math.min(inkWidth, inkHeight)))
  const corners: [number, number][] = [
    [bounds.left, bounds.top],
    [bounds.right - corner + 1, bounds.top],
    [bounds.left, bounds.bottom - corner + 1],
    [bounds.right - corner + 1, bounds.bottom - corner + 1],
  ]
  return corners.every(([left, top]) => {
    for (let y = top; y < top + corner; y++) {
      for (let x = left; x < left + corner; x++) {
        if (!isClear(pixels, (y * width + x) * 4, bounds.background)) return false
      }
    }
    return true
  })
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

export function pickLogo<T extends MeasuredLogo>(
  versions: T[],
  space: LogoSpace,
  look: LogoLook
): LogoChoice<T> | null {
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
  const sized = candidates.map((measured) => ({ measured, size: logoSize(measured.ratio, space) }))
  const fitting = sized.filter((s) => s.size.fits)
  const pool = fitting.length > 0 ? fitting : sized
  const best = pool.reduce((a, b) =>
    fitting.length > 0 ? (b.measured.ratio > a.measured.ratio ? b : a) : b.size.height > a.size.height ? b : a
  )
  return { logo: best.measured.logo, measured: best.measured, recolor, size: best.size }
}
