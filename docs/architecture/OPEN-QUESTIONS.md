# Open questions — things I'm not certain about

Everything here is a claim elsewhere in these docs that I would not bet money on
without checking. Ordered by how expensive it is to get wrong.

Confidence key: **High** = I'd act on it. **Medium** = probably right, verify
before committing money or a month. **Low** = a starting hypothesis only.

---

## Blocking — verify in week 1

### 1. Which merchant of record will onboard a Kosovo entity
**Confidence: Low on specifics, High on "Stripe won't".**

- Stripe not supporting Kosovo: High confidence.
- FastSpring / Paddle / 2Checkout accepting a Kosovo seller: genuinely unknown.
  Country lists change and aren't always published accurately.

**How to verify:** email each one's sales/onboarding directly. Say plainly:
Kosovo-registered business (or sole proprietor), digital invitation SaaS,
expected €2–5k/month year one, need MoR with global VAT handling. Ask for a
written yes/no. Three emails, one afternoon. **Do this before spending €2,000 on
company formation** — if one says yes, Path A in [05](05-payments.md) may be
unnecessary.

Also worth confirming: the MoR reports the **billing country** on each order.
You do not price on it today ([04](04-pricing-and-tiering.md) §4.4), but
recording it from day one is what tells you later whether a second market is
worth opening.

### 2. Estonian OÜ tax exposure for a Kosovo-resident director
**Confidence: Low.**

Specifically: (a) does managing an Estonian OÜ from Prishtina create a Kosovo
permanent establishment; (b) is there a Kosovo–Estonia double taxation treaty and
what does it say about dividends; (c) current Estonian distributed-profit tax rate
and the 2025–2026 changes.

**How to verify:** one paid hour with a Kosovo accountant who has handled foreign
holding structures, plus one with an Estonian e-residency accounting firm
(LeapIN/Xolo, Enty, 1Office). ~€300 total. Cheapest insurance in this plan.

### 3. Whether an EMI will open a business account for a Kosovo-resident director
**Confidence: Low.**

Wise Business, Payoneer, Revolut Business, LHV, Zen — each has its own view of
Kosovo residency, and this is the step of Path A that most often fails silently
after you've already paid for the company.

**How to verify:** ask before forming the company, not after. Wise and Payoneer
support chat will answer.

---

## Important — verify before building on them

### 4. Production-music licensing for end-user-published pages
**Confidence: Medium that standard subscriptions don't cover it.**

Epidemic Sound / Artlist / Musicbed standard terms license the subscriber's own
content. Music playing on a page your *customer* publishes, hosted by you, is a
different use. There may be a partner/API tier that covers it.

**How to verify:** email Epidemic Sound partnerships and Artlist. If the answer
is unclear or expensive, commission original tracks — that's my recommendation
anyway ([02](02-theme-architecture.md) §2.6).

### 5. Stock asset licensing for theme designs
**Confidence: High that this is a real trap, Medium on the specifics per
marketplace.**

Envato's regular license restricts items used in products where end users can
customise the result. Creative Market, Canva and Adobe Stock each have their own
rules. Font EULAs separately often restrict webfont embedding *and* server-side
rasterisation (which your OG service does).

**How to verify:** read the actual EULA for every asset and font before it enters
a theme. Keep `themes/<code>/LICENSE.md` recording provenance from theme #1.

### 7. WhatsApp OG image size threshold and cache duration
**Confidence: Medium.**

The ~300KB guidance and "cached for weeks" are widely reported but not
officially documented, and change without notice.

**How to verify:** empirically, with real shares on real devices, at 200KB /
400KB / 800KB. Then re-test quarterly. Staying under 300KB costs nothing, so the
practical risk here is low — the *cache duration* is the part that shapes your
publish flow, so test the "edit after sharing" case deliberately.

### 8. Processor vs. controller status for guest data
**Confidence: Medium.**

I've assumed processor-for-guest-data / controller-for-account-data, but
platforms have been found to be joint controllers where they determine purposes
(e.g. by using the data for their own analytics or product improvement).

**How to verify:** one hour with a data protection lawyer in Germany or Austria
(your biggest EU market), specifically on this and on the Art. 9 dietary data
question. ~€300–500.

### 9. Whether meal preference / allergy data is Art. 9 special category
**Confidence: Medium-High that some of it is.**

"Coeliac" and "nut allergy" are health data; "halal"/"kosher" may reveal
religion. The mitigations in [09](09-risks.md) §9.5 are cheap and worth doing
regardless of the legal answer.

---

## Worth checking, low cost if wrong

### 10. CSS `animation-timeline: view()` browser support in your actual audience
Your users skew towards older mid-range Android in some markets. Check real
support against your analytics before relying on scroll-driven CSS animations
rather than the IntersectionObserver fallback. The fallback exists either way, so
this only affects how much JS ships.

### 12. `sms:` URL scheme separator differences
iOS historically wants `sms:&body=`, Android `sms:?body=`. `sms:?&body=` is the
commonly cited both-platforms form. Test on real devices.

### 14. Current Kosovo bank e-commerce acquiring terms
Fees, rolling reserves, API quality and 3DS behaviour at ProCredit / Raiffeisen /
TEB / BKT. Worth a call each if you want a domestic card rail in Phase 2.

### 15. What the competitors' funnels actually feel like
Before finalising tiering, go buy an invitation from two competitors and go
through the whole flow as a customer, including the RSVP as a guest. An
afternoon and about €50, and it will sharpen
[04](04-pricing-and-tiering.md) more than anything I can tell you.

---

## Things I'm confident about and you don't need to verify

For completeness, so you know where to *not* spend time:

- Stripe does not support Kosovo.
- EU B2C digital-services VAT is due from the first sale for a non-established
  supplier; an MoR is the right answer for a solo founder.
- Headless Chromium gives far better typography than any PHP image or PDF
  library, and renders the theme's own CSS.
- Crawlers don't execute JavaScript, so OG tags must be server-rendered.
- Pinning theme versions per published invitation is the right call.
