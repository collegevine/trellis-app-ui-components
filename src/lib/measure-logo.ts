import type { SchoolLogo } from "../components/app-frame.js"
import type { FaviconLogo } from "./favicon.js"
import { clearBackground, inkBounds, isRound } from "./logo.js"

export interface Crop {
  x: number
  y: number
  width: number
  height: number
}

export interface LogoMeasurement extends FaviconLogo {
  crop: Crop
  cleanSrc: string | null
}

const RASTER_HEIGHT = 400
const MAX_RASTER_WIDTH = 8000
const cache = new Map<string, Promise<LogoMeasurement | null>>()

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

async function measure(logo: SchoolLogo): Promise<LogoMeasurement | null> {
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
    round: isRound(pixels, width, bounds),
    crop: {
      x: bounds.left / width,
      y: bounds.top / height,
      width: inkWidth / width,
      height: inkHeight / height,
    },
    cleanSrc,
  }
}

export function measureLogo(logo: SchoolLogo): Promise<LogoMeasurement | null> {
  const key = logo.src
  let pending = cache.get(key)
  if (!pending) {
    pending = measure(logo).catch(() => null)
    cache.set(key, pending)
  }
  return pending.then((m) => (m ? { ...m, logo } : null))
}
