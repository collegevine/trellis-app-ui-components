// @vitest-environment jsdom

import { act, type ReactElement } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

import { FieldGroup, FieldSet } from "./field-group.js"
import { TextArea, TextField } from "./text-field.js"

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

function describedBy(control: Element) {
  return (control.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent)
}

describe("TextField", () => {
  it("connects its visible label to the input", () => {
    const root = render(<TextField label="Minimum GPA" name="gpa" />)
    const input = root.querySelector("input")!
    const label = root.querySelector("label")!
    expect(label.textContent).toBe("Minimum GPA")
    expect(label.htmlFor).toBe(input.id)
    expect(input.name).toBe("gpa")
    expect(input.className).toContain("border-input")
  })

  it("does not type check without a label", () => {
    // @ts-expect-error A text field must have a label.
    const field = <TextField name="gpa" />
    expect(field).toBeTruthy()
  })

  it("shows the error under the input and marks the input invalid", () => {
    const root = render(
      <TextField label="Minimum GPA" description="On a 4.0 scale." error="Enter a GPA from 0 to 4." />
    )
    const input = root.querySelector("input")!
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(root.textContent).toContain("Enter a GPA from 0 to 4.")
    expect(describedBy(input)).toEqual(
      expect.arrayContaining(["On a 4.0 scale.", "Enter a GPA from 0 to 4."])
    )
    const error = [...root.querySelectorAll("div")].find(
      (element) => element.textContent === "Enter a GPA from 0 to 4."
    )!
    expect(error.className).toContain("text-destructive")
    expect(input.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("shows no error and leaves the input valid without one", () => {
    const root = render(<TextField label="Minimum GPA" />)
    expect(root.querySelector("input")!.hasAttribute("aria-invalid")).toBe(false)
    expect(root.querySelector(".text-destructive")).toBeNull()
  })

  it("puts a passed class on the whole field, not the input", () => {
    const root = render(<TextField label="Minimum GPA" className="col-span-2" />)
    expect(root.firstElementChild!.className).toContain("col-span-2")
    expect(root.querySelector("input")!.className).not.toContain("col-span-2")
  })

  it("disables the input when the field is disabled", () => {
    const root = render(<TextField label="Minimum GPA" disabled />)
    expect(root.querySelector("input")!.disabled).toBe(true)
  })
})

describe("TextField browser checks", () => {
  function type(input: HTMLInputElement, value: string) {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
    act(() => {
      setValue.call(input, value)
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })
  }

  function errorText(input: HTMLInputElement) {
    return input.closest("[data-slot=text-field]")!.querySelector(".text-destructive")?.textContent
  }

  it("shows a failed check under the first field on submit and puts the cursor there", () => {
    const root = render(
      <form>
        <FieldSet legend="Contact">
          <TextField label="Name" name="name" />
          <TextField label="Email" name="email" type="email" required />
          <TextField label="Phone" name="phone" required />
        </FieldSet>
      </form>
    )
    const email = root.querySelector<HTMLInputElement>("input[name=email]")!
    const phone = root.querySelector<HTMLInputElement>("input[name=phone]")!
    act(() => root.querySelector("form")!.requestSubmit())
    expect(email.getAttribute("aria-invalid")).toBe("true")
    expect(errorText(email)).toBe(email.validationMessage)
    expect(errorText(phone)).toBe(phone.validationMessage)
    expect(document.activeElement).toBe(email)
  })

  it("shows a failed check when the user leaves a field that they edited, and clears it when fixed", () => {
    const root = render(<TextField label="Email" name="email" type="email" />)
    const input = root.querySelector("input")!
    act(() => input.focus())
    act(() => input.blur())
    expect(errorText(input)).toBeUndefined()
    act(() => input.focus())
    type(input, "jacob")
    act(() => input.blur())
    expect(errorText(input)).toBe(input.validationMessage)
    type(input, "jacob@example.edu")
    expect(errorText(input)).toBeUndefined()
    expect(input.hasAttribute("aria-invalid")).toBe(false)
  })

  it("shows the app's error over the browser's message", () => {
    const root = render(
      <form>
        <TextField label="Email" name="email" required error="Enter the student's school email." />
      </form>
    )
    act(() => root.querySelector("form")!.requestSubmit())
    expect(errorText(root.querySelector("input")!)).toBe("Enter the student's school email.")
  })

  it("still calls the app's own blur, change and invalid handlers", () => {
    const calls: string[] = []
    const root = render(
      <form>
        <TextField
          label="Email"
          name="email"
          required
          onBlur={() => calls.push("blur")}
          onChange={() => calls.push("change")}
          onInvalid={() => calls.push("invalid")}
        />
      </form>
    )
    const input = root.querySelector("input")!
    act(() => root.querySelector("form")!.requestSubmit())
    type(input, "a")
    act(() => input.blur())
    expect(calls).toEqual(["invalid", "change", "blur"])
  })
})

describe("TextArea", () => {
  it("renders a labeled textarea that grows with its text", () => {
    const root = render(<TextArea label="Note to the student" name="note" error="Write a note." />)
    const textarea = root.querySelector("textarea")!
    expect(root.querySelector("label")!.htmlFor).toBe(textarea.id)
    expect(textarea.className).toContain("field-sizing-content")
    expect(textarea.getAttribute("aria-invalid")).toBe("true")
    expect(describedBy(textarea)).toContain("Write a note.")
  })
})

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
