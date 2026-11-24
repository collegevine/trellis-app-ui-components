import type { SchoolLogo } from "../components/app-frame.js"

export interface InkBounds {
  left: number
  top: number
  right: number
  bottom: number
  background: [number, number, number] | null
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
  crop: Crop
}

const CLEAR_ALPHA = 12
const BACKGROUND_DISTANCE = 36
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

function isSvg(src: string) {
  return /\.svg(?:[?#]|$)/i.test(src) || src.startsWith("data:image/svg")
}

function loadImage(src: string) {
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
      return {
        logo,
        ratio: inkWidth / inkHeight,
        crop: {
          x: bounds.left / width,
          y: bounds.top / height,
          width: inkWidth / width,
          height: inkHeight / height,
        },
      }
    })().catch(() => null)
    cache.set(logo.src, pending)
  }
  return pending.then((analysis) => (analysis ? { ...analysis, logo } : null))
}
