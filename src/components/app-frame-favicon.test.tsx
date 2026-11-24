// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { FaviconPlan } from "../lib/favicon.js"
import type { SchoolLogo } from "./app-frame.js"

const LOGOS: Record<string, { ratio: number; tone: string; readsOnDark: boolean }> = {
  "/seal.png": { ratio: 1, tone: "color", readsOnDark: false },
  "/seal-white.png": { ratio: 1, tone: "white", readsOnDark: true },
  "/one-line.png": { ratio: 5.2, tone: "color", readsOnDark: false },
  "/seal-gold.png": { ratio: 1, tone: "color", readsOnDark: true },
}

vi.mock("../lib/measure-logo.js", () => ({
  measureLogo: (logo: SchoolLogo) =>
    Promise.resolve(
      LOGOS[logo.src]
        ? { logo, ...LOGOS[logo.src], crop: { x: 0, y: 0, width: 1, height: 1 }, cleanSrc: null }
        : null
    ),
}))

vi.mock("../lib/draw-favicon.js", () => ({
  drawFavicon: (plan: FaviconPlan) =>
    Promise.resolve(
      plan.kind === "logo" ? `icon:${plan.logo.logo.src}` : "icon:mark"
    ),
}))

const { AppFrame } = await import("./app-frame.js")

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let darkMode = false
const listeners = new Set<() => void>()

beforeEach(() => {
  darkMode = false
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes("dark") && darkMode
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  })) as unknown as typeof window.matchMedia
})

afterEach(() => {
  act(() => root?.unmount())
  root = null
  listeners.clear()
  document.body.innerHTML = ""
  document.head.innerHTML = ""
})

async function settle() {
  await act(async () => {})
  await act(async () => {})
}

async function render(element: React.ReactElement) {
  const container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(<MemoryRouter>{element}</MemoryRouter>)
  })
  await settle()
}

function favicon() {
  return document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')?.getAttribute("href") ?? null
}

const monza = { name: "Monza University", main: "#7a1f2b" }

describe("AppFrame favicon", () => {
  it("shows the school's seal in light mode and its white seal in dark mode", async () => {
    darkMode = true
    await render(
      <AppFrame school={{ ...monza, logos: [{ src: "/one-line.png" }, { src: "/seal.png" }, { src: "/seal-white.png" }] }} step="low">
        <p>Page</p>
      </AppFrame>
    )
    expect(favicon()).toBe("icon:/seal-white.png")
  })

  it("shows the logo that the school made for dark backgrounds in dark mode, even when it is not white", async () => {
    darkMode = true
    await render(
      <AppFrame
        school={{ ...monza, logos: [{ src: "/seal.png", background: "light" }, { src: "/seal-gold.png", background: "dark" }] }}
        step="low"
      >
        <p>Page</p>
      </AppFrame>
    )
    expect(favicon()).toBe("icon:/seal-gold.png")
  })

  it("follows the dark mode setting when it changes while the app is open", async () => {
    await render(
      <AppFrame school={{ ...monza, logos: [{ src: "/seal.png" }, { src: "/seal-white.png" }] }} step="low" appName="Class progress">
        <p>Page</p>
      </AppFrame>
    )
    expect(favicon()).toBe("icon:/seal.png")
    darkMode = true
    await act(async () => listeners.forEach((listener) => listener()))
    await settle()
    expect(favicon()).toBe("icon:/seal-white.png")
  })

  it("shows the CollegeVine mark when every logo is wide, also on a form page with no frame", async () => {
    await render(
      <AppFrame school={{ ...monza, logos: [{ src: "/one-line.png" }] }} step="medium" layout="plain">
        <p>Form</p>
      </AppFrame>
    )
    expect(favicon()).toBe("icon:mark")
  })

  it("shows the CollegeVine mark in an app with no school brand", async () => {
    await render(
      <AppFrame appName="Admissions dashboard">
        <p>Page</p>
      </AppFrame>
    )
    expect(favicon()).toBe("icon:mark")
  })
})
