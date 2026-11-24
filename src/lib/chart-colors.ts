import {
  contrastRatio,
  fromOklch,
  linearRgb,
  maxChroma,
  normalizeHex,
  oklabFromLinear,
  toOklch,
} from "./color.js"

const CHART_BACKGROUND = "#ffffff"
const CHART_COUNT = 5

const SCHOOL_CONTRAST = 1.5
const SCHOOL_CHROMA = 0.06
const HUE_CHROMA = 0.05

const GENERATED_CONTRAST = 3
const GENERATED_CHROMA = 0.1
const GENERATED_HUE_DISTANCE = 30
const YELLOW_HUES = { from: 95, to: 135 }
const HUE_STEP = 4
const LIGHTNESS_STEPS = [0, -0.06, 0.06, -0.1, 0.1]

const COLOR_BLINDNESS = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
} as const

type ColorBlindness = keyof typeof COLOR_BLINDNESS

function seenAs(color: string, kind?: ColorBlindness): [number, number, number] {
  const rgb = linearRgb(color)
  if (!kind) return oklabFromLinear(rgb)
  const simulated = COLOR_BLINDNESS[kind].map((row) =>
    Math.max(0, Math.min(1, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]))
  ) as [number, number, number]
  return oklabFromLinear(simulated)
}

function difference(first: string, second: string, kind?: ColorBlindness): number {
  const [a, b] = [seenAs(first, kind), seenAs(second, kind)]
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

function separation(first: string, second: string): number {
  return Math.min(
    difference(first, second) / 15,
    difference(first, second, "protan") / 8,
    difference(first, second, "deutan") / 8
  )
}

function hueGap(first: number, second: number): number {
  const gap = Math.abs(first - second) % 360
  return Math.min(gap, 360 - gap)
}

function passesSchoolChecks(color: string): boolean {
  return (
    toOklch(color).c >= SCHOOL_CHROMA && contrastRatio(color, CHART_BACKGROUND) >= SCHOOL_CONTRAST
  )
}

function schoolSeries(colors: string[]): string[] {
  const series: string[] = []
  for (const color of colors) {
    if (passesSchoolChecks(color) && series.every((chosen) => separation(chosen, color) >= 1)) {
      series.push(color)
    }
  }
  return series
}

function nextGeneratedColor(
  series: string[],
  avoidHues: number[],
  targetLightness: number,
  targetChroma: number
): string | null {
  let best: { color: string; score: number } | null = null
  for (let hue = 0; hue < 360; hue += HUE_STEP) {
    if (hue >= YELLOW_HUES.from && hue <= YELLOW_HUES.to) continue
    if (avoidHues.some((avoid) => hueGap(avoid, hue) < GENERATED_HUE_DISTANCE)) continue
    for (const step of LIGHTNESS_STEPS) {
      const lightness = Math.min(0.76, Math.max(0.44, targetLightness + step))
      const chroma = Math.min(targetChroma, maxChroma(lightness, hue))
      if (chroma < GENERATED_CHROMA) continue
      const color = fromOklch({ l: lightness, c: chroma, h: hue })
      if (contrastRatio(color, CHART_BACKGROUND) < GENERATED_CONTRAST) continue
      const last = series[series.length - 1]
      if (last && separation(last, color) < 1) continue
      const nearest = Math.min(...series.map((chosen) => separation(chosen, color)))
      const score =
        Math.min(nearest, 2.2) -
        1.5 * Math.abs(lightness - targetLightness) -
        2 * Math.abs(chroma - targetChroma)
      if (!best || score > best.score) best = { color, score }
    }
  }
  return best?.color ?? null
}

/**
 * The chart colors for a school, in series order. The school's primary and
 * secondary colors come first, each only when it has enough color to not look
 * gray, at least 1.5:1 contrast with the white chart background, and, for the
 * secondary color, a clear difference from the primary color, also for people
 * with red-green color blindness. Generated colors fill the series that are
 * left. They take the lightness and the amount of color of the school colors,
 * keep their hues at least 30 degrees from every school color and out of
 * yellow, and have at least 3:1 contrast with the background. When no school
 * color passes, the result is empty and charts keep the theme's colors.
 */
export function chartColors(colors: { primaryColor: string; secondaryColor?: string }): string[] {
  const school = [colors.primaryColor, colors.secondaryColor]
    .filter((color): color is string => color !== undefined)
    .map(normalizeHex)
  const series = schoolSeries(school)
  if (series.length === 0) return []

  const tones = series.map(toOklch)
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  const targetLightness = Math.min(0.64, Math.max(0.52, average(tones.map((tone) => tone.l))))
  const targetChroma = Math.max(0.11, Math.min(0.15, average(tones.map((tone) => tone.c)) * 0.85))
  const avoidHues = school.map(toOklch).filter((tone) => tone.c >= HUE_CHROMA).map((tone) => tone.h)

  while (series.length < CHART_COUNT) {
    const next = nextGeneratedColor(series, avoidHues, targetLightness, targetChroma)
    if (!next) break
    series.push(next)
  }
  return series
}
