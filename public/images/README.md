# Photos

The photos in these folders are **public-domain placeholders** (see
[CREDITS.md](CREDITS.md)) so the site looks finished before real photos of the
gym exist. To use your own, **overwrite a file with the same name**: the site
picks it up automatically, with no code changes.

Tips: JPG, quality around 75–80%, under ~300 KB each (https://squoosh.app).
Photos get a colour grade on the site (cool blue, or a blue-green duotone that
turns to full colour on hover), so mixed lighting still looks consistent.

| File | Where it shows | Shape / size |
|---|---|---|
| `hero.jpg` | Hero, the big angled photo panel | Landscape, 2000 × 1400+ |
| `hero-detail.jpg` | Hero, the round close-up with turning text | Square, 800 × 800 |
| `stations/clean.jpg` … `stations/rower.jpg` | The Floor, round plate frame per station | Square, 1200 × 1200 |
| `programs/strength.jpg`, `olympic`, `hiit`, `boxing`, `yoga`, `pt` | Program cards (duotone, colour on hover) | Landscape, 1200 × 800 |
| `gallery/*.jpg` (10 files) | Inside JC, the two slanted photo strips | See sizes in `src/content.ts` |
| `events/iron-clash.jpg` | Featured event card, left half | Landscape, 1600 × 1000 |
| `events/<event-id>.jpg` | Photo that follows the cursor over each event row | Portrait 4:5, 800 × 1000 |

Station names: `clean`, `squat`, `bench`, `deadlift`, `treadmill`, `elliptical`, `bike`, `rower`.
Gallery names: `floor`, `boxing`, `cardio`, `weights`, `class`, `platforms`, `recovery`, `ropes`, `cardio-deck`, `kettlebells`.

Want more or fewer photos, or different captions? Edit the `gallery`, `stations`
and `events` lists in `src/content.ts`.
