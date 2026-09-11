# Imvite — Architecture & Product Plan

Digital invitations for weddings and life events. One-time purchase, shareable
link + QR, guest RSVP, host dashboard. English-language, single market.

**Stack:** PHP 8.3 / Symfony 7, Vue 3 + TypeScript, PostgreSQL 16, Cloudflare
(CDN + R2), Hetzner. Solo developer, Kosovo.

## Documents

| # | Document | What it settles |
|---|---|---|
| 1 | [Data model](01-data-model.md) | Tables, relationships, the three-way decoupling of theme / content / entitlements |
| 2 | [Theme architecture](02-theme-architecture.md) | Manifest format, section vocabulary, motion, music, how a new theme stays design work |
| 4 | [Pricing & tiering](04-pricing-and-tiering.md) | What belongs in the base tier vs. paid add-ons |
| 5 | [Payments](05-payments.md) | What will and won't onboard a Kosovo founder, and the corporate structure that implies |
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

8. **Themes reference font and colour *roles*, never literal values.** A
   template containing a hex code or a font name is a CI failure. It is what
   keeps a new theme to tokens plus a hero override.

9. **Merchant-of-record from day one, through a non-Kosovo company.** Stripe
   will not onboard you in Kosovo. This is a 1–3 month lead-time item and it is
   the most urgent non-code task on this list.

10. **One market, one language, one currency.** Every "what if someone in
    another country…" question is deferred until there is revenue to justify
    answering it.

---

## Pushback on the brief

Two things worth flagging.

**"Pay once, no subscriptions" is good positioning and bad business
architecture — unless you fix it deliberately.** Consumer-facing it's a genuine
differentiator against Withjoy and Greenvelope. But it means zero retention,
CAC payback on purchase one, and revenue that collapses outside the wedding
season. The fix is not a consumer subscription. It's (a) multiple purchases per
wedding — save-the-date, main invitation, thank-you card — and (b) a
wedding-planner tier that *is* recurring. The `orders`/`entitlements` split in
[01](01-data-model.md) supports both already.

**The hard part of this product is distribution, not engineering.** Everything
in these documents is buildable in a few months. Nobody browses for invitation
platforms — they search once, three weeks before they need it, and buy whatever
their friend used. Budget as much time for finding the channel as for building
the product. Detail in [09-risks.md](09-risks.md).
