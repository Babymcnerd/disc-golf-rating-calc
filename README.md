# Disc Golf Rating Calculator

A mobile-first, offline-capable PWA that estimates a PDGA-style **round rating** for a given score on a local disc golf course. You supply each course's SSA (and optionally a points-per-throw value); the app does the arithmetic.

**Live app:** https://babymcnerd.github.io/disc-golf-rating-calc/

## Formula

```
Rating = round( 1000 + (SSA - YourScore) * PointsPerThrow )
```

- **SSA** — Scratch Scoring Average for the layout (the score a 1000-rated player shoots).
- **PointsPerThrow (PPT)** — rating points gained/lost per stroke. Defaults to **10**, editable per course.
- Scoring **below** SSA yields a rating **above** 1000.

## Features

- **Calculator** — pick a course, enter a score, see the estimated round rating. Includes a "nearby scores" table and a reverse lookup (target rating → score needed).
- **My Courses** — add/remove courses; edit name, SSA, and PPT. Changes persist in `localStorage`.
- **Help** — in-app walkthrough for finding a course's SSA from PDGA event results.
- **Offline / installable** — service worker caches the app shell; add to your phone's home screen to use as a standalone app on the course.

## Finding a course's SSA

1. On [pdga.com](https://www.pdga.com), open an event's results page for the course/layout/division you play.
2. Read the score and round-rating columns.
3. The SSA ≈ the score that lines up with a 1000 round rating (find a ~1000-rated round, or interpolate between two players).
4. Enter that score as the course's SSA.
5. *(Optional, more accurate)* Calibrate PPT from two players: `PPT = (ratingA - ratingB) / (scoreB - scoreA)`.

## Tech

Static site, no build step — `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, and two PNG icons. Deployed to GitHub Pages via the workflow in `.github/workflows/`.

See [`docs/specs`](docs/specs) for the full design spec.
