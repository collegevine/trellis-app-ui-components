import { describe, expect, it } from "vitest"

import {
  readableText,
  schoolTheme,
  selectedFill,
} from "./branding.js"
import { contrastRatio } from "./color.js"

describe("color values in the output", () => {
  it("writes every school color as a six-digit hex value that CSS accepts", () => {
    expect(schoolTheme({ primaryColor: "F00" })["--school-selected"]).toBe("#ff0000")
    expect(schoolTheme({ primaryColor: "F00" })["--school-main"]).toBe("#ff0000")
  })
})

describe("readableText", () => {
  it.each(["#003da5", "#c41230", "#ffcd00", "#00b140", "#ff671d", "#ebebeb", "#5f249f"])(
    "gives text with at least 4.5:1 contrast on %s",
    (fill) => {
      expect(contrastRatio(fill, readableText(fill))).toBeGreaterThanOrEqual(4.5)
    }
  )

  it("puts white text on navy and dark text on gold", () => {
    expect(readableText("#003d79")).toBe("#ffffff")
    expect(readableText("#ffcd00")).toBe("#111111")
  })
})

describe("selectedFill", () => {
  it("fills selected controls with the school's primary color", () => {
    expect(selectedFill({ primaryColor: "#003da5" })).toEqual({ fill: "#003da5", text: "#ffffff" })
  })

  it("picks dark text on a light primary color that still passes", () => {
    expect(selectedFill({ primaryColor: "#ed2b74" })).toEqual({ fill: "#ed2b74", text: "#111111" })
  })

  it.each(["#ffffff", "#ffcd00", "#00b140", "#ff671d"])(
    "keeps the neutral look when the primary color has less than 3:1 contrast with the page (%s)",
    (primaryColor) => {
      expect(selectedFill({ primaryColor })).toBeNull()
    }
  )
})

describe("schoolTheme", () => {
  it("sets the primary color, its text and the selected fill", () => {
    const theme = schoolTheme({ primaryColor: "#003da5" })
    expect(theme["--school-main"]).toBe("#003da5")
    expect(theme["--school-main-foreground"]).toBe("#ffffff")
    expect(theme["--school-selected"]).toBe("#003da5")
    expect(theme["--school-selected-foreground"]).toBe("#ffffff")
  })

  it("leaves out the selected fill when selected controls stay neutral", () => {
    const theme = schoolTheme({ primaryColor: "#ffffff" })
    expect(theme).not.toHaveProperty("--school-selected")
    expect(theme).not.toHaveProperty("--school-selected-foreground")
  })

  it("replaces the warm neutrals with neutrals that have no hue", () => {
    const theme = schoolTheme({ primaryColor: "#003da5" })
    for (const name of ["--background", "--muted", "--secondary", "--border", "--input"]) {
      const value = theme[name]
      expect(value, name).toMatch(/^#([0-9a-f]{2})\1\1$/)
    }
  })

  it("leaves buttons, the error red, the focus outline and the radius alone", () => {
    const theme = schoolTheme({ primaryColor: "#c41230" })
    for (const name of ["--primary", "--primary-foreground", "--destructive", "--ring", "--radius"]) {
      expect(theme).not.toHaveProperty(name)
    }
  })
})
