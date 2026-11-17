// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppFrame, AppFrameNavLink } from "./app-frame.js"

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
        <AppFrame appName="Admissions dashboard" nav={<AppFrameNavLink to="/">Overview</AppFrameNavLink>}>
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
  it("scrolls the page inside an area with rounded top corners that cuts off the scrollbar, so the scrollbar follows them", () => {
    renderApp()
    const scroll = container.querySelector<HTMLElement>('[data-slot="app-frame-scroll"]')
    expect(scroll?.className).toContain("overflow-y-auto")
    expect(scroll?.parentElement?.className).toMatch(/(^|\s)rounded-t-xl(\s|$)/)
    expect(scroll?.parentElement?.className).toMatch(/(^|\s)overflow-hidden(\s|$)/)
  })

  it("scrolls the page's bottom edge and the frame below it with the page, so they show only at the end", () => {
    renderApp()
    const scroll = container.querySelector<HTMLElement>('[data-slot="app-frame-scroll"]')
    const page = container.querySelector<HTMLElement>('[data-slot="app-frame-page"]')
    expect(page?.parentElement).toBe(scroll)
    expect(page?.className).toMatch(/(^|\s)rounded-xl(\s|$)/)
    expect(page?.nextElementSibling?.className).toMatch(/(^|\s)h-2(\s|$)/)
    expect(scroll?.parentElement?.className).not.toMatch(/(^|\s)mb-2(\s|$)/)
  })

  it("keeps the frame to the window's height, so the window itself does not scroll", () => {
    renderApp()
    const frame = container.querySelector<HTMLElement>('[data-slot="app-frame"]')
    expect(frame?.className).toMatch(/(^|\s)h-dvh(\s|$)/)
    expect(frame?.className).toMatch(/(^|\s)overflow-hidden(\s|$)/)
  })

  it("scrolls the page area back to the top when the page changes", async () => {
    const router = renderApp()
    const page = container.querySelector<HTMLElement>('[data-slot="app-frame-scroll"]')!
    page.scrollTop = 300
    expect(page.scrollTop).toBe(300)
    await act(() => router.navigate("/by-college"))
    expect(container.textContent).toContain("By college")
    expect(page.scrollTop).toBe(0)
  })
})

describe("AppFrame page corners beside a scrollbar", () => {
  function withScrollbarWidth(width: number) {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === "app-frame-scroll" ? 400 : 0
    })
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === "app-frame-scroll" ? 400 - width : 0
    })
  }

  afterEach(() => vi.restoreAllMocks())

  it("squares the page's right corners beside a scrollbar column, and rounds the scrollbar's top end with the frame", () => {
    withScrollbarWidth(15)
    renderApp()
    const scroll = container.querySelector<HTMLElement>('[data-slot="app-frame-scroll"]')
    const page = container.querySelector<HTMLElement>('[data-slot="app-frame-page"]')
    expect(scroll?.hasAttribute("data-scrollbar")).toBe(true)
    expect(scroll?.parentElement?.className).toMatch(/(^|\s)rounded-t-xl(\s|$)/)
    expect(scroll?.parentElement?.className).not.toContain("rounded-tr-none")
    expect(page?.className).toMatch(/(^|\s)rounded-r-none(\s|$)/)
  })

  it("keeps the corners rounded when the scrollbar floats over the page and takes no width", () => {
    withScrollbarWidth(0)
    renderApp()
    const scroll = container.querySelector<HTMLElement>('[data-slot="app-frame-scroll"]')
    const page = container.querySelector<HTMLElement>('[data-slot="app-frame-page"]')
    expect(scroll?.hasAttribute("data-scrollbar")).toBe(false)
    expect(scroll?.className).not.toContain("rounded-tr-none")
    expect(page?.className).not.toContain("rounded-r-none")
  })
})
