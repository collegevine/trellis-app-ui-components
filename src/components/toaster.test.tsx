import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Toaster, toast } from "./toaster.js"

describe("Toaster", () => {
  it("renders the notification region", () => {
    const html = renderToStaticMarkup(<Toaster />)
    expect(html).toContain('aria-label="Notifications')
  })

  it("re-exports Sonner's toast function", () => {
    expect(typeof toast).toBe("function")
    expect(typeof toast.success).toBe("function")
  })
})
