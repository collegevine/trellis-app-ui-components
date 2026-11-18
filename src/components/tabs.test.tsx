import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs.js"

function render() {
  return renderToStaticMarkup(
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="admitted">Admitted</TabsTrigger>
      </TabsList>
      <TabsContent value="all">Every applicant</TabsContent>
      <TabsContent value="admitted">Admitted applicants</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("marks the selected tab with a line in the text color", () => {
    expect(render()).toContain("after:bg-foreground")
  })

  it("shows the line only under the selected tab", () => {
    const html = render()
    expect(html).toContain("after:opacity-0")
    expect(html).toContain("data-active:after:opacity-100")
    expect(html).toMatch(/<button[^>]*\sdata-active=""[^>]*>All</)
    expect(html).not.toMatch(/<button[^>]*\sdata-active=""[^>]*>Admitted</)
  })

  it("changes the selected tab at once, with no motion", () => {
    expect(render()).not.toContain("transition")
  })

  it("gives the tabs no fill, so a tab does not look like a button", () => {
    const html = render()
    expect(html).not.toContain("bg-muted")
    expect(html).not.toContain("data-active:bg-background")
  })

  it("lets a row of tabs that is wider than the screen scroll sideways", () => {
    const html = render()
    expect(html).toContain("group-data-[orientation=horizontal]/tabs:max-w-full")
    expect(html).toContain("group-data-[orientation=horizontal]/tabs:overflow-x-auto")
  })

  it("lays out the tabs by the orientation that Base UI writes on the root", () => {
    const html = render()
    expect(html).toContain('data-orientation="horizontal"')
    expect(html).toContain("data-[orientation=horizontal]:flex-col")
    expect(html).not.toMatch(/(^|\s)data-horizontal:/)
  })
})
