import { describe, expect, it } from "vitest"

import {
  readableText,
  schoolTheme,
  selectedFill,
} from "./branding.js"
import { contrastRatio } from "./color.js"

describe("color values in the output", () => {
  it("writes every school color as a six-digit hex value that CSS accepts", () => {
    expect(schoolTheme({ main: "F00", second: "0a0" })["--school-selected"]).toBe("#00aa00")
    expect(schoolTheme({ main: "F00" })["--school-main"]).toBe("#ff0000")
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
  it("fills selected controls with the second school color", () => {
    expect(selectedFill({ main: "#003da5", second: "#e4002b" })).toEqual({
      fill: "#e4002b",
      text: "#ffffff",
    })
  })

  it("picks dark text on a light second color", () => {
    expect(selectedFill({ main: "#1e1656", second: "#ffcd00" })?.text).toBe("#111111")
  })

  it.each(["#000000", "#0f0f0f", "#2d2926", "#333f48"])(
    "uses the main color when the second color is black or a dark gray (%s)",
    (second) => {
      expect(selectedFill({ main: "#ff671d", second })?.fill).toBe("#ff671d")
    }
  )

  it("keeps a dark navy second color, which does not look like a button", () => {
    expect(selectedFill({ main: "#ffcd00", second: "#0c2340" })?.fill).toBe("#0c2340")
  })

  it.each([undefined, "#ffffff", "#fdfdfd"])(
    "keeps the neutral look with no second color or a white one (%s)",
    (second) => {
      expect(selectedFill({ main: "#003da5", second })).toBeNull()
    }
  )
})

describe("schoolTheme", () => {
  it("sets the main color, its text and the selected fill", () => {
    const theme = schoolTheme({ main: "#003da5", second: "#e4002b" })
    expect(theme["--school-main"]).toBe("#003da5")
    expect(theme["--school-main-foreground"]).toBe("#ffffff")
    expect(theme["--school-selected"]).toBe("#e4002b")
    expect(theme["--school-selected-foreground"]).toBe("#ffffff")
  })

  it("leaves out the selected fill when selected controls stay neutral", () => {
    const theme = schoolTheme({ main: "#003da5" })
    expect(theme).not.toHaveProperty("--school-selected")
    expect(theme).not.toHaveProperty("--school-selected-foreground")
  })

  it("replaces the warm neutrals with neutrals that have no hue", () => {
    const theme = schoolTheme({ main: "#003da5" })
    for (const name of ["--background", "--muted", "--secondary", "--border", "--input"]) {
      const value = theme[name]
      expect(value, name).toMatch(/^#([0-9a-f]{2})\1\1$/)
    }
  })

  it("leaves buttons, the error red, the focus outline and the radius alone", () => {
    const theme = schoolTheme({ main: "#c41230", second: "#000000" })
    for (const name of ["--primary", "--primary-foreground", "--destructive", "--ring", "--radius"]) {
      expect(theme).not.toHaveProperty(name)
    }
  })
})
