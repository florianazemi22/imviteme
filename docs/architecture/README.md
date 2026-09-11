# Imvite — Architecture & Product Plan

Digital invitations for weddings and life events. One-time purchase, shareable
link + QR, guest RSVP, host dashboard. Built multi-script and multi-culture from
the first schema migration.

**Stack:** PHP 8.3 / Symfony 7, Vue 3 + TypeScript, PostgreSQL 16, Cloudflare
(CDN + R2), Hetzner. Solo developer, Kosovo.

## Documents

| # | Document | What it settles |
|---|---|---|
| 1 | [Data model](01-data-model.md) | Tables, relationships, the three-way decoupling of theme / content / entitlements |
| 2 | [Theme architecture](02-theme-architecture.md) | Manifest format, section vocabulary, motion, music, how a new theme stays design work |
| 3 | [i18n & typography](03-i18n-and-typography.md) | RTL, per-script font roles, bidi, calendars, the fixture matrix that keeps themes honest |
| 4 | [Pricing & tiering](04-pricing-and-tiering.md) | Base vs. add-ons, three price bands, arbitrage control |
| 5 | [Payments](05-payments.md) | What will and won't onboard a Kosovo founder, corporate structure, regional rails |
| 6 | [Guests & RSVP](06-guests-and-rsvp.md) | Per-guest links, plus-ones, sub-event scoping, bulk import, the forwarded-link problem |
| 7 | [Link previews](07-link-previews.md) | Per-invitation OG image generation and caching |
| 8 | [MVP & roadmap](08-mvp-and-roadmap.md) | Smallest sellable version, explicit cuts, phases |
| 9 | [Risks](09-risks.md) | What actually kills this |
| — | [schema.sql](schema.sql) | Reference DDL sketch (not migrations) |
| — | [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | Things I'm not certain about and how to verify them |

---

## The ten decisions everything else hangs off

1. **`invitation` is the aggregate root and the unit of purchase.** Not "event",
   not "user plan". One wedding with five sub-events is one invitation row with
   five `invitation_events` rows and one `orders` row.

2. **Content is theme-agnostic, stored as an ordered list of typed sections.**
   Themes render a fixed vocabulary. Switching theme is one `UPDATE`. A theme
   can never introduce a content field.

3. **The renderer reads `invitation_entitlements` and nothing else.** Never
   orders, never plans, never price tiers. Pricing experiments, comps,
   grandfathering and refunds then cannot break rendering.

4. **Published invitations pin a theme *version*.** A theme redesign must never
   alter a live invitation. Upgrades are opt-in, per invitation.

5. **Two frontends, not one.** A heavy Vue SPA editor (authenticated, few
   thousand users) and a lean server-rendered public invitation page (hundreds
   of thousands of guests on mid-range Android over 3G). Sharing one SPA between
   them is the single most likely performance mistake.

6. **Themes are Twig templates + design tokens + small Vue islands**, not Vue
   SPA components. The editor preview is a debounced iframe reload of the real
   render endpoint, so preview and published output are byte-identical for free.
   See [02](02-theme-architecture.md) for the argument and the escape hatch.

7. **Per-guest links are a convenience, not access control.** They will be
   forwarded into WhatsApp groups. Design for that instead of fighting it.

8. **Every user-visible string in a theme is `dir="auto"` / `<bdi>`-wrapped and
   every layout uses CSS logical properties.** RTL is a property of the data, not
   a stylesheet variant you maintain twice.

9. **Merchant-of-record from day one, through a non-Kosovo company.** Stripe
   will not onboard you in Kosovo. This is a 1–3 month lead-time item and it is
   the most urgent non-code task on this list.

10. **Localise the product globally; localise the funnel one market at a time.**
    Architecture is cheap to make culture-neutral now. Go-to-market is not.

---

## Pushback on the brief

Three things in the framing I think are wrong or under-weighted. Detail in
[09-risks.md](09-risks.md).

**"Built to work across many cultures from day one" conflates two costs.**
Making the *codebase* script-agnostic, RTL-correct and multi-currency costs
maybe 15% extra on the build and is absolutely worth paying now — retrofitting
RTL into a shipped product is a rewrite. Making the *business* work in eight
cultures means eight landing pages, eight Instagram funnels, eight local price
points, eight payment rails and support in eight languages. That is not 15%
extra; it is eight companies. Build the architecture for all of them, launch the
funnel in one: Albanian-speaking diaspora in Switzerland, Germany and Austria.
They have Western purchasing power, a Balkan wedding calendar, and you can
support them in their own language from Prishtina. Win that, then port the
funnel — the code will already be ready.

**In South Asia and MENA, your competitor is not a SaaS — it's a freelancer with
After Effects.** The culturally expected artefact in those markets is an animated
MP4 invitation delivered on WhatsApp for $20–50, not a web page. A link-based
product is a *harder* sell there than in the Balkans or DACH, not an easier one.
If you intend to take those markets seriously, "export this invitation as a
15-second vertical MP4" is probably a higher-leverage feature than your next six
themes. It's Phase 2, not MVP, but it should shape the theme architecture now
(see motion tokens in [02](02-theme-architecture.md)).

**"One-time payment, no subscriptions" is good positioning and bad business
architecture — unless you fix it deliberately.** Consumer-facing, it's a
genuine differentiator against Withjoy/Greenvelope and matches Balkan
expectations. But it means zero retention, CAC payback on purchase one, and
revenue that collapses outside May–September. The fix is not to add a consumer
subscription. It's (a) multiple purchases per wedding — save-the-date, main
invitation, thank-you card — and (b) a wedding-planner/agency tier that *is*
recurring. Plan for both in the data model now; the `orders`/`entitlements`
split in [01](01-data-model.md) already supports it.
