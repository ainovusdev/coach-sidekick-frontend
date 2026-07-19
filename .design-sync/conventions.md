# Coach Sidekick DS — build conventions

## Setup: none required

Components need **no provider or wrapper** — import from `window.CoachSidekick` and render. Tooltip ships its own provider internally. Fonts (Geist / Geist Mono) load from the bundled `@font-face` and apply to everything automatically. Dark mode is class-based: add `class="dark"` to a root element to flip every token; never hard-code dark values. `ClientCard` renders as fully-permitted (the app's permission system doesn't exist here — by design).

## Styling idiom: Tailwind utilities + the DS token vocabulary

Style layout glue with Tailwind utility classes, and always reach for the DS tokens below instead of raw Tailwind palette colors (`bg-gray-100`, `text-red-600` are wrong — they bypass dark mode and the brand):

| Family         | Classes                                                                                                                                      | Use                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Backgrounds    | `bg-paper`, `bg-surface-1`, `bg-surface-2`, `bg-surface-3`                                                                                   | page, card, subtle fill, hover fill                                                          |
| Text           | `text-ink`, `text-ink-2`, `text-ink-3`, `text-ink-4`, `text-ink-on-dark`                                                                     | primary → faint; on-dark                                                                     |
| Borders        | `border-line`, `border-line-2`, `border-line-strong`, `divide-line`                                                                          | default rule, faint, emphasized                                                              |
| Accent         | `text-ds-accent`, `bg-ds-accent-bg`, `ring-ds-accent`                                                                                        | links, focus, selected                                                                       |
| Status pairs   | `text-forest`/`bg-forest-bg`, `text-vermillion`/`bg-vermillion-bg`, `text-amber-token`/`bg-amber-token-bg`, `text-indigo`/`bg-indigo-bg`     | success, error/destructive, warning, info — chip text color always pairs with its `-bg` tint |
| shadcn aliases | `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `border-border` | equivalent semantic layer used inside the components                                         |
| Radius         | `rounded-sm/md/lg/xl`                                                                                                                        | derived from the DS `--radius` (10px base)                                                   |

Aesthetic: neutral ink-on-paper; color appears only as status/accent. No decorative gradients (the DS forbids them). Body text is Geist; `font-mono` gives Geist Mono.

## Composition

Compound components export flat: `Card` + `CardHeader/CardTitle/CardDescription/CardAction/CardContent/CardFooter`, `Dialog` + `DialogTrigger/DialogContent/DialogHeader/DialogFooter/DialogTitle/DialogDescription`, same pattern for Select, Table, Tabs, Sheet, DropdownMenu, Accordion, AlertDialog, Avatar, RadioGroup, Tooltip, Popover, Collapsible, ScrollArea. All 137 exports are on `window.CoachSidekick`. Button variants: `default | secondary | outline | ghost | link | destructive`; sizes `sm | default | lg | icon`. Badge variants: `default | secondary | destructive | outline` (status chips: `className="bg-forest-bg text-forest"` etc.).

## Where the truth lives

Read `styles.css` → `_ds_bundle.css` (all tokens under `:root` and `.dark`, plus every compiled utility) before inventing a class — if a utility isn't in there, it won't style. Per-component API: `components/<group>/<Name>/<Name>.d.ts`; usage patterns and real examples: `<Name>.prompt.md`.

## Idiomatic example

```jsx
const { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, Button, Badge } = window.CoachSidekick

<div className="bg-paper min-h-screen p-8">
  <div className="mx-auto max-w-md">
    <Card>
      <CardHeader>
        <CardTitle>Leadership coaching with Maya Chen</CardTitle>
        <CardDescription>Tomorrow at 2:00 PM · Zoom</CardDescription>
        <CardAction><Badge variant="secondary">Scheduled</Badge></CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-ink-2">Third session this quarter — delegation follow-up.</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Join session</Button>
        <Button size="sm" variant="outline">View prep notes</Button>
      </CardFooter>
    </Card>
  </div>
</div>
```
