# Jadeite Systems · Office Admin (Figma Make)

Clickable prototype of the **Office Admin** platform for Jadeite Glazing (windows, doors, bifolds, orangeries).
React 19 + Vite + TypeScript, running inside Figma Make. The design follows the client-approved layout (Figma node 25:2) — keep it.

## Development server
A Vite dev server is already running on `$PORT` (default 8443). Changes hot-reload in the preview.

## Structure
- `src/main.tsx` – entry: HashRouter → StoreProvider → ToastProvider → App. Imports Sora font, `src/index.css`, `src/styles/app.css`.
- `src/App.tsx` – all routes (login, welcome tour, dashboard, enquiries, pipeline, appointments, customers, quotes, jobs, job detail, surveys, orders, deliveries, installations, installation diary, snags, aftercare, messages, portal, payments, reports, settings).
- `src/components/Layout.tsx` – sidebar (platform menu), header (⌘K search, notifications, profile menu), footer.
- `src/components/ui.tsx` – shared UI: Card, Tag, Avatar, Tabs, Modal, Drawer, Field, Switch, Toast, Photo, Stat…
- `src/components/Forms.tsx` – all workflow modals (new enquiry, assign, book survey, book/change installation, delivery problem, sign-off with signature, tasks, appointments, link email, log call).
- `src/components/charts.tsx` – simple SVG charts.
- `src/data/mock.ts` – sample data; `src/data/store.tsx` – shared demo state (saved in sessionStorage; "Reset demo data" in the profile menu clears it). Demo "today" is 16 Oct 2026.
- `public/images` – property photos and the Jadeite J logo (use relative paths like `images/house.jpg`).

## Design system (do not drift)
- Font: Sora (400–700). Plain CSS tokens in `src/styles/app.css` — reuse its classes (`card`, `tag`, `btn`, `input`, `list`, `grid-2`, `hstack`, `vstack`, `between`, `muted`…).
- Colours: primary `#00c7a1`, primary-dark `#0b6e5c`, deep `#0b1f1b`, tint `#ebf7f3`, page `#f6f8f7`, border `#e3e9e7`, text `#0f1414` / `#3a4a4a` / `#6b7a78`, ok `#1f9d5b`, warn `#e0a100`, error `#d64545`, info `#2f6fde`.
- Calm, simple, jargon-free wording (main users are 60+). Real property photos where they help.
- Tailwind utilities are available, but Tailwind's base reset is intentionally not loaded.

## Demo sign-in
Any email · security code **482193** (3 wrong codes locks the account).

## Code quality
- Use double quotes for strings containing apostrophes, or escape them.
- Keep JSX balanced; pages export components used in `App.tsx`.
