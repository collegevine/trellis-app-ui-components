import { describe, expect, it } from "vitest"

import { faviconPlan } from "./favicon.js"
import type { LogoTone, MeasuredLogo } from "./logo.js"

function measured(src: string, ratio: number, tone: LogoTone = "color"): MeasuredLogo {
  return { logo: { src }, ratio, tone }
}

const mark = { kind: "mark" }

describe("faviconPlan", () => {
  it("shows the full-color seal when a school has a seal and wider logos", () => {
    const seal = measured("/seal.png", 1)
    expect(faviconPlan([measured("/one-line.png", 5.2), seal, measured("/stacked.png", 1.2)])).toEqual({ kind: "logo", logo: seal })
  })

  it("prefers the full-color version over the black version of the same seal", () => {
    const color = measured("/seal.png", 1)
    expect(faviconPlan([measured("/seal-black.png", 1, "black"), color])).toEqual({ kind: "logo", logo: color })
  })

  it("shows the CollegeVine mark when every logo is wide, because a wide logo is unreadable at tab size", () => {
    expect(faviconPlan([measured("/one-line.png", 5.2), measured("/two-line.png", 2.4)])).toEqual(mark)
  })

  it("never shows a white logo, because it disappears on a light tab", () => {
    expect(faviconPlan([measured("/seal-white.png", 1, "white")])).toEqual(mark)
  })

  it("shows the CollegeVine mark when the school has no logo, or the app has no school brand", () => {
    expect(faviconPlan([])).toEqual(mark)
  })
})
