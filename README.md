# JC Fitness: landing page

An animated, single-page site for a strength gym: kinetic type, a pictogram lifter that performs a full clean & jerk, a playable **Lift Lab**, an events calendar, pricing, and a contact form that hands the lead straight to WhatsApp.

## What's on the page

| Section | What it does |
|---|---|
| **Preloader** | "Loading the bar": plates slam onto a barbell while the kg counter climbs, then the curtain splits. Once per browser session. |
| **Hero** | Four-line headline in a variable font; letters near the cursor widen like a muscle flexing. The lifter loops a clean & jerk with judge lights, chalk, a bar drop and screen shake. |
| **Marquee** | Two crossing tape bands that wind up and skew with scroll speed. |
| **Scroll to lift** | Pinned section: scrolling performs the lift frame by frame while the six coaching positions light up. |
| **Programs** | Bento grid with pointer tilt and spotlight. Each card books a trial. |
| **Lift Lab** | Load plates (auto-sorted heaviest-in), hold the button, let go in the green zone. Heavier bars move the needle faster and shrink the zone. Good lifts earn a title and a WhatsApp "claim my free session" link; your best is remembered on the device. |
| **Events** | Featured meet with a live countdown and seats bar, filter tabs, and a fight-card list. Every row RSVPs on WhatsApp. |
| **Pricing** | Monthly / quarterly / yearly toggle; prices roll like an odometer, with yearly savings and per-day cost. |
| **Contact** | Validated form (name + phone required) that opens WhatsApp with the message written out. Map, hours, phone, email. |
| **WhatsApp button** | Floating, always reachable. |

Works from 360px phones to wide desktops, with keyboard and screen-reader support. With **reduced motion** turned on, every animation is replaced by a still, readable state: no preloader, no pinning, and the lifter is shown at lockout.

## Make it yours

Everything a gym owner would change lives in **`src/content.ts`**:

- `gym.whatsapp`: the number that receives every message (digits only, with country code, e.g. `919876543210`)
- name, phone, email, address, map query, opening hours, social links
- programs, plans and prices, pricing extras
- events (sample dates are computed relative to today; replace them with fixed dates)
- Lift Lab titles

> The phone number, address, prices and events in the repo are **placeholders**. Replace them before going live.

**Optional form backup.** To also receive submissions by email or in a sheet, set a form endpoint (Formspree, Web3Forms, or your own API) in `.env`:

```bash
VITE_FORM_ENDPOINT=https://formspree.io/f/xxxxxxx
```

WhatsApp works with or without it.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
```

## Deploy

`dist/` is a static site with relative paths, so it runs on any host (Netlify, Vercel, Cloudflare Pages, S3).

**GitHub Pages:** the workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`. Turn it on once in **Settings → Pages → Build and deployment → Source: GitHub Actions**. The site then lives at `https://<user>.github.io/JC-fitness/`.

## How it's built

- **Vite + React 19 + TypeScript**, **Tailwind CSS v4**
- **GSAP + ScrollTrigger** for the choreography (preloader, hero loop, pinned scroll lift, marquee), **Lenis** for smooth scrolling
- **Fluid Functionalism** (`@fluid` shadcn registry) for the motion system and controls: spring tokens (`src/lib/springs.ts`), the gliding hover highlight on the nav and event list, tabs for billing and event filters, and the form fields and selects
- **Archivo** variable font with the width axis, so headlines can flex from condensed to wide
- The lifter (`src/components/lifter/`) is an SVG rig solved with two-bone inverse kinematics: a pose only names where the hips, feet and bar go, and knees and elbows follow, so every in-between frame stays anatomically plausible.

Motion follows one house system: a strong ease-out signature curve, three spring speeds, exits faster than entrances, presses at 0.98, only `transform`/`opacity` animated, and full `prefers-reduced-motion` support.
