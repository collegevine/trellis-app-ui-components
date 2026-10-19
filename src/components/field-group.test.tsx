// @vitest-environment jsdom

import { act, type ReactElement } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

import { FieldGroup, FieldSet } from "./field-group.js"
import { TextField } from "./text-field.js"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement

function render(element: ReactElement) {
  container = document.createElement("div")
  document.body.append(container)
  act(() => createRoot(container).render(element))
  return container
}

afterEach(() => container.remove())

describe("FieldGroup", () => {
  it("spaces fields at twice the gap between a label and its control", () => {
    const root = render(
      <FieldGroup>
        <TextField label="Street" />
        <TextField label="City" />
      </FieldGroup>
    )
    expect(root.querySelector("[data-slot=field-group]")!.className).toContain("gap-4")
    expect(root.querySelector("[data-slot=text-field]")!.className).toContain("gap-2")
  })
})

describe("FieldSet", () => {
  it("names the section with a legend around its fields", () => {
    const root = render(
      <FieldSet legend="Mailing address">
        <FieldGroup>
          <TextField label="Street" />
          <TextField label="City" />
        </FieldGroup>
      </FieldSet>
    )
    const fieldset = root.querySelector("fieldset")!
    expect(fieldset.textContent).toContain("Mailing address")
    expect(fieldset.querySelectorAll("input")).toHaveLength(2)
  })
})
