# 8. MVP scope and roadmap

Assumption: solo developer, Imvite alongside other paid work, realistically
15–20 focused hours/week. All estimates below assume that, and are deliberately
conservative.

---

## 8.1 Phase 0 — sell it before you can charge for it (weeks 1–6)

**Goal: ten paying customers and one theme, with no checkout at all.**

Build:
- The data model ([01](01-data-model.md)), migrations, admin.
- The render pipeline: one theme, end-to-end, the full section vocabulary.
- The fixture matrix and visual regression CI ([02](02-theme-architecture.md) §2.7)
  — **before theme #2, not after theme #4.**
- OG image service + QR generation ([07](07-link-previews.md)).
- A crude editor. Ugly is fine. It's for you, not them.
- Public page + open-link RSVP + a basic dashboard.

Sell:
- Take orders by hand from your own network in Kosovo/Albania/the DACH diaspora.
  Bank transfer or cash. You create the invitation for them from a form or a
  WhatsApp conversation. `orders.provider = 'manual'` — the entitlement model
  already handles it identically to a real checkout.
- Charge full price. €25–30. **Do not do it free**; a free favour teaches you
  nothing about whether people will pay, which is the only question that matters
  at this stage.

In parallel, from week 1:
- Email FastSpring / Paddle / 2Checkout ([05](05-payments.md) §5.4).
- Apply for Estonian e-Residency.

**What Phase 0 proves:** whether the artefact is good enough that people share
it, and what they actually ask for. You will be surprised by at least three
things, and it's much cheaper to be surprised now.

---

## 8.2 Phase 1 — the MVP (weeks 6–16)

**The smallest version worth charging for at scale.**

### Ship

| Area | Scope |
|---|---|
| **Auth** | Magic link. No social login, no passwords. |
| **Event kinds** | wedding, engagement, nikah, birthday, baptism, save-the-date. Same machinery, different defaults and copy. |
| **Themes** | **3 themes**, each passing the fixture matrix in Latin + Arabic + Cyrillic. Three excellent themes beat ten mediocre ones. |
| **Content** | hero, quote, countdown, story, schedule, venue, gallery, rsvp, dress_code, contacts, faq |
| **Languages** | UI in sq/de/en/tr/ar. **Two locales per invitation**, toggle mode. Full RTL. |
| **Multi-day** | Sub-events with per-guest scoping. This is your differentiator; don't cut it. |
| **Guests** | Groups, seats, plus-ones, paste + CSV import with encoding handling, tags |
| **Links** | Open link + personal tokens + "Not you?" + review queue |
| **RSVP** | 5-screen flow, sub-event selection, party size, meal preference, up to 5 custom questions, no-JS fallback |
| **Dashboard** | Counts by sub-event, guest table, activity feed, CSV/XLSX export |
| **Share** | Share screen, WhatsApp/Viber/Telegram/copy/QR, per-guest `wa.me` with `sent_at` |
| **Previews** | OG images, all sizes, the preview-check tool |
| **Payments** | One MoR, 3 bands, Basic + Plus + two add-ons (remove branding, vanity slug). PayPal if the MoR doesn't include it. |
| **Email** | Host notification on RSVP (digest, not per-response, or they'll mute you), guest confirmation, `.ics` |
| **Legal/ops** | ToS, privacy policy, DPA, cookie-free public pages, guest-data retention job, PITR backups **with a tested restore** |

### Deliberately cut from the MVP

Each of these is individually tempting. Cutting them is the plan, not an
accident:

| Cut | Why |
|---|---|
| **Seating/table planner** | Weeks of work, a genuinely hard UI, and it's used *after* the RSVP deadline — so it can't affect the purchase decision. **Highest-value Phase 2 item.** |
| **Gift registry / cash gifts** | Handling money on behalf of a couple is regulated payment services in the EU. A hard no at this stage. External registry *link* only. |
| **Guest photo upload album** | Storage, moderation, and an abuse surface (someone will upload something awful to a wedding page). Phase 2, paid. |
| **WhatsApp Business API** | Template pre-approval, per-message fees, a Meta Business verification process. Manual `wa.me` links do the job. |
| **Custom domains** | DNS support tickets forever, for a €29 product. Phase 3. |
| **MP4/video export** | Genuinely high-leverage for MENA/South Asia — and genuinely a month of work. Phase 2, and only if those markets show demand. |
| **Native apps** | No reason. It's a link. |
| **Theme marketplace / third-party designers** | Needs a sandbox, review, payouts. Phase 4. |
| **AI wording assistant** | Two days to build, nobody buys a product for it. Later, as a delight feature. |
| **Multi-user collaboration** | The join table exists ([01](01-data-model.md) §1.2); the UI doesn't. Hosts share a login. Fine. |
| **CJK support** | Not in your stated markets and it's 10MB of fonts. |
| **Guestbook, livestream pages, hotel blocks, gift lists, wedding websites** | This is the scope-creep road to competing with Squarespace and losing. |
| **Analytics beyond "how many opened the link"** | Vanity. |

### The scope discipline rule

**Every feature must survive: "does a customer decide to pay because of this?"**
Seating charts, photo albums and thank-you cards are all valuable — and all used
*after* the money changes hands. They belong in Phase 2 where they raise LTV, not
in the MVP where they delay revenue.

---

## 8.3 Phase 2 — depth in the won market (months 4–8)

Only after the DACH-Albanian funnel is producing steady sales.

1. **Themes to 10–12.** Now cheap, because the matrix and manifest exist. This is
   the highest-ROI work in Phase 2 — theme variety is what converts browsers.
2. **Seating / table planner.** Drag-drop tables, per-guest assignment, export a
   seating chart PDF and place cards. Strong add-on SKU (€19), and a real reason
   to upgrade.
3. **Bundle products**: save-the-date and thank-you card sharing the same event
   and guest list. Direct revenue-per-wedding increase with almost no new
   machinery.
4. **Guest photo album** post-event, with moderation.
5. **Automated email reminders** to non-responders.
6. **Planner/agency tier** ([04](04-pricing-and-tiering.md)) — the recurring
   revenue experiment. Probe it with five real planners before building much.
7. **MP4 export** — *if* MENA/South Asia demand shows up. The declarative motion
   vocabulary ([02](02-theme-architecture.md) §2.5) is what makes this feasible.

---

## 8.4 Phase 3 — market expansion (months 8–14)

Now, and only now, open a second funnel. Pick **one**: Turkey, or the
Turkish/Arab diaspora in DACH (which leverages the funnel you already have).

- Localised landing pages with real local SEO, not machine-translated.
- Local payment rails for that market only ([05](05-payments.md) §5.5).
- Themes designed for that market's aesthetic — not recolours of your Balkan
  themes. This is the part people underestimate.
- Support coverage in that language (a part-time contractor, not you at 1am).
- Custom domains, white-label for planners.

---

## 8.5 Phase 4 — leverage (year 2+)

- Designer/theme marketplace with revenue share.
- API and white-label for venues and planning platforms.
- Physical print fulfilment partnership (you already generate print-ready PDFs).

---

## 8.6 What "done" looks like for the MVP

A checklist worth holding yourself to before charging strangers:

- [ ] A 500-guest invitation with 5 sub-events renders in <2.5s LCP on throttled
      Slow 4G on a real mid-range Android.
- [ ] The fixture matrix passes on all 3 themes across all launch scripts.
- [ ] An Arabic invitation with a Latin venue name renders with correct bidi.
- [ ] The WhatsApp preview shows the couple's names on iOS and Android.
- [ ] The RSVP form completes with JavaScript disabled.
- [ ] A restore from backup has been performed into a scratch database.
- [ ] The guest-data retention job has run in staging and deleted what it should.
- [ ] A refund webhook downgrades an invitation without 404-ing a live page.
- [ ] Someone who is not you has created and published an invitation without
      asking you a single question.

That last one is the real gate.
