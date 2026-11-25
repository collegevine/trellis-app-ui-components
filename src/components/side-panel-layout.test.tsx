import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SidePanelLayout, type SidePanelLayoutProps } from "./side-panel-layout.js"

function render(props: Partial<SidePanelLayoutProps> = {}) {
  return renderToStaticMarkup(
    <SidePanelLayout panel={<p>Applicants waiting for review</p>} panelLabel="Review queue" {...props}>
      <p>Transcript for Jordan Alvarez</p>
    </SidePanelLayout>
  )
}

function tag(html: string, slot: string) {
  return html.match(new RegExp(`<[a-z]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ""
}

function classes(html: string, slot: string) {
  return tag(html, slot).match(/class="([^"]*)"/)?.[1]?.split(" ") ?? []
}

describe("SidePanelLayout", () => {
  it("gives the panel one width on every page", () => {
    expect(classes(render(), "side-panel")).toContain("lg:w-88")
  })

  it("names the panel for screen readers", () => {
    const panel = tag(render(), "side-panel")
    expect(panel).toMatch(/^<aside/)
    expect(panel).toContain('aria-label="Review queue"')
  })

  it("puts the main content first in reading order, so a small screen shows it above the panel", () => {
    const html = render({ side: "start" })
    expect(html.indexOf('data-slot="side-panel-main"')).toBeLessThan(html.indexOf('data-slot="side-panel"'))
  })

  it("stacks the panel under the main content on a small screen, at full width", () => {
    const html = render()
    expect(classes(html, "side-panel-layout")).toEqual(expect.arrayContaining(["flex", "flex-col", "lg:flex-row"]))
    expect(classes(html, "side-panel").filter((c) => /^w-/.test(c))).toEqual([])
  })

  it("shows the panel on the side that the page picks, on a large screen", () => {
    expect(classes(render({ side: "start" }), "side-panel")).toContain("lg:order-1")
    expect(classes(render({ side: "start" }), "side-panel-main")).toContain("lg:order-3")
    expect(classes(render({ side: "end" }), "side-panel-main")).toContain("lg:order-1")
    expect(classes(render({ side: "end" }), "side-panel")).toContain("lg:order-3")
  })

  it("puts the panel after the main content when the page does not pick a side", () => {
    expect(classes(render(), "side-panel")).toContain("lg:order-3")
  })

  it("lets the main content shrink, so long content does not push the panel off the screen", () => {
    const html = render()
    expect(classes(html, "side-panel-main")).toEqual(expect.arrayContaining(["min-w-0", "flex-1"]))
    expect(classes(html, "side-panel")).toContain("shrink-0")
  })

  it("adds the classes that a page passes to the layout", () => {
    expect(classes(render({ className: "mt-8 gap-8" }), "side-panel-layout")).toEqual(
      expect.arrayContaining(["mt-8", "gap-8"])
    )
  })

  it("does not type check without a panel name", () => {
    // @ts-expect-error A panel must have a name.
    renderToStaticMarkup(<SidePanelLayout panel={<p>Queue</p>}>Details</SidePanelLayout>)
  })
})
