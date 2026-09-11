# 4. Feature tiering and pricing

---

## 4.1 The pricing model in one line

**One invitation = one purchase.** Two tiers plus à-la-carte add-ons, one
currency, one price list.

---

## 4.2 What goes where

### Free (unpaid draft)

The customer builds the **entire** invitation — every field, every theme, live
preview, guest list import, the lot. What they cannot do is publish:

- Preview link works but is watermarked, marked DRAFT, `noindex`, and expires 72h.
- No QR code, no OG image, no RSVP collection.

**Rationale:** the conversion moment in this product is emotional, and it happens
when the customer sees their own names in a beautiful theme. Gating the editor
behind payment moves the decision earlier, when they have nothing invested. Let
them build it, fall in love with it, then charge to publish. This is the single
most important pricing decision in the document.

### Basic — **€29**

The floor. Must be genuinely usable, or it poisons the brand.

- 1 invitation, 1 event date (sub-events readable but not RSVP-scoped)
- Standard themes (not premium)
- Public link + QR code (PNG)
- **RSVP: yes/no + party size + one free-text message**
- Guest list up to **150 entries**, manual + CSV import
- Dashboard: counts, list, CSV export
- Email notification to host, confirmation to guest
- Link live until **60 days after the event**
- "Made with Imvite" footer

### Plus — **€59**

Everything in Basic, plus:

- **Premium themes**
- **Multi-day sub-events with per-guest scoping**
- **Personalised per-guest links** (greeting, prefilled, scoped)
- Plus-one management
- Custom RSVP questions (up to 5), meal preference, transport/accommodation
- Gallery (up to 40 photos), music, countdown
- **Unlimited guests**
- Link live **12 months** after the event
- Priority support during the event week

### Add-ons (à la carte, any tier)

| Add-on | Price | Why |
|---|---|---|
| Remove "Made with Imvite" | **€19** | Zero marginal cost, highest margin, high emotional pull. Keep it deliberately expensive — the footer is your growth loop and you should be paid well to remove it. |
| Vanity slug (`imvite.me/arta-besnik`) | €9 | |
| Custom domain | €29 | Phase 3 |
| Print pack (QR + invitation card, print-ready PDF, CMYK, bleed) | €15 | Physical cards still get sent in every one of your markets |
| 10-year archive | €19 | Sold at the emotional peak; near-zero cost; solves "we want to keep it forever" |
| Guest photo album (post-event uploads) | €19 | Phase 2 |
| Extra invitation for the same event (save-the-date / thank-you) | €19 | The retention fix |
| Designer touch-up (human, 1 revision round) | €49 | Sell your time at the top of the market; also a great research channel |

### Planner / agency — **subscription**, from €39/mo

This is where the recurring revenue lives. 10 invitation credits/month, all
premium features, sub-accounts, white-label footer, a client roster view, bulk
guest tooling. Wedding planners in DACH, Turkey and the Gulf are a small,
findable, high-LTV audience who will happily pay monthly — and each one brings
20–60 weddings a year. **Probe this channel early; it may end up bigger than
direct consumer sales.**

---

## 4.3 Tiering principles I'd hold to

1. **Never gate RSVP.** RSVP is the product. A competitor's free tier that
   collects RSVPs beats your paid tier that doesn't.
2. **Gate on capability, not on guest count — except once, at the Basic floor.**
   A 150-guest cap on Basic is a fine upsell trigger (Balkan and South Asian
   weddings routinely blow past it, which is the point). But do not build a
   per-guest pricing ladder: the customer genuinely does not know their guest
   count when they buy, and a price that rises as their family grows generates
   resentment at exactly the wrong moment.
3. **Gate on "does this make the invitation more beautiful or more organised",
   not on "does this cost me money".** Your marginal costs are near zero; price on
   value.
4. **Never downgrade a published invitation** because an entitlement lapsed while
   guests are looking at it. `expires_at` extends to at least the event date +
   grace, always.
5. **The free draft has no time pressure.** No "your draft expires in 7 days"
   countdown. People plan weddings nine months out; artificial urgency reads as
   cheap and drives them to a competitor.

---

## 4.4 One price list

One currency, one set of prices, shown tax-inclusive. No regional bands, no
geo-detection, no "contact us for local pricing".

This is the right call while there is one market. It removes a whole class of
work — currency tables, FX drift, billing-country detection, arbitrage
controls, an incoherent public pricing page — none of which earns anything
until there is demand from somewhere the current price doesn't fit.

What to keep in mind so this stays a cheap decision to revisit:

- **`orders` already stores `currency` and `billing_country`** ([01](01-data-model.md) §1.9).
  Record them from day one even though you only ever see one value. When the
  question of a second market comes up, you will have a year of data telling you
  where people actually tried to buy from.
- **`price_points` is keyed by SKU and currency**, so adding a second currency
  later is an insert, not a migration.
- **Prices are stored in minor units as integers.** Never floats, never a
  formatted string.
- **Tax-inclusive display** where consumer law requires it; your merchant of
  record handles collection, you set the gross. See [05](05-payments.md) §5.2.
- **A struck-through "was" price must be real** — under the EU Omnibus
  Directive it has to be the lowest price charged in the previous 30 days.
  Don't invent anchors.
- Review the price against costs and conversion quarterly. A one-time €29
  product has no second chance to make its margin.

## 4.5 Discounts and promotion structure

- **Promo codes grant entitlements via the `promo` source** ([01](01-data-model.md) §1.9),
  so a 100% code and a paid order produce the same render path.
- Planner referral codes: track `orders.raw_payload.referral` and pay out
  quarterly. Manual at first; automation is premature.
- **Seasonal discounts are dangerous in this product.** Weddings are booked
  months ahead; an off-season sale trains customers to wait and cannibalises the
  peak. Prefer bundles (invitation + save-the-date + thank-you at
  €79) over percentage-off.
