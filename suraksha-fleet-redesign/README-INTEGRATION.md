# SURAKSHA — Fleet-inspired redesign (drop-in files)

These are **presentation-only** replacements. No file here touches
`services/`, `routing/`, `types/`, or `backend/` — so nothing about
how the app fetches or computes data changes. Verified with a clean
`vite build` (succeeds) and `tsc -b` (same pre-existing type warnings
as your original repo, zero new ones introduced).

## What changed

- New `src/theme.ts` — single source of design tokens (colors, radius, shadow, font)
- `src/index.css`, `src/App.css` — Inter font, light background, scrollbar styling
- `src/App.tsx` — light navy header bar, light page shell, dark map viewport kept as the operational centerpiece
- `src/components/Sidebar/Sidebar.tsx` — white cards, soft shadows, blue accent (was all dark slate)
- `src/components/Legend/Legend.tsx`, `RoadInfo/RoadInfo.tsx` — restyled as glass overlays on the dark map
- `src/components/Alerts/AlertDetailsModal.tsx` — light modal card
- `src/components/RouteSelector/RouteSelector.tsx`, `Demo/DemoScenarioPanel.tsx` — restyled to match

## How to apply

1. Copy each file in this folder into the matching path under your
   `frontend/src/` (same relative structure — just overwrite).
2. `npm run dev` — no new dependencies were added, `theme.ts` is the
   only new file.
3. Google Fonts (Inter) loads via `@import` in `index.css`. If you
   want it self-hosted instead of a CDN import, say so and I'll switch it.

## Why the sidebar/UI is light but the map stays dark

Fleet is a light corporate marketing template — full color inversion
of a _live operational map_ would hurt legibility of your MapLibre
dark basemap and risk overlays. This keeps the map as the dramatic,
high-contrast "control tower" centerpiece (a very common ops-dashboard
pattern) while every panel _around_ it — header, sidebar, legend,
modals — picks up Fleet's white surfaces, navy type, single blue
accent, soft shadows and rounded cards. If you actually want a fully
light map too, that's a MapLibre style change in `MapComponent.tsx`
(untouched here) — let me know and I can do that next.
