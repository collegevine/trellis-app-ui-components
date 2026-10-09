import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { Button, buttonVariants } from "./button.js"

function render(element: React.ReactElement) {
  return renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>)
}

describe("Button", () => {
  it("renders a button with the default style and size", () => {
    const html = render(<Button>Save</Button>)
    expect(html).toMatch(/^<button[^>]*type="button"/)
    expect(html).toContain("bg-primary")
    expect(html).toContain("h-8")
  })

  it("renders a link, not a button, when it has an href", () => {
    const html = render(
      <Button variant="outline" href="/students">
        All students
      </Button>
    )
    expect(html).toMatch(/^<a [^>]*href="\/students"/)
    expect(html).not.toContain('role="button"')
    expect(html).toContain("border-border")
  })

  it("lets a passed class replace the style's class for the same property", () => {
    const html = render(<Button className="bg-secondary">Save</Button>)
    expect(html).toContain("bg-secondary")
    expect(html).not.toMatch(/(^|\s)bg-primary(\s|")/)
  })

  it("accepts a className function from Base UI", () => {
    const html = render(<Button className={() => "mt-2"}>Save</Button>)
    expect(html).toContain("mt-2")
    expect(html).toContain("bg-primary")
  })
})

describe("buttonVariants", () => {
  it("returns the class string for a style and size", () => {
    const classes = buttonVariants({ variant: "ghost", size: "sm" })
    expect(classes).toContain("hover:bg-muted")
    expect(classes).toContain("h-7")
  })
})
