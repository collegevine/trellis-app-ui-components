// @vitest-environment jsdom

import { act, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SidePanelLayout, type SidePanelLayoutProps } from "./side-panel-layout.js"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function mount(element: ReactElement) {
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(element))
  return container
}

const captured = new Set<number>()

beforeEach(() => {
  captured.clear()
  HTMLElement.prototype.setPointerCapture = vi.fn(function (this: HTMLElement, id: number) {
    captured.add(id)
  })
  HTMLElement.prototype.hasPointerCapture = vi.fn((id: number) => captured.has(id))
  HTMLElement.prototype.releasePointerCapture = vi.fn((id: number) => {
    captured.delete(id)
  })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function render(props: Partial<SidePanelLayoutProps> = {}) {
  return mount(
    <SidePanelLayout panel={<p>Applicants waiting for review</p>} panelLabel="Review queue" {...props}>
      <p>Transcript for Jordan Alvarez</p>
    </SidePanelLayout>
  )
}

function handle() {
  return container.querySelector<HTMLElement>('[role="separator"]')!
}

function panel() {
  return container.querySelector<HTMLElement>('[data-slot="side-panel"]')!
}

function main() {
  return container.querySelector<HTMLElement>('[data-slot="side-panel-main"]')!
}

function width() {
  return Number(handle().getAttribute("aria-valuenow"))
}

function press(key: string) {
  act(() => {
    handle().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
  })
}

function pointer(type: string, clientX: number, target: Element = handle(), buttons = type === "pointerup" ? 0 : 1) {
  const event = new MouseEvent(type, { clientX, bubbles: true, button: 0, buttons })
  Object.defineProperty(event, "pointerId", { value: 7 })
  act(() => {
    target.dispatchEvent(event)
  })
}

function shield() {
  return container.querySelector<HTMLElement>('[data-slot="side-panel-resize-shield"]')
}

function drag(from: number, to: number) {
  pointer("pointerdown", from)
  pointer("pointermove", to)
  pointer("pointerup", to)
}

describe("SidePanelLayout", () => {
  it("opens the panel at its default width, inside its bounds", () => {
    render()
    expect(width()).toBe(352)
    expect(handle().getAttribute("aria-valuemin")).toBe("256")
    expect(handle().getAttribute("aria-valuemax")).toBe("576")
    expect(panel().closest<HTMLElement>('[data-slot="side-panel-layout"]')!.style.getPropertyValue("--side-panel-width")).toBe(
      "352px"
    )
  })

  it("labels the panel and its resize handle, and ties the handle to the panel", () => {
    render()
    expect(panel().getAttribute("aria-label")).toBe("Review queue")
    expect(handle().getAttribute("aria-label")).toBe("Resize Review queue")
    expect(handle().getAttribute("aria-controls")).toBe(panel().id)
    expect(handle().getAttribute("aria-orientation")).toBe("vertical")
    expect(handle().tabIndex).toBe(0)
  })

  it("widens and narrows the panel with the arrow keys", () => {
    render({ side: "start" })
    press("ArrowRight")
    expect(width()).toBe(368)
    press("ArrowLeft")
    press("ArrowLeft")
    expect(width()).toBe(336)
  })

  it("widens a panel on the right with the left arrow, toward the main content", () => {
    render({ side: "end" })
    press("ArrowLeft")
    expect(width()).toBe(368)
    press("ArrowRight")
    press("ArrowRight")
    expect(width()).toBe(336)
  })

  it("jumps to the narrowest and widest width with Home and End", () => {
    render()
    press("End")
    expect(width()).toBe(576)
    press("Home")
    expect(width()).toBe(256)
  })

  it("never resizes the panel past its bounds with the keys", () => {
    render({ side: "start" })
    for (let i = 0; i < 40; i++) press("ArrowRight")
    expect(width()).toBe(576)
    for (let i = 0; i < 40; i++) press("ArrowLeft")
    expect(width()).toBe(256)
  })

  it("resizes the panel by the distance of a drag", () => {
    render({ side: "start" })
    drag(400, 480)
    expect(width()).toBe(432)
  })

  it("resizes a panel on the right by a drag toward the main content", () => {
    render({ side: "end" })
    drag(900, 820)
    expect(width()).toBe(432)
  })

  it("never resizes the panel past its bounds with a drag", () => {
    render({ side: "start" })
    drag(400, 2000)
    expect(width()).toBe(576)
    drag(400, -2000)
    expect(width()).toBe(256)
  })

  it("stops a drag when the pointer is released", () => {
    render({ side: "start" })
    drag(400, 480)
    pointer("pointermove", 600)
    expect(width()).toBe(432)
  })

  it("keeps the drag on the handle when the pointer passes over an embedded frame, such as a video player", () => {
    render({ side: "start" })
    pointer("pointerdown", 400)
    expect(HTMLElement.prototype.setPointerCapture).toHaveBeenCalledWith(7)
    expect(captured.has(7)).toBe(true)
  })

  it("covers the page while a drag runs, so an embedded frame from another site cannot take the pointer", () => {
    render({ side: "start" })
    expect(shield()).toBeNull()
    pointer("pointerdown", 400)
    expect(shield()!.className).toContain("fixed inset-0")
    pointer("pointermove", 480, shield()!)
    expect(width()).toBe(432)
    pointer("pointerup", 480, shield()!)
    expect(shield()).toBeNull()
  })

  it("stops a drag when a move arrives with no button pressed, such as after a release that the page missed", () => {
    render({ side: "start" })
    pointer("pointerdown", 400)
    pointer("pointermove", 600, handle(), 0)
    expect(width()).toBe(352)
    pointer("pointermove", 700)
    expect(width()).toBe(352)
  })

  it("stops a drag when the browser takes the pointer away", () => {
    render({ side: "start" })
    pointer("pointerdown", 400)
    pointer("lostpointercapture", 400)
    pointer("pointermove", 600)
    expect(width()).toBe(352)
  })

  it("stops text selection on the page while a drag runs", () => {
    render({ side: "start" })
    const layout = container.querySelector<HTMLElement>('[data-slot="side-panel-layout"]')!
    pointer("pointerdown", 400)
    expect(layout.hasAttribute("data-resizing")).toBe(true)
    expect(layout.className).toContain("data-resizing:select-none")
    pointer("pointerup", 400)
    expect(layout.hasAttribute("data-resizing")).toBe(false)
  })

  it("goes back to the default width on a double click on the handle", () => {
    render()
    press("End")
    act(() => {
      handle().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
    })
    expect(width()).toBe(352)
  })

  it("puts the main content first in reading order, so a small screen shows it above the panel", () => {
    render({ side: "start" })
    const children = [...container.querySelector('[data-slot="side-panel-layout"]')!.children]
    expect(children.indexOf(main())).toBeLessThan(children.indexOf(panel()))
  })

  it("stacks the panel under the main content on a small screen, at full width and with no handle", () => {
    render()
    const layout = container.querySelector<HTMLElement>('[data-slot="side-panel-layout"]')!
    expect(layout.className).toContain("flex-col")
    expect(layout.className).toContain("lg:flex-row")
    expect(panel().className).toContain("lg:w-(--side-panel-width)")
    expect(panel().className).not.toMatch(/(^|\s)w-/)
    expect(handle().className).toMatch(/(^|\s)hidden(\s|$)/)
    expect(handle().className).toContain("lg:flex")
  })

  it("shows the panel on the side that the page picks, on a large screen", () => {
    render({ side: "start" })
    expect(panel().className).toContain("lg:order-1")
    expect(main().className).toContain("lg:order-3")
    act(() => root.unmount())
    container.remove()
    render({ side: "end" })
    expect(main().className).toContain("lg:order-1")
    expect(panel().className).toContain("lg:order-3")
  })

  it("lets the main content shrink, so long content does not push the panel off the screen", () => {
    render()
    expect(main().className).toContain("min-w-0")
    expect(main().className).toContain("flex-1")
    expect(panel().className).toContain("shrink-0")
  })

  it("adds the classes that a page passes to the layout", () => {
    render({ className: "mt-8 gap-8" })
    expect(container.querySelector('[data-slot="side-panel-layout"]')!.className).toContain("mt-8")
  })
})
