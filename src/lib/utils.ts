import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Join class names into one string. Accepts strings, arrays, and objects whose
 * keys are class names and whose values turn each class on or off.
 *
 * Where two Tailwind classes set the same property, the later one wins. So a
 * class passed to a component through `className` replaces the component's own
 * class for that property, and the two never apply together.
 *
 * @example
 * ```tsx
 * <div className={cn("rounded-md p-4", isActive && "bg-muted", className)} />
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
