// @vitest-environment jsdom

import { act, useState, type ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

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
  it("puts the panel beside the main content at the small width, on every page", () => {
    render()
    expect(panel()!.tagName).toBe("ASIDE")
    expect(panel()!.className.split(" ")).toContain("w-sm")
    expect(panel()!.textContent).toBe("Applicants waiting for review")
    expect(byslot("side-panel-layout")!.className.split(" ")).toContain("flex-row")
  })

  it("names the panel for screen readers", () => {
    render()
    expect(panel()!.getAttribute("aria-label")).toBe("Review queue")
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
