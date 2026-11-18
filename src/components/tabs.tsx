"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "../lib/utils.js"

/** Props for {@link Tabs}: every prop of Base UI's `Tabs.Root`. */
export type TabsProps = TabsPrimitive.Root.Props

/**
 * A set of tabs and the panels that they show. Holds a {@link TabsList} of
 * {@link TabsTrigger}s and one {@link TabsContent} for each tab.
 *
 * A line under the selected tab marks it, in the text color. No tab has a
 * fill, so a tab does not look like a button.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="all">
 *   <TabsList>
 *     <TabsTrigger value="all">All</TabsTrigger>
 *     <TabsTrigger value="admitted">Admitted</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="all">…</TabsContent>
 *   <TabsContent value="admitted">…</TabsContent>
 * </Tabs>
 * ```
 */
export function Tabs({ className, orientation = "horizontal", ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  )
}

/** Props for {@link TabsList}: every prop of Base UI's `Tabs.List`. */
export type TabsListProps = TabsPrimitive.List.Props

/** The row of tabs. Put one {@link TabsTrigger} in it for each tab. */
export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "group/tabs-list inline-flex w-fit items-center justify-center gap-1 p-1 text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=horizontal]/tabs:max-w-full group-data-[orientation=horizontal]/tabs:overflow-x-auto group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
        className
      )}
      {...props}
    />
  )
}

/** Props for {@link TabsTrigger}: every prop of Base UI's `Tabs.Tab`. */
export type TabsTriggerProps = TabsPrimitive.Tab.Props

/** One tab. Its `value` matches the `value` of the {@link TabsContent} that it shows. */
export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "after:absolute after:bg-foreground after:opacity-0 group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:-bottom-1 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

/** Props for {@link TabsContent}: every prop of Base UI's `Tabs.Panel`. */
export type TabsContentProps = TabsPrimitive.Panel.Props

/** The panel that a tab shows. */
export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}
