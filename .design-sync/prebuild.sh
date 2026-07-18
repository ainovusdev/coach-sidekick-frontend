#!/bin/sh -e
# design-sync prebuild (= cfg.buildCmd): everything the converter needs
# regenerated before package-build runs.
#  1. Tailwind v4 has no static stylesheet — compile globals.css with sources
#     pinned to src/, the authored previews, and the utility safelist.
#  2. The app ships no .d.ts tree — emit one from the ds-entry barrel so the
#     converter can extract real <Name>Props (package.json publishConfig.types
#     points at types/index.d.ts).
cd "$(dirname "$0")/.."

./.ds-sync/node_modules/.bin/tailwindcss -i .design-sync/tw-entry.css -o .design-sync/.cache/compiled.css

rm -rf types
./node_modules/.bin/tsc -p .design-sync/tsconfig.types.json
sed 's|\.\./src/|./src/|' .design-sync/ds-entry.ts > types/index.d.ts
echo "prebuild: compiled.css + types/ tree written"
