import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Field, FieldError, FieldLabel } from "./field.js"
import { Input } from "./input.js"

describe("Field", () => {
  it("renders a labeled group, vertical by default", () => {
    const html = renderToStaticMarkup(
      <Field>
        <FieldLabel htmlFor="gpa">Minimum GPA</FieldLabel>
        <Input id="gpa" />
      </Field>
    )
    expect(html).toMatch(/^<div role="group" data-slot="field" data-orientation="vertical"/)
    expect(html).toContain('<label data-slot="field-label"')
    expect(html).toContain('for="gpa"')
    expect(html).toContain("flex-col")
  })

  it("puts the label beside the control when horizontal", () => {
    const html = renderToStaticMarkup(<Field orientation="horizontal" />)
    expect(html).toContain('data-orientation="horizontal"')
    expect(html).toContain("flex-row")
  })
})

describe("FieldError", () => {
  it("renders nothing with no children and no errors", () => {
    expect(renderToStaticMarkup(<FieldError />)).toBe("")
    expect(renderToStaticMarkup(<FieldError errors={[]} />)).toBe("")
  })

  it("renders its children as an alert", () => {
    const html = renderToStaticMarkup(<FieldError>Enter a GPA from 0 to 4.</FieldError>)
    expect(html).toMatch(/^<div role="alert" data-slot="field-error"/)
    expect(html).toContain("text-destructive")
    expect(html).toContain("Enter a GPA from 0 to 4.")
  })

  it("shows a repeated message once, without a list", () => {
    const html = renderToStaticMarkup(
      <FieldError errors={[{ message: "Required" }, { message: "Required" }]} />
    )
    expect(html).not.toContain("<ul")
    expect(html.match(/Required/g)).toHaveLength(1)
  })

  it("shows more than one message as a list", () => {
    const html = renderToStaticMarkup(
      <FieldError errors={[{ message: "Required" }, { message: "Too long" }]} />
    )
    expect(html).toContain("<ul")
    expect(html).toContain("<li>Required</li>")
    expect(html).toContain("<li>Too long</li>")
  })
})
