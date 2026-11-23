import type { FaviconBacking, FaviconPlan } from "./favicon.js"
import { loadImage, type LogoMeasurement } from "./measure-logo.js"

const ICON_SIZE = 64
const TILE_RADIUS = 12
const SQUARE_INSET = 6
const BACKING_COLOR = "#ffffff"
const LETTER_FONT = "700 40px Roboto, system-ui, sans-serif"
const MARK_BOUNDS = { x: 70, y: 60, width: 148, height: 169 }
const MARK_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_BOUNDS.x} ${MARK_BOUNDS.y} ${MARK_BOUNDS.width} ${MARK_BOUNDS.height}">` +
  `<path fill-rule="evenodd" clip-rule="evenodd" d="M151.015 62.6517C146.674 60.1161 141.326 60.1161 136.984 62.6517L77.1971 97.5569C72.8556 100.093 70.1816 104.776 70.1816 109.844V179.655C70.1816 184.723 72.8556 189.406 77.1971 191.942L136.984 226.847C138.31 227.62 139.73 228.161 141.186 228.463C142.332 228.698 143.5 228.79 144.663 228.734L144.524 202.417C144.497 197.293 147.203 192.554 151.604 190.016L176.331 175.758L176.483 204.542C176.502 208.1 175.202 211.473 172.931 214.053L210.803 191.942C215.143 189.406 217.818 184.723 217.818 179.655V109.844C217.818 104.776 215.143 100.093 210.803 97.5569L151.015 62.6517ZM112.668 138.858L137.395 153.118C141.796 155.657 144.502 160.395 144.475 165.519L144.324 194.303L119.596 180.043C115.196 177.507 112.49 172.766 112.516 167.642L112.668 138.858ZM176.483 130.747L176.331 101.963L151.604 116.221C147.203 118.759 144.497 123.498 144.524 128.621L144.676 157.405L169.402 143.145C173.804 140.609 176.51 135.868 176.483 130.747Z" fill="#9E9E9E"/>` +
  `</svg>`
const MARK_SRC = `data:image/svg+xml,${encodeURIComponent(MARK_SVG)}`

type Box = { x: number; y: number; width: number; height: number }

function canvas() {
  const element = document.createElement("canvas")
  element.width = ICON_SIZE
  element.height = ICON_SIZE
  const context = element.getContext("2d")
  return context ? { element, context } : null
}

function fitted(ratio: number, size: number): Box {
  const width = ratio >= 1 ? size : size * ratio
  const height = ratio >= 1 ? size / ratio : size
  return { x: (ICON_SIZE - width) / 2, y: (ICON_SIZE - height) / 2, width, height }
}

function drawBacking(context: CanvasRenderingContext2D, backing: FaviconBacking) {
  if (backing === "none") return
  context.fillStyle = BACKING_COLOR
  context.beginPath()
  if (backing === "circle") context.arc(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2, 0, Math.PI * 2)
  else context.roundRect(0, 0, ICON_SIZE, ICON_SIZE, TILE_RADIUS)
  context.fill()
}

async function drawLogo(context: CanvasRenderingContext2D, logo: LogoMeasurement, backing: FaviconBacking) {
  const image = await loadImage(logo.cleanSrc ?? logo.logo.src)
  const crop = logo.cleanSrc ? { x: 0, y: 0, width: 1, height: 1 } : logo.crop
  const ink = fitted(logo.ratio, backing === "square" ? ICON_SIZE - 2 * SQUARE_INSET : ICON_SIZE)
  const width = ink.width / crop.width
  const height = ink.height / crop.height
  drawBacking(context, backing)
  context.drawImage(image, ink.x - crop.x * width, ink.y - crop.y * height, width, height)
}

async function drawLetter(context: CanvasRenderingContext2D, letter: string, fill: string, text: string) {
  await document.fonts?.ready
  await document.fonts?.load(LETTER_FONT, letter)
  context.fillStyle = fill
  context.beginPath()
  context.roundRect(0, 0, ICON_SIZE, ICON_SIZE, TILE_RADIUS)
  context.fill()
  context.fillStyle = text
  context.font = LETTER_FONT
  context.textAlign = "center"
  context.textBaseline = "alphabetic"
  const { actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent } = context.measureText(letter)
  context.fillText(letter, ICON_SIZE / 2, (ICON_SIZE + ascent - descent) / 2)
}

async function drawMark(context: CanvasRenderingContext2D) {
  const image = await loadImage(MARK_SRC)
  const box = fitted(MARK_BOUNDS.width / MARK_BOUNDS.height, ICON_SIZE)
  context.drawImage(image, box.x, box.y, box.width, box.height)
}

export async function drawFavicon(plan: FaviconPlan<LogoMeasurement>): Promise<string | null> {
  const target = canvas()
  if (!target) return null
  try {
    if (plan.kind === "logo") await drawLogo(target.context, plan.logo, plan.backing)
    else if (plan.kind === "letter") await drawLetter(target.context, plan.letter, plan.fill, plan.text)
    else await drawMark(target.context)
    return target.element.toDataURL("image/png")
  } catch {
    return null
  }
}
