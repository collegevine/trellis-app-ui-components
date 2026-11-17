import { describe, expect, it } from "vitest"

import {
  BRANDING_STEPS,
  defaultBrandingStep,
  frameColors,
  readableText,
  schoolTheme,
  selectedFill,
} from "./branding.js"
import { contrastRatio } from "./color.js"

describe("defaultBrandingStep", () => {
  it.each([
    ["Northfield blue", "#003da5", "tinted-frame"],
    ["Rollins navy", "#003d79", "tinted-frame"],
    ["Portland purple", "#1e1656", "tinted-frame"],
    ["Wayne State green", "#0c5449", "tinted-frame"],
    ["Emerson purple", "#5f249f", "tinted-frame"],
    ["Redmond red", "#c41230", "logo-only"],
    ["Michigan Tech gold", "#ffcd00", "logo-only"],
    ["Sweet Briar pink", "#ed2b74", "logo-only"],
    ["Pacific orange", "#ff671d", "logo-only"],
    ["UT Austin burnt orange", "#bf5700", "logo-only"],
    ["Marshall light green", "#00b140", "logo-only"],
  ])("picks the agreed step for %s", (_school, color, step) => {
    expect(defaultBrandingStep(color)).toBe(step)
  })

  it.each(["#000000", "#111111", "#808080", "#ffffff"])(
    "picks the tinted frame for black, gray and white (%s)",
    (color) => {
      expect(defaultBrandingStep(color)).toBe("tinted-frame")
    }
  )

  it("never picks the full-color frame", () => {
    for (let red = 0; red < 256; red += 51)
      for (let green = 0; green < 256; green += 51)
        for (let blue = 0; blue < 256; blue += 51) {
          const color = `#${[red, green, blue].map((v) => v.toString(16).padStart(2, "0")).join("")}`
          expect(defaultBrandingStep(color)).not.toBe("full-color-frame")
        }
  })

  it("accepts three-digit hex and no leading #", () => {
    expect(defaultBrandingStep("f00")).toBe("logo-only")
  })

  it("rejects a value that is not a hex color", () => {
    expect(() => defaultBrandingStep("navy")).toThrow(/hex color/)
  })
})

describe("color values in the output", () => {
  it("writes every school color as a six-digit hex value that CSS accepts", () => {
    expect(frameColors("F00", "full-color-frame").frame).toBe("#ff0000")
    expect(schoolTheme({ main: "F00", second: "0a0" })["--school-selected"]).toBe("#00aa00")
    expect(schoolTheme({ main: "F00" })["--school-main"]).toBe("#ff0000")
  })
})

describe("BRANDING_STEPS", () => {
  it("orders the steps from least to most school color", () => {
    expect(BRANDING_STEPS).toEqual(["logo-only", "tinted-frame", "full-color-frame"])
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

describe("frameColors", () => {
  it("draws the full-color frame in the main color, around a white page", () => {
    const colors = frameColors("#c41230", "full-color-frame")
    expect(colors.frame).toBe("#c41230")
    expect(colors.frameText).toBe("#ffffff")
    expect(colors.page).toBe("#ffffff")
    expect(colors.logo).toBe("white")
  })

  it("fills the selected nav item in the full-color frame with a light tint and dark text", () => {
    const colors = frameColors("#c41230", "full-color-frame")
    expect(colors.navSelected).toBe("color-mix(in srgb, #c41230 8%, #ffffff)")
    expect(colors.navSelectedText).toBe("#111111")
  })

  it("puts dark text on a full-color frame in a light color", () => {
    const colors = frameColors("#ffcd00", "full-color-frame")
    expect(colors.frameText).toBe("#111111")
    expect(colors.logo).toBe("black")
  })

  it("tints the frame at the tinted step, around a white page", () => {
    const colors = frameColors("#003da5", "tinted-frame")
    expect(colors.frame).toBe("color-mix(in srgb, #003da5 10%, #ffffff)")
    expect(colors.page).toBe("#ffffff")
    expect(colors.frameText).toBe("#111111")
    expect(colors.logo).toBe("original")
  })

  it("draws a gray frame with no school color around a white page at the logo-only step", () => {
    const colors = frameColors("#c41230", "logo-only")
    expect(colors.frame).toBe("#ebebeb")
    expect(colors.page).toBe("#ffffff")
    expect(JSON.stringify(colors)).not.toContain("#c41230")
  })

  it.each(["tinted-frame", "logo-only"] as const)(
    "fills the selected nav item at the %s step with the frame darkened by 8%%, and hover by 4%%",
    (step) => {
      const colors = frameColors("#003da5", step)
      expect(colors.navSelected).toBe(`color-mix(in oklab, ${colors.frame}, #000000 8%)`)
      expect(colors.navHover).toBe(`color-mix(in oklab, ${colors.frame}, #000000 4%)`)
    }
  )
})
