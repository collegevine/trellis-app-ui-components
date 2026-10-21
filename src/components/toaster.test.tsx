import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Toaster, toast } from "./toaster.js"

describe("Toaster", () => {
  it("renders the notification region", () => {
    const html = renderToStaticMarkup(<Toaster />)
    expect(html).toContain('aria-label="Notifications')
  })

  it("takes its font from the theme", () => {
    const { style } = Toaster({}).props
    expect(style.fontFamily).toBe("var(--font-sans)")
  })

  it("re-exports Sonner's toast function", () => {
    expect(typeof toast).toBe("function")
    expect(typeof toast.success).toBe("function")
  })
})
