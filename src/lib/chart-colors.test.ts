import { describe, expect, it } from "vitest"

import { chartColors } from "./chart-colors.js"
import { contrastRatio, toOklch } from "./color.js"

const hueGap = (first: number, second: number) => {
  const gap = Math.abs(first - second) % 360
  return Math.min(gap, 360 - gap)
}

describe("chartColors", () => {
  it("opens with the primary color, then the secondary color", () => {
    const colors = chartColors({ primaryColor: "#c41230", secondaryColor: "#0b5394" })
    expect(colors.slice(0, 2)).toEqual(["#c41230", "#0b5394"])
  })

  it("fills five series", () => {
    expect(chartColors({ primaryColor: "#c41230", secondaryColor: "#0b5394" })).toHaveLength(5)
  })

  it("gives the same colors every time", () => {
    expect(chartColors({ primaryColor: "#5f249f" })).toEqual(chartColors({ primaryColor: "#5f249f" }))
  })

  it("keeps a yellow primary color that reaches 1.5:1 with the chart", () => {
    expect(chartColors({ primaryColor: "#ffcd00" })[0]).toBe("#ffcd00")
  })

  it("leaves out a secondary color that people cannot tell from the primary color", () => {
    const colors = chartColors({ primaryColor: "#c41230", secondaryColor: "#b3082d" })
    expect(colors[0]).toBe("#c41230")
    expect(colors).not.toContain("#b3082d")
  })

  it("moves the secondary color first when the primary color looks gray", () => {
    expect(chartColors({ primaryColor: "#333333", secondaryColor: "#0b5394" })[0]).toBe("#0b5394")
  })

  it.each(["#333333", "#000000", "#fff8dc"])(
    "returns no colors when no school color passes (%s)",
    (primaryColor) => {
      expect(chartColors({ primaryColor })).toEqual([])
    }
  )

  it.each([
    { primaryColor: "#c41230", secondaryColor: "#0b5394" },
    { primaryColor: "#ffcd00", secondaryColor: "#000000" },
    { primaryColor: "#00b140" },
    { primaryColor: "#5f249f", secondaryColor: "#331467" },
  ])("generates colors with 3:1 contrast, away from the school hues and out of yellow (%o)", (school) => {
    const schoolHues = [school.primaryColor, school.secondaryColor]
      .filter((color): color is string => color !== undefined)
      .map(toOklch)
      .filter((tone) => tone.c >= 0.05)
      .map((tone) => tone.h)
    const generated = chartColors(school).filter((color) => color !== school.primaryColor && color !== school.secondaryColor)
    expect(generated.length).toBeGreaterThan(0)
    for (const color of generated) {
      expect(contrastRatio(color, "#ffffff")).toBeGreaterThanOrEqual(3)
      const hue = toOklch(color).h
      expect(hue >= 95 && hue <= 135).toBe(false)
      for (const schoolHue of schoolHues) expect(hueGap(hue, schoolHue)).toBeGreaterThanOrEqual(29)
    }
  })
})
