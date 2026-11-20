// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"
import { afterEach, describe, expect, it } from "vitest"

import { AppFrame, AppFrameNavLink, type AppFrameLayout } from "./app-frame.js"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement

afterEach(() => {
  container.remove()
  document.body.innerHTML = ""
})

function renderApp(layout: AppFrameLayout) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <AppFrame
          layout={layout}
          appName="Admissions dashboard"
          nav={
            <>
              <AppFrameNavLink to="/" end>
                Overview
              </AppFrameNavLink>
              <AppFrameNavLink to="/by-college">By college</AppFrameNavLink>
            </>
          }
        >
          <Outlet />
        </AppFrame>
      ),
      children: [
        { index: true, element: <p>Overview page</p> },
        { path: "by-college", element: <p>By college page</p> },
      ],
    },
  ])
  container = document.createElement("div")
  document.body.append(container)
  act(() => createRoot(container).render(<RouterProvider router={router} />))
  return router
}

const menuButton = () => document.querySelector<HTMLButtonElement>('[aria-label="Open menu"]')
const menu = () => document.querySelector('[data-slot="app-frame-menu"]')

describe("AppFrame on a phone", () => {
  it.each(["top", "left"] as const)(
    "shows a menu button only below tablet width, and hides the %s nav there",
    (layout) => {
      renderApp(layout)
      const bar = document.querySelector('[data-slot="app-frame-mobile-bar"]')
      expect(bar?.className).toMatch(/(^|\s)md:hidden(\s|$)/)
      expect(bar?.contains(menuButton())).toBe(true)
      const desktopNav = layout === "top" ? document.querySelector("header") : document.querySelector("aside")
      expect(desktopNav?.className).toMatch(/(^|\s)hidden(\s|$)/)
      expect(desktopNav?.className).toMatch(/md:flex/)
    }
  )

  it("opens the nav in a drawer from the menu button", async () => {
    renderApp("top")
    expect(menu()).toBeNull()
    await act(async () => menuButton()!.click())
    const links = [...(menu()?.querySelectorAll("a") ?? [])].map((a) => a.textContent)
    expect(links).toEqual(["Overview", "By college"])
    expect(menu()?.textContent).toContain("Admissions dashboard")
  })

  it("closes the drawer when a nav item opens another page", async () => {
    const router = renderApp("left")
    await act(async () => menuButton()!.click())
    expect(menu()).not.toBeNull()
    await act(() => router.navigate("/by-college"))
    expect(container.textContent).toContain("By college page")
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(menu()).toBeNull()
  })
})
