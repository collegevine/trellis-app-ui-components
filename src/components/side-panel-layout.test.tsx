// @vitest-environment jsdom

import { act, useState, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SidePanelLayout, type SidePanelLayoutProps } from "./side-panel-layout.js"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
let wide = true
const listeners = new Set<() => void>()

window.matchMedia = ((query: string) => ({
  get matches() {
    return query === "(min-width: 1024px)" && wide
  },
  media: query,
  addEventListener: (_: string, listener: () => void) => listeners.add(listener),
  removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
})) as unknown as typeof window.matchMedia

function setScreen(isWide: boolean) {
  wide = isWide
  act(() => listeners.forEach((listener) => listener()))
}

function mount(element: ReactElement) {
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(element))
}

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.body.innerHTML = ""
  wide = true
})

function render(props: Partial<SidePanelLayoutProps> = {}) {
  mount(
    <SidePanelLayout panel={<p>Applicants waiting for review</p>} panelLabel="Review queue" {...props}>
      <p>Transcript for Jordan Alvarez</p>
    </SidePanelLayout>
  )
}

const byslot = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
const trigger = () => byslot("side-panel-trigger")
const panel = () => byslot("side-panel")
const main = () => byslot("side-panel-main")
const closeButton = () => document.querySelector<HTMLButtonElement>('[aria-label="Close Review queue"]')
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 50)))

describe("SidePanelLayout on a wide screen", () => {
  it("puts the panel beside the main content at the width that the resize handle sets", () => {
    render()
    expect(panel()!.tagName).toBe("ASIDE")
    expect(panel()!.className.split(" ")).toContain("w-(--side-panel-width)")
    expect(panel()!.textContent).toBe("Applicants waiting for review")
    expect(byslot("side-panel-layout")!.className.split(" ")).toContain("flex-row")
  })

  it("names the panel for screen readers", () => {
    render()
    expect(panel()!.getAttribute("aria-label")).toBe("Review queue")
  })

  it("shows no button to open the panel, and no resize handle on a small screen", () => {
    wide = false
    render()
    expect(document.querySelector('[role="separator"]')).toBeNull()
    act(() => root.unmount())
    wide = true
  })

  it("shows no button to open the panel", () => {
    render()
    expect(trigger()).toBeNull()
  })

  it("shows the panel on the side that the page picks", () => {
    render({ side: "start" })
    expect(panel()!.className).toContain("order-1")
    expect(main()!.className).toContain("order-3")
    act(() => root.unmount())
    render({ side: "end" })
    expect(main()!.className).toContain("order-1")
    expect(panel()!.className).toContain("order-3")
  })

  it("puts the main content first in reading order", () => {
    render({ side: "start" })
    const children = [...byslot("side-panel-layout")!.children]
    expect(children.indexOf(main()!)).toBeLessThan(children.indexOf(panel()!))
  })

  it("lets the main content shrink, so long content does not push the panel off the screen", () => {
    render()
    expect(main()!.className.split(" ")).toEqual(expect.arrayContaining(["min-w-0", "flex-1"]))
    expect(panel()!.className.split(" ")).toContain("shrink-0")
  })

  it("adds the classes that a page passes to the layout", () => {
    render({ className: "mt-8 gap-8" })
    expect(byslot("side-panel-layout")!.className.split(" ")).toEqual(expect.arrayContaining(["mt-8", "gap-8"]))
  })

  it("does not type check without a panel name", () => {
    // @ts-expect-error A panel must have a name.
    const layout = <SidePanelLayout panel={<p>Queue</p>}>Details</SidePanelLayout>
    expect(layout).toBeTruthy()
  })
})

describe("SidePanelLayout on a small screen", () => {
  it("hides the panel behind a button above the main content, named for the panel", () => {
    wide = false
    render()
    expect(panel()).toBeNull()
    expect(trigger()!.textContent).toBe("Review queue")
    expect(main()!.textContent).toBe("Transcript for Jordan Alvarez")
    const children = [...byslot("side-panel-layout")!.children]
    expect(children.indexOf(trigger()!)).toBeLessThan(children.indexOf(main()!))
  })

  it("opens the panel in a drawer that covers most of the screen, above a dimmed page", async () => {
    wide = false
    render()
    await act(async () => trigger()!.click())
    expect(panel()!.textContent).toContain("Applicants waiting for review")
    expect(panel()!.getAttribute("role")).toBe("dialog")
    expect(panel()!.className.split(" ")).toEqual(expect.arrayContaining(["fixed", "w-11/12", "max-w-sm"]))
    expect(document.querySelector('[class*="bg-foreground/30"]')).not.toBeNull()
  })

  it("slides the drawer in from the panel's side", async () => {
    wide = false
    render({ side: "start" })
    await act(async () => trigger()!.click())
    expect(panel()!.className.split(" ")).toContain("left-0")
    act(() => root.unmount())
    document.body.innerHTML = ""
    render({ side: "end" })
    await act(async () => trigger()!.click())
    expect(panel()!.className.split(" ")).toContain("right-0")
  })

  it("closes the drawer from its close button", async () => {
    wide = false
    render()
    await act(async () => trigger()!.click())
    await act(async () => closeButton()!.click())
    await settle()
    expect(panel()).toBeNull()
  })

  it("lets the page close the drawer from inside the panel, such as when a person picks an item", async () => {
    wide = false
    function Page() {
      const [open, setOpen] = useState(false)
      return (
        <SidePanelLayout
          panelLabel="Review queue"
          panelOpen={open}
          onPanelOpenChange={setOpen}
          panel={
            <button type="button" onClick={() => setOpen(false)}>
              Jordan Alvarez
            </button>
          }
        >
          <p>Transcript</p>
        </SidePanelLayout>
      )
    }
    mount(<Page />)
    await act(async () => trigger()!.click())
    const item = [...panel()!.querySelectorAll("button")].find((b) => b.textContent === "Jordan Alvarez")!
    await act(async () => item.click())
    await settle()
    expect(panel()).toBeNull()
  })

  it("moves the panel back beside the main content when the screen widens", async () => {
    wide = false
    render()
    await act(async () => trigger()!.click())
    setScreen(true)
    await settle()
    expect(trigger()).toBeNull()
    expect(document.querySelectorAll('[data-slot="side-panel"]')).toHaveLength(1)
    expect(panel()!.tagName).toBe("ASIDE")
  })
})

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


function handle() {
  return container.querySelector<HTMLElement>('[role="separator"]')!
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

describe("SidePanelLayout resizing", () => {
  it("opens the panel at its default width, inside its bounds", () => {
    render()
    expect(width()).toBe(384)
    expect(handle().getAttribute("aria-valuemin")).toBe("256")
    expect(handle().getAttribute("aria-valuemax")).toBe("576")
    expect(panel()!.closest<HTMLElement>('[data-slot="side-panel-layout"]')!.style.getPropertyValue("--side-panel-width")).toBe(
      "384px"
    )
  })

  it("labels the panel and its resize handle, and ties the handle to the panel", () => {
    render()
    expect(panel()!.getAttribute("aria-label")).toBe("Review queue")
    expect(handle().getAttribute("aria-label")).toBe("Resize Review queue")
    expect(handle().getAttribute("aria-controls")).toBe(panel()!.id)
    expect(handle().getAttribute("aria-orientation")).toBe("vertical")
    expect(handle().tabIndex).toBe(0)
  })

  it("widens and narrows the panel with the arrow keys", () => {
    render({ side: "start" })
    press("ArrowRight")
    expect(width()).toBe(400)
    press("ArrowLeft")
    press("ArrowLeft")
    expect(width()).toBe(368)
  })

  it("widens a panel on the right with the left arrow, toward the main content", () => {
    render({ side: "end" })
    press("ArrowLeft")
    expect(width()).toBe(400)
    press("ArrowRight")
    press("ArrowRight")
    expect(width()).toBe(368)
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
    expect(width()).toBe(464)
  })

  it("resizes a panel on the right by a drag toward the main content", () => {
    render({ side: "end" })
    drag(900, 820)
    expect(width()).toBe(464)
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
    expect(width()).toBe(464)
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
    expect(width()).toBe(464)
    pointer("pointerup", 480, shield()!)
    expect(shield()).toBeNull()
  })

  it("stops a drag when a move arrives with no button pressed, such as after a release that the page missed", () => {
    render({ side: "start" })
    pointer("pointerdown", 400)
    pointer("pointermove", 600, handle(), 0)
    expect(width()).toBe(384)
    pointer("pointermove", 700)
    expect(width()).toBe(384)
  })

  it("stops a drag when the browser takes the pointer away", () => {
    render({ side: "start" })
    pointer("pointerdown", 400)
    pointer("lostpointercapture", 400)
    pointer("pointermove", 600)
    expect(width()).toBe(384)
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
    expect(width()).toBe(384)
  })





})
