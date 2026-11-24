// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { FaviconPlan } from "../lib/favicon.js"
import type { SchoolLogo } from "./app-frame.js"

const LOGOS: Record<string, { ratio: number; tone: string }> = {
  "/seal.png": { ratio: 1, tone: "color" },
  "/one-line.png": { ratio: 5.2, tone: "color" },
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
    Promise.resolve(plan.kind === "logo" ? `icon:${plan.logo.logo.src}` : "icon:mark"),
}))

const { AppFrame } = await import("./app-frame.js")

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null

afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ""
  document.head.innerHTML = ""
})

async function render(element: React.ReactElement) {
  const container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(<MemoryRouter>{element}</MemoryRouter>)
  })
  await act(async () => {})
  await act(async () => {})
}

function favicon() {
  return document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')?.getAttribute("href") ?? null
}

const monza = { name: "Monza University", primaryColor: "#7a1f2b" }

describe("AppFrame favicon", () => {
  it("shows the school's seal in the browser tab when the school has an about-square logo", async () => {
    await render(
      <AppFrame school={{ ...monza, logos: [{ src: "/one-line.png" }, { src: "/seal.png" }] }} step="low" appName="Class progress">
        <p>Page</p>
      </AppFrame>
    )
    expect(favicon()).toBe("icon:/seal.png")
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
