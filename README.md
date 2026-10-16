# Jadeite Systems · Office Admin

Clickable prototype of the **Office Admin** platform for Jadeite Glazing. It follows the client-approved dashboard design (Sora font, jade colour palette, glass "J" logo, real home photography).

## Screens
| Area | Screens |
|---|---|
| Start | Sign-in with 6-digit code · 3-step welcome tour (`/login`, `/welcome/1`) |
| Main | Office Admin dashboard (approved design) · Enquiries list · Enquiry record · New enquiry form |
| Sales | Sales pipeline (drag-and-drop, days in stage, reminders, move to another salesperson) · Appointments & tasks (sales visits, surveys, follow-ups, Outlook sync, tasks with owner and due date) · Customers · Customer record · Quotes (Framepoint) |
| Operations | Jobs list · Job page (Overview, Survey, Quote, Order, Delivery, Installation, Documents, Messages, Payments, Notes) · Surveys + survey review · Orders · Deliveries · Installations (ready-to-book checks) · Installation diary (teams × days, clash check) · Book installation form |
| Aftercare | Snags · Aftercare (guarantee packs, requests, reviews) |
| Communicate | Messages (portal, Outlook email, calls, internal notes) · Customer portal settings, invites and preview |
| Finance | Payments from Xero (view only) |
| Reports | Sales · Jobs and diary · Team performance |
| Other | Search (⌘K) · Notifications · Profile menu · Settings |

## Office Admin flow covered (matches the FigJam flow chart)
Sign in → security code (3 wrong tries locks the account) → Today dashboard with “Needs your attention” (late, blocked, not booked, no next step) → New enquiries (route non-sales to job owner or aftercare, duplicate check, create customer, assign salesperson + first follow-up date) → Sales pipeline (owner, days in stage, chase/remind, move) → Appointments & tasks → Won deal becomes a job → Is a survey needed? (use existing or book survey) → Review survey (approve or send back) → Order checks, supplier reference, supplier confirmed / chase, expected date → Goods arrive (or report damaged/missing/wrong — job stays blocked) → Ready to book (shows what is missing) → Diary: drag or form, team + dates + days, clash and leave check, override needs a reason → customer and installers told → reschedule or cancel → installer checklist → snags (job stays “Snag”) → sign-off with signature (or record why the customer refused) → aftercare → messages timeline, unmatched emails linked by hand, documents visible to customer, internal notes and tasks → History on every job.

All data is sample data in `src/data/mock.ts` and `src/data/store.tsx`. Changes you make while clicking through are kept for the browser session; use the profile menu → **Reset demo data** to start again.

## Run locally
```bash
npm install
npm run dev
```

## Open in Figma Make
In Figma Make choose **Clone repository**, paste this repository's URL and click **Clone**.

## Design tokens
Defined at the top of `src/styles/app.css`: primary `#00C7A1`, primary dark `#0B6E5C`, deep jade `#0B1F1B`, tint `#EBF7F3`, page `#F6F8F7`, border `#E3E9E7`, text `#0F1414` / `#3A4A4A` / `#6B7A78`, status ok `#1F9D5B`, warn `#E0A100`, error `#D64545`, info `#2F6FDE`. Cards: radius 10, padding 18. Icons: Tabler.
