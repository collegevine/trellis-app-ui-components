import { describe, expect, it } from "vitest"

import type { LogoAnalysis, LogoTone } from "./analyze-logo.js"
import { logoSize, pickLogo, type LogoSpace } from "./logo.js"

const topEdge: LogoSpace = { area: 28 * 28 * 5, minHeight: 16, maxHeight: 36, maxWidth: 240 }

function analysis(src: string, ratio: number, tone: LogoTone = "color"): LogoAnalysis {
  return { logo: { src }, ratio, tone, readsOnDark: false, crop: { x: 0, y: 0, width: 1, height: 1 }, cleanSrc: null }
}

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
  const oneLine = analysis("/brand/one-line.svg", 8)
  const veryWide = analysis("/brand/very-wide.svg", 22)
  const stacked = analysis("/brand/stacked.svg", 3.7)
  const white = analysis("/brand/white.svg", 8, "white")
  const black = analysis("/brand/black.svg", 8, "black")

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
