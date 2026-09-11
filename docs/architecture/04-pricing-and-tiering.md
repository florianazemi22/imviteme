# 4. Feature tiering and pricing

---

## 4.1 The pricing model in one line

**One invitation = one purchase.** Two tiers plus à-la-carte add-ons, priced in
three regional bands, band determined by the payment instrument's billing
country.

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

### Basic — band A **€29**

The floor. Must be genuinely usable, or it poisons the brand.

- 1 invitation, 1 event date (sub-events readable but not RSVP-scoped)
- Standard themes (not premium)
- **1 language**
- Public link + QR code (PNG)
- **RSVP: yes/no + party size + one free-text message**
- Guest list up to **150 entries**, manual + CSV import
- Dashboard: counts, list, CSV export
- Email notification to host, confirmation to guest
- Link live until **60 days after the event**
- "Made with Imvite" footer

### Plus — band A **€59**

Everything in Basic, plus:

- **Premium themes**
- **Second language**, side by side or toggle
- **Multi-day sub-events with per-guest scoping**
- **Personalised per-guest links** (greeting, prefilled, scoped)
- Plus-one management
- Custom RSVP questions (up to 5), meal preference, transport/accommodation
- Gallery (up to 40 photos), music, countdown
- **Unlimited guests**
- Link live **12 months** after the event
- Priority support during the event week

### Add-ons (à la carte, any tier) — band A

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

## 4.4 Regional pricing: three bands, one rule

### The bands

| Band | Rough multiplier | Markets |
|---|---|---|
| **A** | 1.00 | US, CA, UK, DE, AT, CH, NL, BE, FR, IT, ES, Nordics, IE, AU, NZ, IL, AE, SA, QA, KW, BH, OM, SG, JP, KR |
| **B** | 0.60 | PL, CZ, HU, RO, BG, GR, HR, SI, SK, Baltics, PT, TR, MX, BR, AR, CL, CO, MY, TH, ZA |
| **C** | 0.35 | XK, AL, MK, RS, BA, ME, MD, UA, GE, AM, EG, MA, TN, DZ, JO, LB, IQ, IN, PK, BD, LK, NP, ID, PH, VN, NG, KE, most of Sub-Saharan Africa |

So Basic is €29 / €17 / €10 and Plus is €59 / €35 / €20.

**Three bands, not twenty.** A per-country ladder is a maintenance burden, makes
your public pricing page incoherent, and invites screenshot-based "why do
Bulgarians pay less than Romanians" arguments. Three is enough to capture most of
the purchasing-power difference.

**A ~3× spread is the ceiling.** Wider than that and arbitrage becomes worth the
effort, and the band-A customer who discovers the band-C price feels cheated.

### The rule that prevents arbitrage

**Price by the billing country of the payment instrument, never by IP, never by a
dropdown.**

- IP/geo is for *display* on the pricing page only.
- At checkout, the merchant-of-record returns the card's issuing/billing country.
  That determines the band and the final charged amount.
- If the billing country lands in a different band than the displayed price, show
  the change explicitly before charge ("Prices are set by your card's country").
- **Never let the customer select their country from a dropdown for pricing
  purposes.** That's not anti-arbitrage theatre, it's the actual hole.

### The insight that matters most

**Your highest-value customer is a diaspora buyer paying band A for a wedding in
a band C country.** A Kosovar in Zurich, a Pakistani in Birmingham, a Moroccan in
Brussels — they hold a Swiss/UK/Belgian card, they're organising a 400-guest
wedding back home, and they have Western purchasing power. They are the wedge.

This means:
- Band C must be determined by the *card*, not by the *event location*. An event
  in Prishtina paid for with a Swiss card is band A. Correct, and not something to
  apologise for.
- Don't offer an "event country" field anywhere near pricing logic.
- Market to the diaspora in their language, and the payment takes care of itself.

### Practical anti-arbitrage measures

Worth doing, in order:

1. Billing-country-driven pricing (above). Does 90% of the work.
2. **3D Secure on** for everything. Band C + stolen card is a known pattern, and
   3DS shifts chargeback liability.
3. Flag mismatch (IP country in band A, card in band C) for review above a
   threshold. Don't block — false positives on legitimate travellers and diaspora
   are common and expensive.
4. Accept that a small amount of leakage will happen. For a €29 one-time purchase
   the effort-to-reward for a customer to obtain a foreign card is poor. **Do not
   over-engineer this.** The realistic annual loss is smaller than a week spent
   building a fraud system.

### Currency and presentation

- Charge in the **local currency** with locally sensible price points: €29,
  CHF 32, £25, $34, ₺899, ₹899, AED 129, R$ 89. Never a raw FX conversion —
  "€28.73" reads as amateur.
- **Tax-inclusive display in the EU and UK** (required by consumer law),
  tax-exclusive in the US. Your MoR handles collection; you set the gross.
- Review price points quarterly against FX; a 20% TRY move will quietly destroy
  your Turkish margin.
- Anchor with a struck-through "regular" price only if it was ever real. Fake
  anchoring is illegal under the EU Omnibus Directive (price must be the lowest
  charged in the prior 30 days).

---

## 4.5 Discounts and promotion structure

- **Promo codes grant entitlements via the `promo` source** ([01](01-data-model.md) §1.9),
  so a 100% code and a paid order produce the same render path.
- Planner referral codes: track `orders.raw_payload.referral` and pay out
  quarterly. Manual at first; automation is premature.
- **Seasonal discounts are dangerous in this product.** Weddings are booked
  months ahead; a January sale trains customers to wait and cannibalises the
  May–September peak. Prefer bundles (invitation + save-the-date + thank-you at
  €79) over percentage-off.
