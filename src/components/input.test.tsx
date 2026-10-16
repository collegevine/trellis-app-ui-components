import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Input } from "./input.js"
import { Textarea } from "./textarea.js"

describe("Input", () => {
  it("renders an input with the text field's look", () => {
    const html = renderToStaticMarkup(<Input name="email" type="email" />)
    expect(html).toMatch(/^<input[^>]*type="email"/)
    expect(html).toContain('data-slot="input"')
    expect(html).toContain("border-input")
    expect(html).toContain("h-8")
  })

  it("passes aria-invalid through, so the error styles apply", () => {
    const html = renderToStaticMarkup(<Input aria-invalid />)
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain("aria-invalid:border-destructive")
  })

  it("lets a passed class replace the input's class for the same property", () => {
    const html = renderToStaticMarkup(<Input className="h-9" />)
    expect(html).toContain("h-9")
    expect(html).not.toMatch(/(^|\s)h-8(\s|")/)
  })

  it("accepts a className function from Base UI", () => {
    const html = renderToStaticMarkup(<Input className={() => "mt-2"} />)
    expect(html).toContain("mt-2")
    expect(html).toContain("border-input")
  })
})

describe("Textarea", () => {
  it("renders a textarea with the text field's look", () => {
    const html = renderToStaticMarkup(<Textarea name="note" />)
    expect(html).toMatch(/^<textarea[^>]*data-slot="textarea"/)
    expect(html).toContain("border-input")
    expect(html).toContain("min-h-16")
  })
})
