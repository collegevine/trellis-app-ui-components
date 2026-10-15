// Checks every component for visual values picked by hand instead of taken
// from the theme. The deploy-app design guide tells the agent that every color,
// radius and size comes from the design system, and a component that breaks
// that rule teaches every app built from it to break the rule too.

import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

// Tailwind's own palettes. Any of these with a numeric step is a value the
// author picked instead of a token, and the gray ramps are cool where
// CollegeVine's neutrals are warm.
const PALETTES =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone"
const UTILITIES =
  "text|bg|border|ring|fill|stroke|from|via|to|decoration|outline|shadow|accent|caret|divide|placeholder"

const RULES: [RegExp, string][] = [
  [/#[0-9a-fA-F]{3,8}\b/, "hex color written in the component; use a theme token"],
  [
    new RegExp(`\\b(?:${UTILITIES})-(?:${PALETTES})-\\d{2,3}\\b`),
    "Tailwind palette color; use a theme token",
  ],
  [
    /\[(?![.&>:])[^\]]*(?:#[0-9a-fA-F]{3,8}|\d+(?:\.\d+)?(?:px|rem|em|vh|vw|pt))[^\]]*\]/,
    "arbitrary value in a class; use a scale step or a theme token",
  ],
  [/\b(?:rgb|rgba|hsl|hsla|oklch)\(/, "color function written in the component; use a theme token"],
]

const COMPONENTS_DIR = dirname(fileURLToPath(import.meta.url))

const componentFiles = readdirSync(COMPONENTS_DIR).filter(
  (name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)
)

describe("components take their visual values from the theme", () => {
  it.each(componentFiles)("%s", (name) => {
    const lines = readFileSync(join(COMPONENTS_DIR, name), "utf8").split("\n")
    const problems = lines.flatMap((line, index) =>
      RULES.flatMap(([pattern, problem]) => {
        const match = line.match(pattern)
        return match ? [`line ${index + 1}: ${problem} (${match[0].trim()})`] : []
      })
    )
    expect(problems).toEqual([])
  })
})
