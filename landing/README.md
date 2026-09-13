# Imvite — landing page

One self-contained file: `index.html`. Inline CSS, inline vanilla JS, no build
step, no npm, no framework. Open it directly or serve the folder.

```bash
python3 -m http.server 8000 --directory landing
```

## Design language

Soft neo-brutalism, with the information density rebalanced against Gumroad
after a review: one idea per section, a hero carrying type and nothing else,
and imagery as authored flat vector bleeding off the viewport edges.

**No stock photography.** Faces of real people cannot be licensed for
advertising without a model release, and the free-photo sites do not grant one.
Every shape on the page is SVG written here.

The rules the file holds itself to:

- **Thick ink outlines** on every card, button, input and badge — `2px` on small
  elements, `3px` on cards and primary buttons, always `--ink`.
- **No gradients.** The only `linear-gradient` in the file draws the two bars of
  the FAQ plus/minus icon as solid blocks.
- **Hard offset shadows only** — `5px 5px 0`, never a blur radius.
- **Generous radii**: `20px` cards, `14px` controls. Nothing square.
- **Accents in small doses.** Each accent has one permitted job, fixed by its
  contrast on cream:

  | token | ratio on cream | permitted use |
  |---|---|---|
  | `--indigo` `#4F46E5` | 5.9:1 | small text, links, icons, fills |
  | `--magenta` `#D6336C` | 4.3:1 | large display text, or a fill with white on it |
  | `--ochre` `#E8A33D` | **2.0:1** | **fill only, never text** — ink on ochre is 7.4:1 |

  Anything larger than a badge or an avatar uses `--tint-*` instead, so a
  saturated colour never becomes a background wash.
- **Type**: Fraunces (display serif) + Plus Jakarta Sans (geometric sans).

## Porting to Vue

Every `<section>` maps to one SFC and is commented with its intended name:
`SiteNav`, `MenuOverlay`, `HeroPanel`, `HowItWorks`, `GuestPreview`,
`ThemeGallery`, `PricingTiers`, `PackageBuilder`, `FaqAccordion`,
`ClosingCta`, `SiteFooter`.

Move the `:root` block to `tokens.css` first — no component holds a hard-coded
colour, radius or border width, so the rest is mechanical. The ~23 inline
`style="background: …"` attributes are all theme-card and demo-stat accents;
they become props.

## Before this goes live

1. **Self-host the two fonts.** They currently load from the Google Fonts CDN,
   which is a third-party connection and has produced GDPR findings in Germany.
   `@fontsource/fraunces` and `@fontsource/plus-jakarta-sans`, or
   google-webfonts-helper for the raw woff2.
2. **Create `og.png`** (1200×630). The meta tags point at it; it does not exist,
   so the link currently previews with no image.
3. **Wire the CTAs.** Every button points at `#get-started`. `#login`,
   `#privacy`, `#terms` and `#contact` are dead anchors.
4. **Set the CSP.** With the fonts self-hosted:

   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';
     style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self';
     base-uri 'none'; frame-ancestors 'self'
   ```

   The `'unsafe-inline'` entries are the cost of a single-file page. They go away
   once this is Vue components with an external stylesheet and bundle — which is
   a reason to port sooner rather than later.

## Verified

Rendered in headless Chromium with both fonts loaded, across 320 / 360 / 390 /
430 / 768 / 1024 / 1280 / 1440px:

- No horizontal overflow at any width, with the `overflow-x: clip` guard
  disabled so nothing is merely hidden.
- No console or page errors.
- Package builder arithmetic correct across add, remove and keyboard toggle;
  total is an `aria-live="polite"` `<output>`.
- FAQ opens on Enter, theme rail scrolls via its arrow buttons and arrow keys.
- One `<h1>`, ordered headings, real landmarks, skip link.
