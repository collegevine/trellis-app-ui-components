import { describe, expect, it } from "vitest"

import type { LogoAnalysis, LogoTone } from "./analyze-logo.js"
import { faviconPlan } from "./favicon.js"

function analysis(src: string, ratio: number, tone: LogoTone = "color"): LogoAnalysis {
  return { logo: { src }, ratio, tone, crop: { x: 0, y: 0, width: 1, height: 1 }, cleanSrc: null }
}

const mark = { kind: "mark" }

describe("faviconPlan", () => {
  it("shows the full-color seal when a school has a seal and wider logos", () => {
    const seal = analysis("/seal.png", 1)
    expect(faviconPlan([analysis("/one-line.png", 5.2), seal, analysis("/stacked.png", 1.2)])).toEqual({ kind: "logo", logo: seal })
  })

  it("prefers the full-color version over the black version of the same seal", () => {
    const color = analysis("/seal.png", 1)
    expect(faviconPlan([analysis("/seal-black.png", 1, "black"), color])).toEqual({ kind: "logo", logo: color })
  })

  it("shows the CollegeVine mark when every logo is wide, because a wide logo is unreadable at tab size", () => {
    expect(faviconPlan([analysis("/one-line.png", 5.2), analysis("/two-line.png", 2.4)])).toEqual(mark)
  })

  it("never shows a white logo, because it disappears on a light tab", () => {
    expect(faviconPlan([analysis("/seal-white.png", 1, "white")])).toEqual(mark)
  })

  it("shows the CollegeVine mark when the school has no logo, or the app has no school brand", () => {
    expect(faviconPlan([])).toEqual(mark)
  })
})
