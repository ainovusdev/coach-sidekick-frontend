# design-sync notes — coach-sidekick-frontend

Repo-specific gotchas for future syncs. The design system is the app's
`src/components/ui/` (40 components, shadcn/ui-based + custom pieces); there is
no library build and no Storybook — the converter runs in package shape with an
explicit barrel entry.

## Build setup

- **Entry**: `.design-sync/ds-entry.ts` (committed barrel re-exporting every
  `src/components/ui/*.tsx`). Regenerate it when components are added/removed:
  each line is `export * from "../src/components/ui/<name>";`. Always pass
  `--entry .design-sync/ds-entry.ts` — without it the converter looks for
  `node_modules/coach-sidekick` and dies (the app isn't self-installed).
- **buildCmd is `sh .design-sync/prebuild.sh`** — run it before package-build,
  always. It (1) compiles Tailwind CSS and (2) emits the `.d.ts` tree.
- **CSS**: Tailwind v4 has no static stylesheet — prebuild compiles
  `.design-sync/tw-entry.css` (imports `src/app/globals.css`, adds `@source`
  for `src/`, `.design-sync/previews/` and `tw-safelist.txt`) into
  `.design-sync/.cache/compiled.css` (= `cfg.cssEntry`). Preview-only utility
  classes only exist in the CSS after a recompile — `preview-rebuild.mjs` does
  NOT rerun it, so preview authors must stick to already-compiled/safelisted
  classes and use inline styles for one-off scaffolding (arbitrary-value
  classes silently no-op).
- **d.ts tree**: the app ships no types, so prebuild emits declarations from
  the barrel via `.design-sync/tsconfig.types.json` into the gitignored
  `types/` dir and writes `types/index.d.ts` (path-adjusted barrel copy).
  `package.json` `publishConfig.types: "types/index.d.ts"` (inert for this
  private app) is how findTypesRoot/projectFor locate it — without this the
  emitted `<Name>Props` are `[key: string]: unknown` stubs. shadcn components
  have no exported Props interfaces; extraction rides the call-signature
  fallback, so the entry chain must resolve.
- **Safelist**: `.design-sync/tw-safelist.txt` (~1450 classes) guarantees the
  common utility vocabulary (DS token colors × bg/text/border/ring, spacing,
  flex/grid, typography) for designs built in claude.ai/design. Previews should
  stick to safelisted/common utilities; exotic ones need a CSS recompile.
- **Fonts**: the app injects Geist via `next/font` at runtime, so the bundle
  ships its own — `.design-sync/fonts/geist.css` (+ variable woff2s from the
  `geist` npm package, OFL license alongside) defines `@font-face` AND the
  `--font-geist-sans`/`--font-geist-mono` variables globals.css references.
- **Permission shim**: `cfg.tsconfig` points at `.design-sync/tsconfig.dsync.json`
  which remaps `@/contexts/permission-context` →
  `.design-sync/shims/permission-context.tsx` (grant-all, no-op gate). The real
  module chains to auth-context → next/navigation + axios + posthog: bundling
  it crashes every preview with `process is not defined` (next internals read
  `process.env.NEXT_RUNTIME`) and bloats the bundle ~500KB. ClientCard renders
  as fully permitted in previews/designs — by design.
- **Groups**: come from `@category` JSDoc tags added to each component source
  (actions / forms / overlays / data-display / feedback / patterns). New
  components need a JSDoc description + `@category` tag before the primary
  declaration or they land in "general".
- **guidelinesGlob is []** on purpose — the repo's `docs/` holds app/feature
  docs (schema analysis, migration notes), not design guidelines.
- **Playwright**: macOS cache at `~/Library/Caches/ms-playwright` had chromium
  1228; playwright(-core) latest pins 1228 — installed into `.ds-sync/`.

## Component quirks

- **ThemeToggle**: next-themes `useTheme` works without a provider (stub
  values) — renders fine, toggle is a no-op in previews.
- **Toast / DetailSidePanel**: `position: fixed` components — cardMode:single
  with explicit viewports (cfg.overrides). Toast never self-dismisses in
  previews (stub onClose) but pass a huge `duration` anyway.
- **Radix overlays** (Dialog/AlertDialog/Sheet/Popover/Tooltip/DropdownMenu/
  Select/ConfirmationDialog): cardMode:single; previews force the open state
  via `open`/`defaultOpen`; the FIRST export in the preview .tsx is what the
  single card renders. Portals + autofocus rings render fine in the capture
  iframe (focus ring on first focusable is genuine open-state behavior).
  Anchored overlays (Popover/Tooltip) need `min-h` flex wrappers to give the
  floating panel room — the story body is height-auto.
- **`.ds-single` transform trap**: the single-card harness wraps the story in
  `transform: translateZ(0)`, which becomes the containing block for
  `position: fixed` descendants — percentage-sized fixed components (`h-full`,
  `inset-y-0`) collapse to 0 height with NO console errors (header renders,
  body empty). Workaround used in `previews/DetailSidePanel.tsx`: wrap in
  `<div style={{height:'100vh', transform:'translateZ(0)'}}>`. Intrinsically
  sized fixed elements (Toast) are unaffected; Sheet sizes by content+inset
  within the Radix portal and captured fine — re-check it if its layout changes.
- **Subcomponent exports** (CardHeader, DialogTrigger, …~97 of them) are
  excluded from the card list via componentSrcMap nulls but ARE bundle exports
  (`window.CoachSidekick.*`, 137 total) and are importable in previews/designs.
- **Textarea has no aria-invalid styling** (Input/Checkbox/RadioGroupItem do)
  — error states need vermillion helper text. Component-level DS gap.
- **Select trigger placeholder** renders full-ink (source uses `placeholder:`
  pseudo-element variant instead of Radix `data-[placeholder]`) — faithful
  render of a source quirk.
- **No typography plugin**: RichTextEditor's `prose` classes are inert;
  headings render as body text (true in production too).
- **Skeleton `bg-accent` is faint** — frame skeleton compositions in
  `border-line` cards so cells read as deliberate.
- **ClientCard health dots** compute from `Date.now()` — preview dates are
  generated relative to now (`daysAgo` helper), never fixed ISO strings.
- **Button sizes** are default/sm/lg/icon only (no icon-sm). Old-style
  DropdownMenuItem has no built-in icon gap — use `mr-2` on leading icons.
- Content hygiene: never use real coach/client names from repo or ops context
  in previews (several leaked in during authoring and were scrubbed before
  upload). Reuse the established fictional roster: Maya Chen, Nadia Osei,
  Tom Alvarez, Elena Brooks, Marcus Webb/Bell, Priya Sharma, Dana Whitfield,
  Jordan Blake/Miles.
- Single-mode card faces render `primaryStory` (pinned in cfg.overrides for
  all 9 single-mode components) — NOT the preview file's source order; without
  a pin the face is the alphabetically-first export.

## Known render warns

- (none — final validate was warning-free; the 4 pre-authoring [RENDER_BLANK]
  flags disappeared once previews were authored)

## Re-sync risks

- `.design-sync/.cache/compiled.css` is generated: a fresh clone must run
  `cfg.buildCmd` before the converter or the build fails/[CSS] goes stale.
- The ds-entry barrel + componentSrcMap pins + `@category` tags are three
  parallel lists a new component must join (barrel line, pin, JSDoc) — miss one
  and the component silently doesn't sync.
- Geist woff2s are vendored copies of the `geist` npm package (not the app's
  own next/font output); a Geist redesign upstream won't propagate untouched.
- The permission shim mirrors the surface ClientCard consumes
  (usePermissions().isViewer/hasPermission, PermissionGate) — if
  permission-context or ClientCard's usage grows, extend the shim.
