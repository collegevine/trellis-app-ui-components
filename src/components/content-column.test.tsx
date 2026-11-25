import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ContentColumn, type ContentColumnWidth } from "./content-column.js"

function render(width: ContentColumnWidth, className?: string) {
  return renderToStaticMarkup(
    <ContentColumn width={width} className={className}>
      <p>Applications by week</p>
    </ContentColumn>
  )
}

function column(html: string) {
  return html.match(/<div[^>]*data-slot="content-column"[^>]*>/)?.[0] ?? ""
}

function gutter(html: string) {
  return html.match(/<div[^>]*data-slot="content-column-gutter"[^>]*>/)?.[0] ?? ""
}

function maxWidths(tag: string) {
  return tag.match(/(?<![\w-])max-w-[\w-]+/g) ?? []
}

describe("ContentColumn", () => {
  it.each([
    ["small", "max-w-xl"],
    ["medium", "max-w-4xl"],
    ["large", "max-w-7xl"],
  ] as const)("stops the %s column at %s", (width, cap) => {
    expect(maxWidths(column(render(width)))).toEqual([cap])
  })

  it("gives the full column no cap", () => {
    expect(maxWidths(column(render("full")))).toEqual(["max-w-none"])
  })

  it("centers the column and lets it fill the space below its cap", () => {
    const tag = column(render("large"))
    expect(tag).toContain("mx-auto")
    expect(tag).toContain("w-full")
  })

  it("puts the side padding outside the cap, so the content reaches the full cap", () => {
    const html = render("large")
    expect(gutter(html)).toContain("px-4")
    expect(gutter(html)).toContain("md:px-6")
    expect(column(html)).not.toMatch(/(?<![\w-])(?:md:)?px-/)
  })

  it("keeps the cap of its width when a page passes its own max width", () => {
    expect(maxWidths(column(render("medium", "max-w-5xl")))).toEqual(["max-w-4xl"])
    expect(maxWidths(column(render("full", "max-w-5xl")))).toEqual(["max-w-none"])
  })

  it("adds the other classes that a page passes, such as spacing between sections", () => {
    expect(column(render("large", "flex flex-col gap-6 py-6"))).toContain("flex flex-col gap-6 py-6")
  })

  it("has no default width, so every page picks one", () => {
    // @ts-expect-error A page must pick a width.
    renderToStaticMarkup(<ContentColumn>Applications by week</ContentColumn>)
  })
})
