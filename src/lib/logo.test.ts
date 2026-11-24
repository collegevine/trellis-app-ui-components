import { describe, expect, it } from "vitest"

import { logoSize, type LogoSpace } from "./logo.js"

const topEdge: LogoSpace = { area: 28 * 28 * 5, minHeight: 16, maxHeight: 36, maxWidth: 240 }

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
