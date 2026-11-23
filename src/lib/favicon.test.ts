import { describe, expect, it } from "vitest"

import { readableText } from "./branding.js"
import { faviconLetter, faviconPlans, type FaviconLogo } from "./favicon.js"
import type { LogoTone } from "./logo.js"

function measured(src: string, ratio: number, tone: LogoTone = "color", round = false): FaviconLogo {
  return { logo: { src }, ratio, tone, round }
}

const redmond = { name: "Redmond State University", main: "#c41230" }

describe("faviconPlans", () => {
  it("shows the full-color seal on a clear background in light mode", () => {
    const seal = measured("/seal.png", 1, "color", true)
    const { light } = faviconPlans(redmond, [measured("/one-line.png", 5.2), seal, measured("/stacked.png", 1.2)])
    expect(light).toEqual({ kind: "logo", logo: seal, backing: "none" })
  })

  it("switches to the school's white seal in dark mode, so the seal stays visible on a dark tab", () => {
    const seal = measured("/seal.png", 1, "color", true)
    const white = measured("/seal-white.png", 1, "white", true)
    const { light, dark } = faviconPlans(redmond, [white, seal])
    expect(light).toEqual({ kind: "logo", logo: seal, backing: "none" })
    expect(dark).toEqual({ kind: "logo", logo: white, backing: "none" })
  })

  it("puts a round logo on a white circle in dark mode when the school has no white version", () => {
    const seal = measured("/seal.png", 1, "color", true)
    expect(faviconPlans(redmond, [seal]).dark).toEqual({ kind: "logo", logo: seal, backing: "circle" })
  })

  it("puts a logo that is not round, such as a shield, on a white rounded square in dark mode", () => {
    const shield = measured("/shield.png", 0.85, "color", false)
    expect(faviconPlans(redmond, [shield]).dark).toEqual({ kind: "logo", logo: shield, backing: "square" })
  })

  it("prefers the full-color version over the black version of the same seal", () => {
    const color = measured("/seal.png", 1)
    expect(faviconPlans(redmond, [measured("/seal-black.png", 1, "black"), color]).light).toMatchObject({ logo: color })
  })

  it("shows a letter tile in both modes when every logo is wide, because a wide logo is unreadable at tab size", () => {
    const plans = faviconPlans(redmond, [measured("/one-line.png", 5.2), measured("/two-line.png", 2.4)])
    const tile = { kind: "letter", letter: "B", fill: "#c41230", text: readableText("#c41230") }
    expect(plans).toEqual({ light: tile, dark: tile })
  })

  it("never shows a white logo in light mode, because it disappears on a light tab", () => {
    const plans = faviconPlans(redmond, [measured("/seal-white.png", 1, "white", true)])
    expect(plans.light).toMatchObject({ kind: "letter" })
  })

  it("shows a letter tile when the school has no logo, with dark text on a light school color", () => {
    const { light } = faviconPlans({ name: "Wichita State University", main: "#FFCD00" }, [])
    expect(light).toEqual({ kind: "letter", letter: "W", fill: "#ffcd00", text: readableText("#ffcd00") })
    expect(readableText("#ffcd00")).not.toBe("#ffffff")
  })

  it("shows the CollegeVine mark in both modes in an app with no school brand", () => {
    expect(faviconPlans(undefined, [])).toEqual({ light: { kind: "mark" }, dark: { kind: "mark" } })
  })
})

describe("faviconLetter", () => {
  it("takes the first letter of the school name", () => {
    expect(faviconLetter("Northfield University")).toBe("D")
    expect(faviconLetter("Redmond State University")).toBe("B")
  })

  it("skips generic words, so that schools named after a place do not all get the same letter", () => {
    expect(faviconLetter("University of Florida")).toBe("F")
    expect(faviconLetter("The College of New Jersey")).toBe("N")
    expect(faviconLetter("College of the Holy Cross")).toBe("H")
  })

  it("falls back to the first letter when every word is generic", () => {
    expect(faviconLetter("The University")).toBe("T")
  })

  it("ignores punctuation and capitalizes the letter", () => {
    expect(faviconLetter("  st. olaf college")).toBe("S")
    expect(faviconLetter("Texas A&M University")).toBe("T")
  })
})
