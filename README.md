# Nitali — Annual Review FY26

A birthday site, built as a deadpan corporate performance review.

One static page, no build step, no dependencies. Fonts come from Google Fonts;
everything else is three files.

```
index.html
assets/css/site.css
assets/js/site.js
```

## Design

The visual system is taken from [atlas.gpl-digital.in](https://atlas.gpl-digital.in/),
studied directly rather than eyeballed — one warm off-white screen, near-black
ink, pure black as the only accent, Geist and Geist Mono, and a vertical band
that tracks the pointer across the hero revealing a fully inverted duplicate of
the page through it. That inverted layer is cloned from the base layer at
runtime, so the two can never drift apart.

The loading run is from [gpl-map.in](https://gpl-map.in/) instead, since atlas
has none: the page renders as it will finally look with its chrome held back,
and a 1px rule with a tabular-nums percentage is the only element that exists
purely for loading.

There is no colour anywhere. Severity in the audit table is encoded with a
filled square rather than red, and the joke is carried entirely by the
restraint.

## Running it

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploying

Push to GitHub and turn on Pages: **Settings → Pages → Source: Deploy from a
branch → `main` / `(root)`**.

## Notes

- Ticks in the action plan are kept in `localStorage` under `nitali.plan.v1`.
  Every read and write is guarded, so the list still works with site data
  blocked.
- The clock in the hero shows `Asia/Kolkata`, not the viewer's timezone. The
  report is about her, so the clock on it is hers.
- The band is a pointer affordance and is not built on touch devices.
- `prefers-reduced-motion` skips the loading run and every entrance, and keeps
  the band, which only ever answers the pointer.
