# Imvite landing page

A single static page for `imvite.me`, pre-launch. Plain HTML, one stylesheet,
~2.5 KB of optional JavaScript. No build step, no npm, no framework, and **zero
third-party requests** — no web fonts, no analytics, no CDN, no external
imagery. That is deliberate: the product tells customers its invitation pages
are cookie-free and load nothing from anyone else, and the marketing page must
not contradict it.

```
landing/
├── index.html      the page
├── styles.css      all styling, CSS logical properties only
├── app.js          progressive enhancement only (mobile nav + form upgrade)
├── assets/
│   └── favicon.svg authored in-house
└── README.md       this file
```

---

## Preview locally

Any static server will do. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Opening `index.html` straight from the filesystem also works; using a server is
closer to production and lets you watch the network panel.

**What to check in the browser devtools:**

- Console: no errors.
- Network: every request should be same-origin — `index.html`, `styles.css`,
  `app.js`, `assets/favicon.svg`. Nothing else. If a request to another host
  ever appears, something has been added that should not have been.

---

## Deploy

The page is static files; any host works.

### Cloudflare Pages (recommended, matches the rest of the stack)

**Via the dashboard:** Workers & Pages → Create → Pages → connect the repo →
set **Build command:** *(empty)* and **Build output directory:** `landing`.
Deploy. Add `imvite.me` under Custom domains.

**Via Wrangler, no repo connection:**

```bash
npx wrangler pages deploy landing --project-name imvite-landing
```

Recommended headers — create `landing/_headers` (Cloudflare Pages reads it, it
is not needed for local preview):

```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'self'
```

There is no inline script and no inline style on the page, so the policy needs
no `'unsafe-inline'` anywhere. Note that `form-action 'self'` must be widened if
you point the sign-up form at a third-party endpoint (see below).

### Anything else

Netlify (publish directory `landing`), GitHub Pages, S3 + CloudFront, or
`rsync` to any web root. There is nothing to compile.

---

## Wiring the email form

Both sign-up forms (hero and closing section) currently post to a placeholder:

```html
<form class="signup" action="/subscribe" method="post" data-signup>
```

**Swap `action="/subscribe"` in both places** for a real endpoint. There are two
of them; grep for `action="/subscribe"`.

Fields the endpoint receives:

| field | notes |
|---|---|
| `email` | required, `type=email` |
| `consent` | `"yes"` — required checkbox, the GDPR opt-in |
| `source` | `hero` or `footer`, so you can see which half of the page converts |
| `company` | **honeypot.** Always empty for humans. If it is non-empty, discard the submission silently. |

Options:

- **Buttondown** — `action="https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"`,
  and rename the email field to `email` (already correct).
- **Formspree** — `action="https://formspree.io/f/YOUR_FORM_ID"`. Returns JSON
  when `Accept: application/json` is sent, which `app.js` already does.
- **A Cloudflare Worker** (best fit here — no third party in the request path,
  and it keeps `form-action 'self'` valid). Route `POST /subscribe` on the same
  zone, validate, drop honeypot hits, write to a KV/D1 table or forward to your
  mail provider's API, and return `204` for a JSON request or a `303` redirect
  to a thank-you page for a plain form post.

**Progressive enhancement contract.** With JavaScript disabled, the browser does
a normal form POST and navigates to whatever the endpoint returns — so the
endpoint must return a readable thank-you page (or a redirect to one) for
non-JSON requests. With JavaScript enabled, `app.js` intercepts, posts the same
`FormData` with `Accept: application/json`, and swaps in an inline success
message without leaving the page. Anything other than a `2xx` shows an inline
error and the user can retry.

Also replace the three placeholder footer links (`#privacy`, `#terms`,
`#contact`) and the "How we handle your email" link in the consent line, which
currently points at `#privacy`.

### Still to do before announcing the URL

- **`assets/og.png` does not exist yet.** The `og:image` / `twitter:image` meta
  tags point at `https://imvite.me/assets/og.png`. Create a 1200×630 PNG —
  commissioned artwork or rendered from the theme tokens, the same way
  per-invitation OG cards are produced (`docs/architecture/07-link-previews.md`)
  — and drop it in `assets/`. Until then link previews for the landing page
  itself will fall back to text only.
- Privacy note, terms and a contact route.

---

## The rules this page holds itself to

The page is the product's own argument, so it holds itself to the standard the
invitations will be held to.

### CSS logical properties only

No `margin-left`, no `padding-right`, no `text-align: left`, no `float`, no bare
`left:` / `right:`. Check it:

```bash
grep -niE 'left|right' landing/styles.css   # expected: no output at all
```

Use `margin-inline`, `padding-block`, `inset-inline-start`, `text-align: start`.
Terser than the physical properties, and they cost nothing.

### The rest

- **Fluid type.** Every heading uses `clamp()`; there is no fixed heading size
  anywhere. Long strings wrap rather than overflow at 320–360px.
- **Responsive** from 320px to 1440px and beyond, no horizontal scroll.
- **Light and dark** both explicitly painted via `prefers-color-scheme`; nothing
  relies on a browser default.
- **`prefers-reduced-motion`** kills every transition and the smooth scroll.
- **Accessibility.** Skip link, real landmarks (`header`/`nav`/`main`/`footer`),
  one `h1`, labelled form fields, `role="status"` for the async form result,
  visible focus rings, and colour contrast at WCAG AA or better in both themes.
- **No JavaScript required.** The nav is visible, the FAQ uses native
  `<details>`, and the form does a plain POST. `app.js` only upgrades.
- **No stock assets.** Every graphic is SVG authored here (see
  `docs/architecture/09-risks.md` §9.5 on why marketplace assets are a takedown
  risk). The framed block in the phone mock is a deliberate CSS placeholder:
  real commissioned photography goes there, marked `.photo-slot` in the
  stylesheet.
- **No social proof.** Pre-launch means no testimonials, no logos, no counts.
  If you are tempted to add "trusted by N couples", wait until it is true.

---

