import { describe, expect, it } from "vitest"

import { inkBounds } from "./analyze-logo.js"

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
