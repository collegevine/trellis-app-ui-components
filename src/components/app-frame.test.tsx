import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { AppFrame, AppFrameNavLink } from "./app-frame.js"

function render(element: React.ReactElement, path = "/") {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>)
}

const nav = (
  <>
    <AppFrameNavLink to="/" end>
      Overview
    </AppFrameNavLink>
    <AppFrameNavLink to="/by-college">By college</AppFrameNavLink>
  </>
)

describe("AppFrame", () => {
  it("draws the frame in the CollegeVine neutrals from the theme", () => {
    const html = render(<AppFrame appName="Admissions dashboard" nav={nav} />)
    expect(html).toContain("--frame:var(--secondary)")
    expect(html).toContain("--frame-page:var(--background)")
  })

  it("keeps positioned content inside the page, so that it cannot make the window scroll past the frame", () => {
    const html = render(
      <AppFrame appName="Admissions dashboard" nav={nav}>
        <p>Page</p>
      </AppFrame>
    )
    const page = html.match(/<div[^>]*data-slot="app-frame-page"[^>]*>/)?.[0] ?? ""
    expect(page).toMatch(/class="(?:[^"]*\s)?relative[\s"]/)
    expect(page).toContain("overflow-clip")
  })

  it("puts the app name and the nav in the top edge of the frame", () => {
    const html = render(
      <AppFrame appName="Admissions dashboard" nav={nav}>
        <p>Page</p>
      </AppFrame>
    )
    const header = html.match(/<header[\s\S]*<\/header>/)?.[0] ?? ""
    expect(header).toMatch(/^<header[^>]*><span[^>]*>Admissions dashboard<\/span>/)
    expect(header).toContain("By college")
    expect(html).toMatch(/<main[^>]*>.*<p>Page<\/p>.*<\/main>/)
  })

  it("puts the app name at the top of the left nav, once", () => {
    const html = render(<AppFrame layout="left" appName="Admissions dashboard" nav={nav} />)
    const aside = html.match(/<aside[\s\S]*<\/aside>/)?.[0] ?? ""
    expect(aside.match(/Admissions dashboard/g)).toHaveLength(1)
    expect(aside.indexOf("Admissions dashboard")).toBeLessThan(aside.indexOf("Overview"))
    expect(html).not.toContain("<header")
  })

  it.each(["top", "left"] as const)(
    "colors the page behind the app with the frame color in the %s layout, so overscroll shows the frame",
    (layout) => {
      const html = render(<AppFrame layout={layout} nav={nav} />)
      expect(html).toContain(
        "<style>html{background-color:var(--secondary);scrollbar-gutter:auto}body{background-color:transparent}</style>"
      )
    }
  )

  it("draws no frame when the app has no nav", () => {
    const html = render(
      <AppFrame appName="Admissions dashboard">
        <p>Page</p>
      </AppFrame>
    )
    expect(html).not.toContain("--frame")
    expect(html).not.toContain("<header")
    expect(html).not.toContain("<style>")
    expect(html).toContain("<p>Page</p>")
  })
})

describe("AppFrameNavLink", () => {
  it("marks the item for the current page and fills it from the frame", () => {
    const html = render(nav, "/by-college")
    const current = html.match(/<a [^>]*aria-current="page"[^>]*>([^<]*)</)
    expect(current?.[1]).toBe("By college")
    expect(html).toContain("aria-[current=page]:bg-(--frame-nav-selected)")
  })

  it("does not fill the current item with the hover color", () => {
    const html = render(nav)
    expect(html).not.toMatch(/(^|\s)hover:bg-\(--frame-nav-hover\)/)
    expect(html).toContain("hover:not-aria-[current=page]:bg-(--frame-nav-hover)")
  })
})
