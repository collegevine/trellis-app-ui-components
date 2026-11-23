import { describe, expect, it } from "vitest"

import { inkBounds, isRound, logoSize, pickLogo, type LogoSpace, type LogoTone, type MeasuredLogo } from "./logo.js"

type Rgba = [number, number, number, number]

const CLEAR: Rgba = [0, 0, 0, 0]
const NAVY: Rgba = [20, 30, 70, 255]
const PAPER: Rgba = [255, 255, 255, 255]
const RED: Rgba = [196, 18, 48, 255]
const BLACK: Rgba = [12, 12, 14, 255]

function image(width: number, height: number, fill: Rgba, ink: Rgba, box: [number, number, number, number]) {
  const pixels = new Uint8ClampedArray(width * height * 4)
  const [left, top, right, bottom] = box
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = x >= left && x <= right && y >= top && y <= bottom ? ink : fill
      pixels.set(color, (y * width + x) * 4)
    }
  }
  return pixels
}

const topEdge: LogoSpace = { area: 28 * 28 * 5, minHeight: 16, maxHeight: 36, maxWidth: 240 }

function measured(src: string, ratio: number, tone: LogoTone = "color"): MeasuredLogo {
  return { logo: { src }, ratio, tone }
}

describe("inkBounds", () => {
  it("finds the edges of the logo inside the empty space of a clear file", () => {
    const bounds = inkBounds(image(100, 40, CLEAR, RED, [10, 12, 89, 27]), 100, 40, { solidBackground: false })
    expect(bounds).toMatchObject({ left: 10, top: 12, right: 89, bottom: 27, background: null })
  })

  it("treats a solid background around the logo as empty space", () => {
    const bounds = inkBounds(image(100, 40, PAPER, NAVY, [20, 5, 79, 34]), 100, 40, { solidBackground: true })
    expect(bounds).toMatchObject({ left: 20, top: 5, right: 79, bottom: 34, background: [255, 255, 255] })
  })

  it("keeps ink that touches the corner of a vector file", () => {
    const bounds = inkBounds(image(100, 40, CLEAR, RED, [0, 0, 99, 39]), 100, 40, { solidBackground: false })
    expect(bounds).toMatchObject({ left: 0, top: 0, right: 99, bottom: 39 })
  })

  it("marks a logo drawn in white", () => {
    const white = inkBounds(image(60, 20, NAVY, PAPER, [5, 5, 54, 14]), 60, 20, { solidBackground: true })
    const red = inkBounds(image(60, 20, CLEAR, RED, [5, 5, 54, 14]), 60, 20, { solidBackground: false })
    expect(white?.tone).toBe("white")
    expect(red?.tone).toBe("color")
  })

  it("marks a white logo whose soft edges blend into a dark background", () => {
    const pixels = image(60, 20, NAVY, [140, 143, 160, 255], [5, 5, 54, 14])
    for (let y = 7; y <= 12; y++) {
      for (let x = 7; x <= 52; x++) pixels.set(PAPER, (y * 60 + x) * 4)
    }
    expect(inkBounds(pixels, 60, 20, { solidBackground: true })?.tone).toBe("white")
  })

  it("does not mark a colored logo with white parts as white", () => {
    const pixels = image(60, 20, CLEAR, RED, [5, 5, 54, 14])
    for (let y = 5; y <= 7; y++) {
      for (let x = 5; x <= 54; x++) pixels.set(PAPER, (y * 60 + x) * 4)
    }
    expect(inkBounds(pixels, 60, 20, { solidBackground: false })?.tone).toBe("color")
  })

  it("marks a logo drawn in black", () => {
    expect(inkBounds(image(60, 20, CLEAR, BLACK, [5, 5, 54, 14]), 60, 20, { solidBackground: false })?.tone).toBe("black")
  })

  it("finds nothing in an empty file", () => {
    expect(inkBounds(image(10, 10, CLEAR, CLEAR, [0, 0, 9, 9]), 10, 10, { solidBackground: false })).toBeNull()
  })
})

describe("logoSize", () => {
  it("gives a wide logo and a compact logo about the same area", () => {
    const wide = logoSize(8, topEdge)
    const compact = logoSize(4, topEdge)
    expect(wide.height).toBeLessThan(compact.height)
    expect(Math.abs(wide.width * wide.height - compact.width * compact.height)).toBeLessThan(topEdge.area * 0.05)
  })

  it("keeps a square logo within the tallest size of the space", () => {
    expect(logoSize(1, topEdge).height).toBe(topEdge.maxHeight)
  })

  it("shrinks a very wide logo to the width of the space and marks it as too small to read", () => {
    const size = logoSize(22, topEdge)
    expect(size.width).toBeLessThanOrEqual(topEdge.maxWidth)
    expect(size.height).toBeLessThan(topEdge.minHeight)
    expect(size.fits).toBe(false)
  })

  it("fits a logo that reaches its area within the height and width of the space", () => {
    expect(logoSize(8, topEdge).fits).toBe(true)
  })
})

describe("pickLogo", () => {
  const oneLine = measured("/brand/one-line.svg", 8)
  const veryWide = measured("/brand/very-wide.svg", 22)
  const stacked = measured("/brand/stacked.svg", 3.7)
  const white = measured("/brand/white.svg", 8, "white")
  const black = measured("/brand/black.svg", 8, "black")

  it("keeps the one-line logo when it fits", () => {
    expect(pickLogo([stacked, oneLine], topEdge, "original")?.logo.src).toBe("/brand/one-line.svg")
  })

  it("switches to the stacked logo when the one-line logo is too wide to read", () => {
    expect(pickLogo([veryWide, stacked], topEdge, "original")?.logo.src).toBe("/brand/stacked.svg")
  })

  it("switches to the stacked logo in a narrow space", () => {
    const narrow: LogoSpace = { ...topEdge, maxWidth: 120 }
    expect(pickLogo([oneLine, stacked], narrow, "original")?.logo.src).toBe("/brand/stacked.svg")
  })

  it("shows the only logo even when it does not fit", () => {
    expect(pickLogo([veryWide], topEdge, "original")?.logo.src).toBe("/brand/very-wide.svg")
  })

  it("shows the white logo on the full-color frame and leaves it out elsewhere", () => {
    expect(pickLogo([oneLine, white], topEdge, "white")).toMatchObject({ logo: { src: "/brand/white.svg" }, recolor: false })
    expect(pickLogo([white, oneLine], topEdge, "original")?.logo.src).toBe("/brand/one-line.svg")
  })

  it("recolors a full-color logo when the school gives no white logo", () => {
    expect(pickLogo([oneLine], topEdge, "white")).toMatchObject({ logo: { src: "/brand/one-line.svg" }, recolor: true })
  })

  it("recolors a white logo on a light frame when the school gives no other logo", () => {
    expect(pickLogo([white], topEdge, "original")).toMatchObject({ logo: { src: "/brand/white.svg" }, recolor: true })
  })

  it("shows the black logo on a full-color frame in a light school color", () => {
    expect(pickLogo([oneLine, black], topEdge, "black")).toMatchObject({ logo: { src: "/brand/black.svg" }, recolor: false })
  })

  it("recolors a full-color logo black when the school gives no black logo", () => {
    expect(pickLogo([oneLine, white], topEdge, "black")).toMatchObject({ logo: { src: "/brand/one-line.svg" }, recolor: true })
  })

  it("prefers the full-color logo to the black logo on a light frame", () => {
    expect(pickLogo([black, oneLine], topEdge, "original")?.logo.src).toBe("/brand/one-line.svg")
  })

  it("picks nothing from no logos", () => {
    expect(pickLogo([], topEdge, "original")).toBeNull()
  })
})

function shape(size: number, fill: Rgba, ink: Rgba, inside: (x: number, y: number) => boolean) {
  const pixels = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) pixels.set(inside(x + 0.5, y + 0.5) ? ink : fill, (y * size + x) * 4)
  }
  return pixels
}

function roundness(pixels: Uint8ClampedArray, size: number, solidBackground = false) {
  const bounds = inkBounds(pixels, size, size, { solidBackground })
  if (!bounds) throw new Error("expected ink")
  return isRound(pixels, size, bounds)
}

describe("isRound", () => {
  const size = 80
  const circle = (x: number, y: number) => Math.hypot(x - size / 2, y - size / 2) <= size / 2
  const ring = (x: number, y: number) => {
    const d = Math.hypot(x - size / 2, y - size / 2)
    return d <= size / 2 && d >= size / 2 - 6
  }
  const shield = (x: number, y: number) => y <= size / 2 || Math.hypot(x - size / 2, y - size / 2) <= size / 2

  it("finds a round seal, so that dark mode puts it on a white circle", () => {
    expect(roundness(shape(size, CLEAR, RED, circle), size)).toBe(true)
    expect(roundness(shape(size, CLEAR, NAVY, ring), size)).toBe(true)
  })

  it("finds a round seal on a solid background", () => {
    expect(roundness(shape(size, PAPER, NAVY, circle), size, true)).toBe(true)
  })

  it("does not call a square logo or a shield round", () => {
    expect(roundness(shape(size, CLEAR, RED, () => true), size)).toBe(false)
    expect(roundness(shape(size, CLEAR, RED, shield), size)).toBe(false)
  })
})
