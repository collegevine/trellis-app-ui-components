import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { frameColors, plainPageColor } from "../lib/branding.js"
import { AppFrame, AppFrameNavLink, type FrameSchool } from "./app-frame.js"

const northfield: FrameSchool = {
  name: "Northfield University",
  main: "#003da5",
  logo: { src: "/logos/northfield.svg" },
  whiteLogo: { src: "/logos/northfield-white.svg" },
}

const redmond: FrameSchool = {
  name: "Redmond State University",
  main: "#c41230",
  logo: { src: "/logos/redmond.svg", showsName: true },
}

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

function logoTag(html: string) {
  return html.match(/<img [^>]*data-slot="app-frame-logo"[^>]*>/)?.[0] ?? ""
}

describe("AppFrame", () => {
  it("puts the logo, the app name and the nav in the top edge of the frame", () => {
    const html = render(
      <AppFrame school={northfield} step="tinted-frame" appName="Admissions dashboard" nav={nav}>
        <p>Page</p>
      </AppFrame>
    )
    const header = html.match(/<header[\s\S]*<\/header>/)?.[0] ?? ""
    expect(header).toContain("northfield.svg")
    expect(header).toContain("Admissions dashboard")
    expect(header).toContain("By college")
    expect(html).toMatch(/<main[^>]*>.*<p>Page<\/p>.*<\/main>/)
  })

  it("puts the nav down the left side with the left layout", () => {
    const html = render(
      <AppFrame school={northfield} step="tinted-frame" layout="left" appName="Admissions dashboard" nav={nav} />
    )
    const aside = html.match(/<aside[\s\S]*<\/aside>/)?.[0] ?? ""
    expect(aside).toContain("northfield.svg")
    expect(aside).toContain("By college")
    expect(html).not.toContain("<header")
  })

  it("sets the frame colors for the step", () => {
    const html = render(<AppFrame school={northfield} step="tinted-frame" />)
    expect(html).toContain(`--frame:${frameColors(northfield.main, "tinted-frame").frame}`)
    expect(html).toContain('data-step="tinted-frame"')
  })

  it.each(["top", "left"] as const)(
    "colors the page behind the app with the frame color in the %s layout, so overscroll shows the frame",
    (layout) => {
      const html = render(<AppFrame school={redmond} step="full-color-frame" layout={layout} />)
      expect(html).toContain("<style>html{background-color:#c41230;scrollbar-gutter:auto}body{background-color:transparent}</style>")
    }
  )

  it("leaves the page behind the app alone in the plain layout", () => {
    expect(render(<AppFrame school={redmond} step="full-color-frame" layout="plain" />)).not.toContain("<style>")
  })

  it("shows the approved white logo on the full-color frame", () => {
    const html = render(<AppFrame school={northfield} step="full-color-frame" />)
    expect(logoTag(html)).toContain("northfield-white.svg")
    expect(logoTag(html)).not.toContain("filter")
  })

  it("turns the full-color logo white on the full-color frame when there is no white logo", () => {
    const html = render(<AppFrame school={redmond} step="full-color-frame" />)
    expect(logoTag(html)).toContain("redmond.svg")
    expect(logoTag(html)).toContain("filter:brightness(0) invert(1)")
  })

  it.each(["tinted-frame", "logo-only"] as const)(
    "shows the full-color logo unchanged at the %s step",
    (step) => {
      const html = render(<AppFrame school={northfield} step={step} />)
      expect(logoTag(html)).toContain("northfield.svg")
      expect(logoTag(html)).not.toContain("filter")
    }
  )

  it("shows the school name next to a logo that does not show it", () => {
    expect(render(<AppFrame school={northfield} step="logo-only" />)).toContain(">Northfield University<")
  })

  it("leaves out the school name next to a wordmark", () => {
    expect(render(<AppFrame school={redmond} step="logo-only" />)).not.toContain(">Redmond State University<")
  })

  it("draws no frame in the plain layout and puts the logo above the page", () => {
    const html = render(
      <AppFrame school={northfield} step="full-color-frame" layout="plain" appName="Apply" nav={nav}>
        <p>Form</p>
      </AppFrame>
    )
    expect(html).not.toContain("--frame:")
    expect(html).not.toContain("By college")
    expect(logoTag(html)).toContain("northfield.svg")
    expect(html.indexOf("northfield.svg")).toBeLessThan(html.indexOf("<p>Form</p>"))
  })

  it("puts the form on a white page in the plain layout at the logo-only step", () => {
    const html = render(<AppFrame school={northfield} step="logo-only" layout="plain" />)
    expect(html).toContain("--frame-page:#ffffff")
    expect(html).toContain("bg-(--frame-page)")
  })

  it.each(["tinted-frame", "full-color-frame"] as const)(
    "tints the form page in the school hue in the plain layout at the %s step",
    (step) => {
      const html = render(<AppFrame school={northfield} step={step} layout="plain" />)
      expect(html).toContain(`--frame-page:${plainPageColor(northfield.main, step)}`)
      expect(html).not.toContain("--frame-page:#ffffff")
    },
  )
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

describe("AppFrame with no school brand", () => {
  it("draws the frame in the CollegeVine neutrals from the theme", () => {
    const html = render(<AppFrame appName="Admissions dashboard" nav={nav} />)
    expect(html).toContain("--frame:var(--secondary)")
    expect(html).toContain("--frame-page:var(--background)")
    expect(html).toContain('data-step="unbranded"')
  })

  it("puts the app name where the logo goes in the top edge, with no divider", () => {
    const html = render(<AppFrame appName="Admissions dashboard" nav={nav} />)
    const header = html.match(/<header[\s\S]*<\/header>/)?.[0] ?? ""
    expect(header).toMatch(/^<header[^>]*><span[^>]*>Admissions dashboard<\/span>/)
    expect(header).not.toContain('aria-hidden="true"')
    expect(html).not.toContain("<img")
  })

  it("puts the app name at the top of the left nav, once", () => {
    const html = render(<AppFrame layout="left" appName="Admissions dashboard" nav={nav} />)
    const aside = html.match(/<aside[\s\S]*<\/aside>/)?.[0] ?? ""
    expect(aside.match(/Admissions dashboard/g)).toHaveLength(1)
    expect(aside.indexOf("Admissions dashboard")).toBeLessThan(aside.indexOf("Overview"))
  })

  it("draws no frame when the app has no nav", () => {
    const html = render(
      <AppFrame appName="Admissions dashboard">
        <p>Page</p>
      </AppFrame>
    )
    expect(html).not.toContain("--frame:")
    expect(html).toContain("--frame-page:var(--background)")
    expect(html).not.toContain("<header")
    expect(html).toContain("<p>Page</p>")
  })
})
