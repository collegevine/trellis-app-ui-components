export interface Oklch {
  l: number
  c: number
  h: number
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export function parseHex(color: string): [number, number, number] {
  const match = color.trim().match(HEX)
  if (!match?.[1]) {
    throw new Error(`Expected a hex color such as #003da5, got "${color}"`)
  }
  const digits =
    match[1].length === 3
      ? [...match[1]].map((digit) => digit + digit).join("")
      : match[1]
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ]
}

export function normalizeHex(color: string): string {
  return `#${parseHex(color).map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

function toLinear(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function linearRgb(color: string): [number, number, number] {
  return parseHex(color).map(toLinear) as [number, number, number]
}

function toOklab(color: string): [number, number, number] {
  return oklabFromLinear(linearRgb(color))
}

export function oklabFromLinear([r, g, b]: [number, number, number]): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function toOklch(color: string): Oklch {
  const [l, a, b] = toOklab(color)
  const hue = (Math.atan2(b, a) * 180) / Math.PI
  return { l, c: Math.hypot(a, b), h: (hue + 360) % 360 }
}

function fromLinear(value: number): number {
  const clamped = Math.min(1, Math.max(0, value))
  const encoded =
    clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055
  return Math.round(encoded * 255)
}

function linearFromOklch({ l, c, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180
  const a = c * Math.cos(radians)
  const b = c * Math.sin(radians)
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ]
}

export function fromOklch(color: Oklch): string {
  return `#${linearFromOklch(color).map((channel) => fromLinear(channel).toString(16).padStart(2, "0")).join("")}`
}

export function maxChroma(l: number, h: number): number {
  const inGamut = (c: number) =>
    linearFromOklch({ l, c, h }).every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4)
  let low = 0
  let high = 0.4
  for (let step = 0; step < 20; step++) {
    const middle = (low + high) / 2
    if (inGamut(middle)) low = middle
    else high = middle
  }
  return low
}

function luminance(color: string): number {
  const [r, g, b] = parseHex(color).map(toLinear) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (light + 0.05) / (dark + 0.05)
}
