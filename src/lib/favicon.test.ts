import { describe, expect, it } from "vitest"

import { faviconPlans, type FaviconLogo } from "./favicon.js"
import type { LogoTone } from "./logo.js"

function measured(src: string, ratio: number, tone: LogoTone = "color", round = false): FaviconLogo {
  return { logo: { src }, ratio, tone, round }
}

const mark = { light: { kind: "mark" }, dark: { kind: "mark" } }

describe("faviconPlans", () => {
  it("shows the full-color seal on a clear background in light mode", () => {
    const seal = measured("/seal.png", 1, "color", true)
    const { light } = faviconPlans([measured("/one-line.png", 5.2), seal, measured("/stacked.png", 1.2)])
    expect(light).toEqual({ kind: "logo", logo: seal, backing: "none" })
  })

  it("switches to the school's white seal in dark mode, so the seal stays visible on a dark tab", () => {
    const seal = measured("/seal.png", 1, "color", true)
    const white = measured("/seal-white.png", 1, "white", true)
    const { light, dark } = faviconPlans([white, seal])
    expect(light).toEqual({ kind: "logo", logo: seal, backing: "none" })
    expect(dark).toEqual({ kind: "logo", logo: white, backing: "none" })
  })

  it("puts a round logo on a white circle in dark mode when the school has no white version", () => {
    const seal = measured("/seal.png", 1, "color", true)
    expect(faviconPlans([seal]).dark).toEqual({ kind: "logo", logo: seal, backing: "circle" })
  })

  it("puts a logo that is not round, such as a shield, on a white rounded square in dark mode", () => {
    const shield = measured("/shield.png", 0.85, "color", false)
    expect(faviconPlans([shield]).dark).toEqual({ kind: "logo", logo: shield, backing: "square" })
  })

  it("prefers the full-color version over the black version of the same seal", () => {
    const color = measured("/seal.png", 1)
    expect(faviconPlans([measured("/seal-black.png", 1, "black"), color]).light).toMatchObject({ logo: color })
  })

  it("shows the CollegeVine mark when every logo is wide, because a wide logo is unreadable at tab size", () => {
    expect(faviconPlans([measured("/one-line.png", 5.2), measured("/two-line.png", 2.4)])).toEqual(mark)
  })

  it("never shows a white logo in light mode, because it disappears on a light tab", () => {
    expect(faviconPlans([measured("/seal-white.png", 1, "white", true)])).toEqual(mark)
  })

  it("shows the CollegeVine mark when the school has no logo, or the app has no school brand", () => {
    expect(faviconPlans([])).toEqual(mark)
  })
})
