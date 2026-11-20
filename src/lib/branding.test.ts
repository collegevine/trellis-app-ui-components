import { describe, expect, it } from "vitest"

import {
  type AppAudience,
  BRANDING_STEPS,
  defaultBrandingStep,
  frameColors,
  plainPageColor,
  readableText,
  schoolTheme,
  selectedFill,
} from "./branding.js"
import { contrastRatio, type Oklch, toOklch } from "./color.js"

describe("defaultBrandingStep", () => {
  it("starts an app for non-staff at the tinted frame", () => {
    expect(defaultBrandingStep("non-staff")).toBe("medium")
  })

  it("starts an app for staff at the neutral frame", () => {
    expect(defaultBrandingStep("staff")).toBe("low")
  })

  it("rejects a school color in place of an audience", () => {
    expect(() => defaultBrandingStep("#003da5" as AppAudience)).toThrow(/"non-staff" or "staff"/)
  })
})

describe("color values in the output", () => {
  it("writes every school color as a six-digit hex value that CSS accepts", () => {
    expect(frameColors("F00", "high").frame).toBe("#ff0000")
    expect(schoolTheme({ main: "F00" }, "medium")["--school-selected"]).toBe("#ff0000")
    expect(schoolTheme({ main: "F00" }, "medium")["--school-main"]).toBe("#ff0000")
  })
})

describe("BRANDING_STEPS", () => {
  it("orders the steps from least to most school color", () => {
    expect(BRANDING_STEPS).toEqual(["low", "medium", "high"])
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
  it("fills selected controls with the main school color", () => {
    expect(selectedFill({ main: "#003da5" })).toEqual({ fill: "#003da5", text: "#ffffff" })
  })

  it("picks dark text on a light main color that still passes", () => {
    expect(selectedFill({ main: "#ed2b74" })).toEqual({ fill: "#ed2b74", text: "#111111" })
  })

  it.each(["#ffffff", "#ffcd00", "#00b140", "#ff671d"])(
    "keeps the neutral look when the main color has less than 3:1 contrast with the page (%s)",
    (main) => {
      expect(selectedFill({ main })).toBeNull()
    }
  )
})

describe("schoolTheme", () => {
  it("sets the main color, its text and the selected fill", () => {
    const theme = schoolTheme({ main: "#003da5" }, "medium")
    expect(theme["--school-main"]).toBe("#003da5")
    expect(theme["--school-main-foreground"]).toBe("#ffffff")
    expect(theme["--school-selected"]).toBe("#003da5")
    expect(theme["--school-selected-foreground"]).toBe("#ffffff")
  })

  it("leaves out the selected fill at the low level", () => {
    const theme = schoolTheme({ main: "#003da5" }, "low")
    expect(theme).not.toHaveProperty("--school-selected")
    expect(theme).not.toHaveProperty("--school-selected-foreground")
    expect(theme["--school-main"]).toBe("#003da5")
  })

  it("sets the selected fill at the high level", () => {
    expect(schoolTheme({ main: "#003da5" }, "high")["--school-selected"]).toBe("#003da5")
  })

  it("leaves out the selected fill when selected controls stay neutral", () => {
    const theme = schoolTheme({ main: "#ffffff" }, "medium")
    expect(theme).not.toHaveProperty("--school-selected")
    expect(theme).not.toHaveProperty("--school-selected-foreground")
  })

  it("replaces the warm neutrals with neutrals that have no hue", () => {
    const theme = schoolTheme({ main: "#003da5" }, "medium")
    for (const name of ["--background", "--muted", "--secondary", "--border", "--input"]) {
      const value = theme[name]
      expect(value, name).toMatch(/^#([0-9a-f]{2})\1\1$/)
    }
  })

  it("leaves buttons, the error red, the focus outline and the radius alone", () => {
    const theme = schoolTheme({ main: "#c41230" }, "medium")
    for (const name of ["--primary", "--primary-foreground", "--destructive", "--ring", "--radius"]) {
      expect(theme).not.toHaveProperty(name)
    }
  })
})

describe("plainPageColor", () => {
  it("keeps a page with no frame white at the low level", () => {
    expect(plainPageColor("#c41230", "low")).toBe("#ffffff")
  })

  it("gives a page with no frame a light gray with no school color at the medium level", () => {
    expect(plainPageColor("#c41230", "medium")).toBe("#fafafa")
    expect(plainPageColor("#003da5", "medium")).toBe("#fafafa")
  })

  it("tints a page with no frame very lightly in the school hue at the high level", () => {
    const page = toOklch(plainPageColor("#c41230", "high"))
    expect(page.l).toBeCloseTo(0.98, 2)
    expect(page.c).toBeGreaterThan(0.005)
    expect(page.c).toBeLessThan(0.02)
    expect(Math.abs(page.h - toOklch("#c41230").h)).toBeLessThan(5)
  })

  it("tints a page with no frame more lightly for a yellow school color", () => {
    const yellow = toOklch(plainPageColor("#c4d600", "high"))
    const red = toOklch(plainPageColor("#c41230", "high"))
    expect(yellow.l).toBeGreaterThan(red.l + 0.005)
  })

  it("gives a main color close to gray a warm tint", () => {
    expect(Math.abs(toOklch(plainPageColor("#333333", "high")).h - 97)).toBeLessThan(5)
  })
})

describe("frameColors", () => {
  it("draws the full-color frame in the main color, around a white page", () => {
    const colors = frameColors("#c41230", "high")
    expect(colors.frame).toBe("#c41230")
    expect(colors.frameText).toBe("#ffffff")
    expect(colors.page).toBe("#ffffff")
    expect(colors.logo).toBe("white")
  })

  it("fills the selected nav item in the full-color frame with a light tint and dark text", () => {
    const colors = frameColors("#c41230", "high")
    expect(colors.navSelected).toBe("color-mix(in srgb, #c41230 8%, #ffffff)")
    expect(colors.navSelectedText).toBe("#111111")
  })

  it("puts dark text on a full-color frame in a light color", () => {
    const colors = frameColors("#ffcd00", "high")
    expect(colors.frameText).toBe("#111111")
    expect(colors.logo).toBe("black")
  })

  it("draws a light gray frame with no school color around a white page at the low level", () => {
    const colors = frameColors("#c41230", "low")
    expect(colors.frame).toBe("#f5f5f5")
    expect(colors.page).toBe("#ffffff")
    expect(colors.frameText).toBe("#111111")
    expect(colors.logo).toBe("original")
    expect(JSON.stringify(colors)).not.toContain("#c41230")
  })

  it("fills the selected nav item at the low level with the frame darkened by 8%, and hover by 4%", () => {
    const colors = frameColors("#003da5", "low")
    expect(colors.navSelected).toBe("color-mix(in oklab, #f5f5f5, #000000 8%)")
    expect(colors.navHover).toBe("color-mix(in oklab, #f5f5f5, #000000 4%)")
  })
})

describe("frameColors at the tinted step", () => {
  const schools = [
    ["Northfield blue", "#003da5"],
    ["Redmond red", "#c41230"],
    ["Sweet Briar pink", "#ed2b74"],
    ["Columbia light blue", "#b9d9eb"],
    ["Marshall light green", "#00b140"],
    ["Michigan Tech gold", "#ffcd00"],
  ] as const

  const hueGap = (first: number, second: number) => {
    const gap = Math.abs(first - second) % 360
    return Math.min(gap, 360 - gap)
  }

  it.each(schools.filter(([name]) => name !== "Michigan Tech gold"))("draws the frame for %s in the hue of the main color", (_, main) => {
    const frame = toOklch(frameColors(main, "medium").frame)
    expect(hueGap(frame.h, toOklch(main).h)).toBeLessThan(6)
  })

  it("gives every school the same frame lightness and amount of color", () => {
    const frames = schools.map(([, main]) => toOklch(frameColors(main, "medium").frame))
    for (const frame of frames) {
      expect(frame.l).toBeCloseTo(frames[0]!.l, 2)
      expect(frame.c).toBeGreaterThan(0.014)
      expect(frame.c).toBeLessThan(0.022)
    }
  })

  it("draws a lighter frame for a yellow hue", () => {
    const yellow = toOklch(frameColors("#c9c400", "medium").frame)
    const blue = toOklch(frameColors("#003da5", "medium").frame)
    expect(yellow.l).toBeGreaterThan(blue.l + 0.01)
  })

  it.each([
    ["dark gray", "#333333"],
    ["black", "#000000"],
    ["white", "#ffffff"],
  ])("draws a warm frame for a %s main color", (_, main) => {
    const frame = toOklch(frameColors(main, "medium").frame)
    expect(frame.c).toBeGreaterThan(0.014)
    expect(hueGap(frame.h, 97)).toBeLessThan(6)
  })

  it.each(schools)(
    "makes the hover and selected nav fills for %s darker steps of the frame with more color, not a mix with black",
    (_, main) => {
      const colors = frameColors(main, "medium")
      const [frame, hover, selected] = [colors.frame, colors.navHover, colors.navSelected].map(toOklch) as [
        Oklch,
        Oklch,
        Oklch,
      ]
      expect(hover.l).toBeLessThan(frame.l)
      expect(selected.l).toBeLessThan(hover.l)
      expect(selected.c).toBeGreaterThan(frame.c)
      expect(hueGap(selected.h, frame.h)).toBeLessThan(6)
      expect(colors.navSelected).not.toContain("#000000")
    }
  )

  it("keeps the white page, and readable dark text on the frame and the selected nav fill", () => {
    for (const [, main] of schools) {
      const colors = frameColors(main, "medium")
      expect(colors.page).toBe("#ffffff")
      expect(contrastRatio(colors.frame, colors.frameText)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(colors.navSelected, colors.navSelectedText)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
