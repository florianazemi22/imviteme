# 7. Link previews (OG images)

When someone drops `imvite.me/i/arta-besnik-x7k2` into a WhatsApp group, the
card that appears must show the couple's names, the date, and the theme's
aesthetic. If it shows a generic Imvite logo, the share looks like spam and the
host stops sharing it. This is a conversion-critical feature, not a nice-to-have.

---

## 7.1 Generation: headless Chromium, at publish time

### Why not the alternatives

- **PHP image libraries (GD, Imagick, Intervention)** — no complex-script text
  shaping. They will render Arabic as disconnected, backwards letters and
  Devanagari without conjuncts. For a product whose whole premise is multi-script
  correctness, this is disqualifying. Rule it out immediately.
- **Satori / `@vercel/og`** — elegant, fast, JSX-to-SVG. But it implements its own
  text layout rather than using HarfBuzz, and its complex-script support
  (Arabic shaping, Indic reordering, bidi) has historically been incomplete.
  **Verify before adopting** ([OPEN-QUESTIONS](OPEN-QUESTIONS.md)); my expectation
  is it won't be good enough for Nastaliq or Devanagari.
- **Cloud services (Bannerbear, Placid, ogimage.org)** — fine, fast to integrate,
  but a per-image cost, a third-party dependency on a hot path, and the same
  font-coverage questions.

### The recommendation

**A small Node service running Playwright + Chromium**, rendering an HTML
template and screenshotting it.

Chromium gives you HarfBuzz shaping, full bidi, ligatures, `clamp()`, web fonts,
emoji, and — crucially — **the same rendering engine as the invitation itself**,
so the OG card can literally reuse the theme's tokens and fonts and look like the
theme.

```
Symfony ──(publish/content change)──> Messenger queue
            │
            └─> OgImageHandler
                  POST http://og-service:3000/render
                    { theme, version, script, dir, palette,
                      headline, subtitle, date_line, image_url, size }
                  <─ PNG/JPEG bytes
                  └─> upload to R2 at og/{invitation_id}/{content_hash}.jpg
                  └─> UPDATE invitations SET og_image_key=…, og_generated_at=now()
```

Details:

- **One long-lived browser instance**, a pool of 2–4 contexts. Launching Chromium
  per request costs ~800ms and will fall over under any load. Use Playwright's
  `browser.newContext()` per render and recycle the browser every N renders to
  contain memory leaks.
- **Fonts baked into the container image** — the same subsetted woff2 files the
  themes use, plus the full Noto set for the scripts you support. A missing font
  in the OG container produces tofu boxes in the one image every guest sees.
  Add a smoke test that renders all fixture scripts at deploy time and fails the
  deploy on a `.notdef` pixel signature.
- **Wait for `document.fonts.ready`** before screenshotting, plus a
  `waitForFunction` on an explicit `window.__ready = true` the template sets. Do
  not screenshot on a timeout; you'll ship images with fallback fonts.
- **Generate synchronously-ish on publish.** The publish action enqueues the job
  and the UI shows a spinner on the share screen until the image exists. Do not
  let the user reach the share button before the image is ready — see §7.3.
- **Runtime cost:** ~400–700ms per image on a small VM. At 500 invitations/month
  with ~3 regenerations each, that's trivial. This doesn't need to scale for
  years.

**Bonus:** the same service renders the **print-ready PDF** (invitation card, QR
pack) via `page.pdf()`, which solves the complex-script PDF problem from
[03](03-i18n-and-typography.md) §3.5. Build it once, use it twice.

### Sizes to generate

| Size | For |
|---|---|
| **1200×630 JPEG** | `og:image` — the standard everywhere |
| **1200×1200 JPEG** | square fallback; some WhatsApp/Telegram surfaces prefer it |
| 1080×1920 JPEG | Instagram story asset the host can download and post — a cheap, genuinely-used feature |

Keep the OG JPEG **under ~300KB** (quality 82, `mozjpeg`). WhatsApp's crawler is
reported to drop previews for large images; the exact current threshold is worth
verifying, but small is free so just stay small.

---

## 7.2 Caching, and the invalidation problem

### Your cache — easy

`og/{invitation_id}/{content_hash}.jpg`. The path changes whenever the content
changes, so:

```
Cache-Control: public, max-age=31536000, immutable
```

Never purge anything. Old objects are orphaned; a monthly lifecycle rule on R2
deletes unreferenced keys older than 90 days.

### The page itself

Cache the public invitation HTML at Cloudflare, keyed on
`slug + resolved locale + guest token presence`:

- **Open link** (`/i/{slug}`): `s-maxage=300, stale-while-revalidate=86400,
  stale-if-error=604800`. Purge by cache tag `inv:{id}` on publish/edit.
- **Personal link** (`/i/{slug}/g/{token}`): `Cache-Control: private, no-store`.
  It contains a named greeting — never let a shared cache hold it.
- **`stale-if-error` is the important one.** If your origin dies on a Saturday in
  July, guests still see the invitation from Cloudflare's cache. Enable
  Always Online too. The cost of an outage in this product is not lost revenue,
  it's a wedding.

### Their cache — the hard part, and you can't fix it

**WhatsApp, iMessage, Telegram, Facebook and Signal each maintain their own
preview cache, keyed by URL, and you cannot purge any of them.** Facebook's
Sharing Debugger re-scrapes for Facebook — WhatsApp's cache is separate and
generally reported to persist for a long time (weeks). Assume: **once a URL has
been shared, its preview is frozen.**

Therefore:

1. **Never let a URL escape before its OG image exists.** The publish flow is:
   save → enqueue → generate → upload → *then* unlock the share screen. A spinner
   for three seconds here prevents a permanently wrong preview.
2. **Warn on late edits.** If the host changes the names or date after publishing,
   show: "Your link has already been shared — previews in WhatsApp may still show
   the old details for a while. The invitation page itself is updated." Honest,
   and it pre-empts the support ticket.
3. **Offer a "fresh link" escape hatch.** For a genuinely wrong preview (wrong
   names), let the host mint a new slug and keep the old one 301-redirecting.
   The new URL gets a fresh preview everywhere. Keep the old slug alive forever
   — it's in a hundred WhatsApp histories.
4. **Do not put the content hash in the page URL.** Tempting, and it would solve
   invalidation, but it breaks every already-shared link. The image URL carries
   the hash; the page URL is stable.

---

## 7.3 The meta tags

Server-rendered in Twig. Crawlers do not execute JavaScript — this is a second
strong reason the public page is not a client-rendered SPA.

```twig
<meta property="og:type" content="website">
<meta property="og:site_name" content="Imvite">
<meta property="og:url" content="{{ canonical }}">
<meta property="og:title" content="{{ og_title }}">
<meta property="og:description" content="{{ og_description }}">
<meta property="og:image" content="{{ og_image_absolute }}">
<meta property="og:image:secure_url" content="{{ og_image_absolute }}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{{ og_title }}">
<meta property="og:locale" content="{{ og_locale }}">{# e.g. sq_AL #}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ og_title }}">
<meta name="twitter:description" content="{{ og_description }}">
<meta name="twitter:image" content="{{ og_image_absolute }}">

<meta name="robots" content="noindex, nofollow">{# see below #}
<link rel="canonical" href="{{ canonical }}">
```

Rules:

- **Absolute HTTPS URLs.** Protocol-relative or relative `og:image` values fail
  silently in several crawlers.
- **Explicit `og:image:width`/`height`.** WhatsApp renders a large card rather
  than a thumbnail when it can determine dimensions without fetching.
- **`og:title`**: the names — "Arta & Besnik". Not "Wedding invitation | Imvite".
  The card must look like *their* invitation, not like your product.
- **`og:description`**: date + city — "25 korrik 2026 · Prishtinë".
- **Bake the invitation's primary locale.** Crawlers don't send a useful
  `Accept-Language`, and a personal link's locale can't be used anyway since the
  crawler has no token.
- **`noindex` public invitations by default.** Someone's wedding address and guest
  list should not be in Google. Offer an opt-in "allow search engines" toggle for
  the rare public event (a graduation party, a business launch). This is a
  privacy default, and it also protects you from a GDPR complaint you'd rather not
  have. It does not affect WhatsApp previews — crawlers for link unfurling ignore
  `robots` meta for this purpose, but **do verify** your `robots.txt` doesn't
  block them (`facebookexternalhit`, `WhatsApp`, `Twitterbot`, `TelegramBot`,
  `Slackbot-LinkExpanding`, `Discordbot`, `iMessageBot`/Apple's fetcher).
  **Blocking crawlers in `robots.txt` while trying to `noindex` is the classic way
  to kill your own link previews.** `noindex` in the meta tag, allow in
  `robots.txt`.
- **Serve identical HTML to crawlers and users.** No UA-based branching. It's
  fragile, and cloaking-detection heuristics can flag it.

---

## 7.4 Testing previews

Build a small internal tool — `/admin/preview-check?url=` — that fetches the URL
with each crawler's User-Agent, parses the meta tags, downloads the image, and
reports size, dimensions and byte count. Ten minutes of work, and it's how you'll
diagnose "the preview isn't showing" reports without guessing.

Manually verify before launch, on real devices, with a real shared message:
WhatsApp (iOS + Android — they differ), iMessage, Telegram, Viber, Instagram DM,
Signal, Facebook Messenger, LinkedIn, Slack, Discord. Then re-verify quarterly:
**the crawlers change and never announce it**, and a silent preview regression
will cost you conversions for weeks before anyone reports it.
