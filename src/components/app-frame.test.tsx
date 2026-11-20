import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { frameColors, plainPageColor } from "../lib/branding.js"
import { AppFrame, AppFrameNavLink, type FrameSchool } from "./app-frame.js"

const depaul: FrameSchool = {
  name: "DePaul University",
  main: "#003da5",
  logos: [{ src: "/logos/depaul.svg" }, { src: "/logos/depaul-white.svg" }],
}

const noLogo: FrameSchool = { name: "Monza University", main: "#7a1f2b", logos: [] }

const barry: FrameSchool = {
  name: "Barry University",
  main: "#c41230",
  logos: [{ src: "/logos/barry.svg", showsName: true }],
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
  it("leaves out the logo spot and its divider when the school has no logo", () => {
    const top = render(
      <AppFrame school={noLogo} step="medium" appName="Deposit holds" nav={nav}>
        <p>Page</p>
      </AppFrame>
    )
    const header = top.match(/<header[\s\S]*<\/header>/)?.[0] ?? ""
    expect(header).toMatch(/^<header[^>]*><span[^>]*>Deposit holds<\/span>/)
    expect(header).not.toContain("w-px")
    const plain = render(
      <AppFrame school={noLogo} step="medium" layout="plain">
        <p>Form</p>
      </AppFrame>
    )
    expect(plain).not.toContain("<header")
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

  it("puts the logo, the app name and the nav in the top edge of the frame", () => {
    const html = render(
      <AppFrame school={depaul} step="medium" appName="Admissions dashboard" nav={nav}>
        <p>Page</p>
      </AppFrame>
    )
    const header = html.match(/<header[\s\S]*<\/header>/)?.[0] ?? ""
    expect(header).toContain("depaul.svg")
    expect(header).toContain("Admissions dashboard")
    expect(header).toContain("By college")
    expect(html).toMatch(/<main[^>]*>.*<p>Page<\/p>.*<\/main>/)
  })

  it("puts the nav down the left side with the left layout", () => {
    const html = render(
      <AppFrame school={depaul} step="medium" layout="left" appName="Admissions dashboard" nav={nav} />
    )
    const aside = html.match(/<aside[\s\S]*<\/aside>/)?.[0] ?? ""
    expect(aside).toContain("depaul.svg")
    expect(aside).toContain("By college")
    expect(html).not.toContain("<header")
  })

  it("sets the frame colors for the step", () => {
    const html = render(<AppFrame school={depaul} step="medium" />)
    expect(html).toContain(`--frame:${frameColors(depaul.main, "medium").frame}`)
    expect(html).toContain('data-step="medium"')
  })

  it.each(["top", "left"] as const)(
    "colors the page behind the app with the frame color in the %s layout, so overscroll shows the frame",
    (layout) => {
      const html = render(<AppFrame school={barry} step="high" layout={layout} />)
      expect(html).toContain("<style>html{background-color:#c41230;scrollbar-gutter:auto}body{background-color:transparent}</style>")
    }
  )

  it("leaves the page behind the app alone in the plain layout", () => {
    expect(render(<AppFrame school={barry} step="high" layout="plain" />)).not.toContain("<style>")
  })

  it("holds the logo out of sight until the frame has measured it", () => {
    expect(logoTag(render(<AppFrame school={depaul} step="low" />))).toContain("visibility:hidden")
  })

  it("turns the full-color logo white on the full-color frame when there is no white logo", () => {
    const html = render(<AppFrame school={barry} step="high" />)
    expect(logoTag(html)).toContain("barry.svg")
    expect(logoTag(html)).toContain("filter:brightness(0) invert(1)")
  })

  it.each(["medium", "low"] as const)(
    "shows the full-color logo unchanged at the %s step",
    (step) => {
      const html = render(<AppFrame school={depaul} step={step} />)
      expect(logoTag(html)).toContain("depaul.svg")
      expect(logoTag(html)).not.toContain("filter")
    }
  )

  it("shows the school name next to a logo that does not show it", () => {
    expect(render(<AppFrame school={depaul} step="low" />)).toContain(">DePaul University<")
  })

  it("leaves out the school name next to a wordmark", () => {
    expect(render(<AppFrame school={barry} step="low" />)).not.toContain(">Barry University<")
  })

  it("draws no frame in the plain layout and puts the logo above the page", () => {
    const html = render(
      <AppFrame school={depaul} step="high" layout="plain" appName="Apply" nav={nav}>
        <p>Form</p>
      </AppFrame>
    )
    expect(html).not.toContain("--frame:")
    expect(html).not.toContain("By college")
    expect(logoTag(html)).toContain("depaul.svg")
    expect(html.indexOf("depaul.svg")).toBeLessThan(html.indexOf("<p>Form</p>"))
  })

  it("puts the form on a white page in the plain layout at the low level", () => {
    const html = render(<AppFrame school={depaul} step="low" layout="plain" />)
    expect(html).toContain("--frame-page:#ffffff")
    expect(html).toContain("bg-(--frame-page)")
  })

  it("puts the form on a light gray page in the plain layout at the medium level", () => {
    const html = render(<AppFrame school={depaul} step="medium" layout="plain" />)
    expect(html).toContain("--frame-page:#fafafa")
  })

  it("tints the form page in the school hue in the plain layout at the high level", () => {
    const html = render(<AppFrame school={depaul} step="high" layout="plain" />)
    expect(html).toContain(`--frame-page:${plainPageColor(depaul.main, "high")}`)
    expect(html).not.toContain("--frame-page:#ffffff")
    expect(html).not.toContain("--frame-page:#fafafa")
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
