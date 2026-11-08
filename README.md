# JC Fitness: landing page

An animated, single-page site for a strength gym: kinetic type, a pictogram athlete that performs eight different movements (clean & jerk, squat, bench, deadlift, treadmill, elliptical, spin bike, rower), a playable **Lift Lab**, an events calendar, pricing, real-photo slots, and a contact form that hands the lead straight to WhatsApp.

## What's on the page

| Section | What it does |
|---|---|
| **Preloader** | "Loading the bar": plates slam onto a barbell while the kg counter climbs, then the curtain splits. Once per browser session. |
| **Hero** | Four-line headline in a variable font; letters near the cursor widen like a muscle flexing. A showreel of one rep each of clean & jerk, back squat, bench press and deadlift, with the rack and bench swapping in, judge lights, chalk and screen shake. |
| **Marquee** | Two crossing tape bands that wind up and skew with scroll speed. |
| **Scroll to lift** | Pinned section: scrolling performs the lift frame by frame while the six coaching positions light up. |
| **Programs** | Bento grid with pointer tilt and spotlight. Each card books a trial, and takes a background photo. |
| **The Floor** | Eight stations (4 strength, 4 cardio) in tabs: the athlete performs each one on its equipment, next to a photo slot for that station. Auto-advances until someone picks one. |
| **Lift Lab** | Load plates (auto-sorted heaviest-in), hold the button, let go in the green zone. Heavier bars move the needle faster and shrink the zone. Good lifts earn a title and a WhatsApp "claim my free session" link; your best is remembered on the device. |
| **Events** | Featured meet with a live countdown and seats bar, filter tabs, and a fight-card list. Every row RSVPs on WhatsApp. |
| **Inside JC** | Six-photo gallery with in-frame parallax. |
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

## Add your photos

Drop JPGs into `public/images/` with the names listed in [`public/images/README.md`](public/images/README.md): station photos, gallery, hero background, program cards and the featured event. Each one shows up on its own, with no code changes. Until a file is there, the site shows a placeholder naming the exact path and size (the hero, program and event backgrounds simply stay graphic).

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
- The athlete (`src/components/lifter/`) is an SVG rig solved with two-bone inverse kinematics: a pose only names where the hips, feet and hands go, and knees and elbows follow, so every in-between frame stays anatomically plausible. Strength lifts are GSAP timelines through key poses (`stations.ts`); cardio is parametric gait cycles (running stride, elliptical ellipse, pedal circle, rowing drive and recovery) with the machine's moving parts driven from the same skeleton.

Motion follows one house system: a strong ease-out signature curve, three spring speeds, exits faster than entrances, presses at 0.98, only `transform`/`opacity` animated, and full `prefers-reduced-motion` support.
