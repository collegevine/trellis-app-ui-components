import { describe, expect, it } from "vitest"

import type { LogoAnalysis, LogoTone } from "./analyze-logo.js"
import { faviconPlans } from "./favicon.js"

function analysis(
  src: string,
  ratio: number,
  tone: LogoTone = "color",
  readsOnDark = false,
  background?: "light" | "dark"
): LogoAnalysis {
  return {
    logo: background ? { src, background } : { src },
    ratio,
    tone,
    readsOnDark,
    crop: { x: 0, y: 0, width: 1, height: 1 },
    cleanSrc: null,
  }
}

const mark = { light: { kind: "mark" }, dark: { kind: "mark" } }

describe("faviconPlans", () => {
  it("shows the full-color seal in light mode", () => {
    const seal = analysis("/seal.png", 1)
    const { light } = faviconPlans([analysis("/one-line.png", 5.2), seal, analysis("/stacked.png", 1.2)])
    expect(light).toEqual({ kind: "logo", logo: seal })
  })

  it("switches to the school's white seal in dark mode, so the seal stays visible on a dark tab", () => {
    const seal = analysis("/seal.png", 1)
    const white = analysis("/seal-white.png", 1, "white", true)
    const { light, dark } = faviconPlans([white, seal])
    expect(light).toEqual({ kind: "logo", logo: seal })
    expect(dark).toEqual({ kind: "logo", logo: white })
  })

  it("keeps the school's regular logo, unchanged, in dark mode when the school has no version for dark backgrounds", () => {
    const shield = analysis("/shield.png", 0.85)
    expect(faviconPlans([shield]).dark).toEqual({ kind: "logo", logo: shield })
  })

  it("prefers the full-color version over the black version of the same seal", () => {
    const color = analysis("/seal.png", 1)
    expect(faviconPlans([analysis("/seal-black.png", 1, "black"), color]).light).toMatchObject({ logo: color })
  })

  it("shows the CollegeVine mark when every logo is wide, because a wide logo is unreadable at tab size", () => {
    expect(faviconPlans([analysis("/one-line.png", 5.2), analysis("/two-line.png", 2.4)])).toEqual(mark)
  })

  it("never shows a white logo in light mode, because it disappears on a light tab", () => {
    expect(faviconPlans([analysis("/seal-white.png", 1, "white", true)]).light).toEqual({ kind: "mark" })
  })

  it("shows the CollegeVine mark when the school has no logo, or the app has no school brand", () => {
    expect(faviconPlans([])).toEqual(mark)
  })

  it("uses the logo that the school made for dark backgrounds in dark mode, even when it is not white", () => {
    const light = analysis("/seal-light.png", 1, "color", false, "light")
    const gold = analysis("/seal-gold.png", 1, "color", true, "dark")
    const { light: lightMode, dark } = faviconPlans([gold, light])
    expect(lightMode).toEqual({ kind: "logo", logo: light })
    expect(dark).toEqual({ kind: "logo", logo: gold })
  })

  it("skips a logo in the dark-background slot that a dark tab would hide, such as navy text", () => {
    const light = analysis("/mark-light.png", 1, "color", false, "light")
    const navy = analysis("/mark-navy.png", 1, "color", false, "dark")
    expect(faviconPlans([light, navy]).dark).toEqual({ kind: "logo", logo: light })
  })

  it("shows the school's white logo in dark mode when it has no other about-square logo", () => {
    const white = analysis("/seal-white.png", 1, "white", true, "dark")
    expect(faviconPlans([white])).toEqual({ light: { kind: "mark" }, dark: { kind: "logo", logo: white } })
  })
})
