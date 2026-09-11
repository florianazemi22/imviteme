# Imvite

Digital invitations for weddings and life events. Pick a theme, add your details,
pay once, share a link and a QR code. Guests RSVP from their phone; the host
tracks everything in a dashboard.

Built multi-script and multi-culture from the first migration: per-invitation
languages including RTL, non-Latin typography that doesn't break, multi-day
celebrations with per-guest sub-event scoping, and regional pricing.

**Status:** architecture and planning. No application code yet.

## Start here

→ **[docs/architecture/README.md](docs/architecture/README.md)** — the plan,
the ten decisions everything hangs off, and where each topic lives.

| | |
|---|---|
| [Data model](docs/architecture/01-data-model.md) · [schema.sql](docs/architecture/schema.sql) | Tables, relationships, theme/content/entitlement decoupling |
| [Theme architecture](docs/architecture/02-theme-architecture.md) | Manifest, section vocabulary, motion, music, the fixture matrix |
| [i18n & typography](docs/architecture/03-i18n-and-typography.md) | RTL, per-script fonts, bidi, calendars |
| [Pricing & tiering](docs/architecture/04-pricing-and-tiering.md) | Tiers, add-ons, three regional bands |
| [Payments](docs/architecture/05-payments.md) | Merchant-of-record, corporate structure, regional rails |
| [Guests & RSVP](docs/architecture/06-guests-and-rsvp.md) | Per-guest links, import, the forwarded-link problem |
| [Link previews](docs/architecture/07-link-previews.md) | Dynamic OG images, generation and caching |
| [MVP & roadmap](docs/architecture/08-mvp-and-roadmap.md) | Smallest sellable version, explicit cuts, phases |
| [Risks](docs/architecture/09-risks.md) | What actually kills this |
| [Open questions](docs/architecture/OPEN-QUESTIONS.md) | What to verify, and how |

## Intended stack

PHP 8.3 / Symfony 7 · Vue 3 + TypeScript · PostgreSQL 16 · Cloudflare (CDN + R2)
· a small Node + Playwright service for OG images and print PDFs.
