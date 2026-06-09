# Disc Golf Per-Course Rating Calculator — Design Spec

**Date:** 2026-06-09
**Status:** Approved design, pending spec review

## Purpose

A simple, mobile-first web app that estimates a PDGA-style **round rating** for a given
score on a local disc golf course. The user supplies each course's SSA (and optionally a
points-per-throw value); the app does the arithmetic. Installable to a phone home screen as
a PWA and usable offline on the course.

## Core formula

```
Rating = round( 1000 + (SSA - YourScore) * PointsPerThrow )
```

- `SSA` = Scratch Scoring Average for that layout (the score a 1000-rated player shoots).
- `PointsPerThrow` (PPT) = rating points gained/lost per stroke. Default **10**; user-editable
  per course for accuracy.
- Scoring **below** SSA yields a rating **above** 1000.

## Users supply the numbers (chosen approach)

No live PDGA scraping. The user finds SSA from PDGA event results and types it in. In-app help
explains the walkthrough:

1. On pdga.com, open an event's results page for the course/layout/division played.
2. Read the score + round-rating columns.
3. SSA ≈ the score that lines up with a 1000 round rating (find a ~1000-rated round, or
   interpolate between two players).
4. Enter that score as the course's SSA.
5. (Optional) Calibrate PPT from two players: `PPT = (ratingA - ratingB) / (scoreB - scoreA)`.

## Features

1. **Courses panel**
   - Seeded courses: Quail Ridge, McNair Park, New Melle, St. Charles Community College.
   - Each course: editable name, SSA, PPT (default 10).
   - Add / remove course.
   - Edits persist via browser `localStorage` (survive reload and app relaunch).
   - Seed values are clearly labeled placeholders to be replaced (McNair pre-filled ~49 as a
     starting estimate; others default SSA blank/placeholder, PPT 10).

2. **Calculator**
   - Select course (dropdown), enter score → shows estimated round rating, large and clear.
   - "Nearby scores" mini-table: ratings for a few scores above/below the entered one.
   - Reverse lookup: enter a target rating → shows the score needed.

3. **Help / how-to-find-SSA** — collapsible section with the walkthrough above.

## Non-goals (YAGNI)

- No accounts, no backend, no database.
- No multi-round averaging into a full PDGA player rating.
- No live PDGA data fetching.

## Mobile / PWA requirements

- Responsive, single-column, large touch targets; readable in sunlight (high contrast).
- `manifest.webmanifest` (name, icons, `display: standalone`, theme color).
- App icon(s) (PNG, 192 + 512).
- Service worker caching the app shell for **offline** use.
- Works added to iOS/Android home screen as a standalone app.

## Architecture

Static site, no build step:

- `index.html` — markup + UI.
- `styles.css` — mobile-first styles (or inlined).
- `app.js` — formula, state, localStorage, rendering.
- `sw.js` — service worker (offline cache).
- `manifest.webmanifest` + `icon-192.png` + `icon-512.png`.

State model (localStorage key `dgcalc.courses`): array of
`{ id, name, ssa, ppt }`. Falls back to seed defaults on first run.

## Deployment

Host-agnostic static files. At deploy time, choose one free host:
- GitHub Pages (needs GitHub account), or
- Netlify drop / Cloudflare Pages.
Then on phone: open URL → Add to Home Screen.

## Testing / verification

- Verify formula against a known PDGA data point (score+rating) the user provides.
- Manual check: rating moves the right direction (lower score → higher rating).
- Confirm localStorage persistence across reload.
- Confirm PWA installability (manifest valid, service worker registers, offline load works).
