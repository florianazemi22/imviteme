# Imvite

Digital invitations for weddings and life events. Pick a theme, add your details,
pay once, share a link and a QR code. Guests RSVP from their phone; the host
tracks everything in a dashboard.

Multi-day celebrations under one invitation, with different guests invited to
different sub-events. English, one market, one price.

**Status:** architecture and planning. The Symfony application has not been
scaffolded yet; the repository holds the architecture docs, a pre-launch
landing page, and a Dockerised development stack ready for the app to land in.

## Running it

```bash
cp .env.example .env
make up && make smoke
```

See **[DEVELOPMENT.md](DEVELOPMENT.md)** for what each service is, why it is
configured the way it is, and how to scaffold Symfony into `app/`.

## Start here

→ **[docs/architecture/README.md](docs/architecture/README.md)** — the plan,
the ten decisions everything hangs off, and where each topic lives.

| | |
|---|---|
| [Data model](docs/architecture/01-data-model.md) · [schema.sql](docs/architecture/schema.sql) | Tables, relationships, theme/content/entitlement decoupling |
| [Theme architecture](docs/architecture/02-theme-architecture.md) | Manifest, section vocabulary, motion, music, the fixture matrix |
| [Pricing & tiering](docs/architecture/04-pricing-and-tiering.md) | Tiers, add-ons, three regional bands |
| [Payments](docs/architecture/05-payments.md) | Merchant-of-record, corporate structure, regional rails |
| [Guests & RSVP](docs/architecture/06-guests-and-rsvp.md) | Per-guest links, import, the forwarded-link problem |
| [Link previews](docs/architecture/07-link-previews.md) | Dynamic OG images, generation and caching |
| [MVP & roadmap](docs/architecture/08-mvp-and-roadmap.md) | Smallest sellable version, explicit cuts, phases |
| [Risks](docs/architecture/09-risks.md) | What actually kills this |
| [Open questions](docs/architecture/OPEN-QUESTIONS.md) | What to verify, and how |

## Repository layout

| Path | |
|---|---|
| `docs/architecture/` | the plan — data model, themes, i18n, pricing, payments, RSVP, previews, roadmap, risks |
| `landing/` | pre-launch marketing page: static, no build step, no third-party requests |
| `app/` | the Symfony application (placeholder stack-check page for now) |
| `services/og-render/` | Chromium render service: OG images and print-ready PDFs |
| `docker/`, `compose.yaml` | the development stack |

## Intended stack

PHP 8.3 / Symfony 7 · Vue 3 + TypeScript · PostgreSQL 16 · Cloudflare (CDN + R2)
· a small Node + Playwright service for OG images and print PDFs.
