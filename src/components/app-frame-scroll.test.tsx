// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"
import { afterEach, describe, expect, it } from "vitest"

import { AppFrame } from "./app-frame.js"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement

afterEach(() => container.remove())

function renderApp() {
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <AppFrame
          school={{ name: "Northfield University", main: "#003da5", logo: { src: "/logo.svg" } }}
          step="tinted-frame"
        >
          <Outlet />
        </AppFrame>
      ),
      children: [
        { index: true, element: <p>Overview</p> },
        { path: "by-college", element: <p>By college</p> },
      ],
    },
  ])
  container = document.createElement("div")
  document.body.append(container)
  act(() => createRoot(container).render(<RouterProvider router={router} />))
  return router
}

describe("AppFrame scrolling", () => {
  it("scrolls the page area inside a rounded area that clips it, so the scrollbar follows the corners", () => {
    renderApp()
    const page = container.querySelector<HTMLElement>('[data-slot="app-frame-page"]')
    expect(page?.className).toContain("overflow-y-auto")
    expect(page?.parentElement?.className).toMatch(/rounded-xl/)
    expect(page?.parentElement?.className).toMatch(/overflow-hidden/)
  })

  it("keeps the frame to the window's height, so the window itself does not scroll", () => {
    renderApp()
    const frame = container.querySelector<HTMLElement>('[data-slot="app-frame"]')
    expect(frame?.className).toMatch(/(^|\s)h-dvh(\s|$)/)
    expect(frame?.className).toMatch(/(^|\s)overflow-hidden(\s|$)/)
  })

  it("scrolls the page area back to the top when the page changes", async () => {
    const router = renderApp()
    const page = container.querySelector<HTMLElement>('[data-slot="app-frame-page"]')!
    page.scrollTop = 300
    expect(page.scrollTop).toBe(300)
    await act(() => router.navigate("/by-college"))
    expect(container.textContent).toContain("By college")
    expect(page.scrollTop).toBe(0)
  })
})
