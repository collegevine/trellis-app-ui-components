import type { SchoolLogo } from "../components/app-frame.js"

export interface LogoSpace {
  area: number
  minHeight: number
  maxHeight: number
  maxWidth: number
}

export interface InkBounds {
  left: number
  top: number
  right: number
  bottom: number
  background: [number, number, number] | null
}

export interface MeasuredLogo {
  logo: SchoolLogo
  ratio: number
}

export interface LogoSize {
  width: number
  height: number
  fits: boolean
}

const CLEAR_ALPHA = 12
const BACKGROUND_DISTANCE = 36

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
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (channel(pixels, i + 3) <= CLEAR_ALPHA) continue
      if (background && distance(pixels, i, background) <= BACKGROUND_DISTANCE) continue
      if (y < top) top = y
      if (y > bottom) bottom = y
      if (x < left) left = x
      if (x > right) right = x
    }
  }
  if (bottom < 0) return null
  return { left, top, right, bottom, background }
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
