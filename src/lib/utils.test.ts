import { describe, expect, it } from "vitest"
import { cn } from "./utils.js"

describe("cn", () => {
  it("joins class names and drops falsy ones", () => {
    expect(cn("p-4", false, undefined, "text-sm")).toBe("p-4 text-sm")
  })

  it("keeps the later of two classes that set the same property", () => {
    expect(cn("p-4 bg-primary", "bg-secondary")).toBe("p-4 bg-secondary")
  })
})
