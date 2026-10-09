import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { Link } from "./link.js"

describe("Link", () => {
  it("renders a link to the address with the link look", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Link href="/students/42">Ana Silva</Link>
      </MemoryRouter>
    )
    expect(html).toMatch(/^<a [^>]*href="\/students\/42"/)
    expect(html).toContain("text-primary")
    expect(html).toContain("hover:underline")
  })
})
