import type { SchoolLogo } from "../components/app-frame.js"
import { luminanceContrast, parseHex, rgbLuminance } from "./color.js"

export type LogoTone = "white" | "black" | "color"

export interface InkBounds {
  left: number
  top: number
  right: number
  bottom: number
  background: [number, number, number] | null
  tone: LogoTone
}

export interface Crop {
  x: number
  y: number
  width: number
  height: number
}

export interface LogoAnalysis {
  logo: SchoolLogo
  ratio: number
  tone: LogoTone
  readsOnDark: boolean
  crop: Crop
  cleanSrc: string | null
}

const CLEAR_ALPHA = 12
const BACKGROUND_DISTANCE = 36
const WHITE_CHANNEL = 180
const WHITE_SHARE = 0.5
const BLACK_CHANNEL = 80
const BLACK_SHARE = 0.7
const RASTER_HEIGHT = 400
const MAX_RASTER_WIDTH = 8000
const cache = new Map<string, Promise<LogoAnalysis | null>>()

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

function isBackground(pixels: Uint8ClampedArray, i: number, background: [number, number, number]) {
  return distance(pixels, i, background) <= BACKGROUND_DISTANCE
}

function isClear(pixels: Uint8ClampedArray, i: number, background: [number, number, number] | null) {
  return channel(pixels, i + 3) <= CLEAR_ALPHA || (background !== null && isBackground(pixels, i, background))
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

function clearBackground(pixels: Uint8ClampedArray, background: [number, number, number]) {
  for (let i = 0; i < pixels.length; i += 4) {
    if (isBackground(pixels, i, background)) pixels[i + 3] = 0
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
      if (isClear(pixels, i, background)) continue
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

const DARK_TAB = "#35363a"
const DARK_TAB_CONTRAST = 3
const READABLE_SHARE = 0.5

export function readsOnDark(pixels: Uint8ClampedArray, width: number, bounds: InkBounds) {
  const tab = rgbLuminance(parseHex(DARK_TAB))
  let ink = 0
  let readable = 0
  for (let y = bounds.top; y <= bounds.bottom; y++) {
    for (let x = bounds.left; x <= bounds.right; x++) {
      const i = (y * width + x) * 4
      if (isClear(pixels, i, bounds.background)) continue
      ink++
      const color: [number, number, number] = [channel(pixels, i), channel(pixels, i + 1), channel(pixels, i + 2)]
      if (luminanceContrast(rgbLuminance(color), tab) >= DARK_TAB_CONTRAST) readable++
    }
  }
  return ink > 0 && readable / ink >= READABLE_SHARE
}

function isSvg(src: string) {
  return /\.svg(?:[?#]|$)/i.test(src) || src.startsWith("data:image/svg")
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${src}`))
    image.src = src
  })
}

async function svgSize(src: string) {
  try {
    const text = await (await fetch(src)).text()
    const svg = new DOMParser().parseFromString(text, "image/svg+xml").documentElement
    const width = parseFloat(svg.getAttribute("width") ?? "")
    const height = parseFloat(svg.getAttribute("height") ?? "")
    if (width > 0 && height > 0 && !/%/.test(svg.getAttribute("width") ?? "")) return { width, height }
    const box = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number)
    const [, , boxWidth = 0, boxHeight = 0] = box
    if (box.length === 4 && boxWidth > 0 && boxHeight > 0) return { width: boxWidth, height: boxHeight }
  } catch {
    return null
  }
  return null
}

export function analyzeLogo(logo: SchoolLogo): Promise<LogoAnalysis | null> {
  let pending = cache.get(logo.src)
  if (!pending) {
    pending = (async (): Promise<LogoAnalysis | null> => {
      const image = await loadImage(logo.src)
      const svg = isSvg(logo.src)
      const natural = (svg ? await svgSize(logo.src) : null) ?? {
        width: image.naturalWidth,
        height: image.naturalHeight,
      }
      if (!natural.width || !natural.height) return null
      const height = RASTER_HEIGHT
      const width = Math.min(MAX_RASTER_WIDTH, Math.max(1, Math.round((natural.width / natural.height) * height)))
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) return null
      context.drawImage(image, 0, 0, width, height)
      const pixels = context.getImageData(0, 0, width, height).data
      const bounds = inkBounds(pixels, width, height, { solidBackground: !svg })
      if (!bounds) return null
      const inkWidth = bounds.right - bounds.left + 1
      const inkHeight = bounds.bottom - bounds.top + 1
      let cleanSrc: string | null = null
      if (bounds.background) {
        const cropped = context.getImageData(bounds.left, bounds.top, inkWidth, inkHeight)
        clearBackground(cropped.data, bounds.background)
        const out = document.createElement("canvas")
        out.width = inkWidth
        out.height = inkHeight
        out.getContext("2d")?.putImageData(cropped, 0, 0)
        cleanSrc = out.toDataURL("image/png")
      }
      return {
        logo,
        ratio: inkWidth / inkHeight,
        tone: bounds.tone,
        readsOnDark: readsOnDark(pixels, width, bounds),
        crop: {
          x: bounds.left / width,
          y: bounds.top / height,
          width: inkWidth / width,
          height: inkHeight / height,
        },
        cleanSrc,
      }
    })().catch(() => null)
    cache.set(logo.src, pending)
  }
  return pending.then((analysis) => (analysis ? { ...analysis, logo } : null))
}
