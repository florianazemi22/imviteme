# 5. Payments for a Kosovo-based founder selling worldwide

> **Read [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) alongside this.** Provider
> country eligibility changes without notice and is the single most
> time-sensitive thing in this plan. Everything here is "as I understand it —
> verify before committing", and I've marked confidence levels. Do not make the
> company-formation decision on my say-so alone; confirm with the provider in
> writing and with an accountant.

---

## 5.1 The blunt version

**You cannot build this on Stripe from Kosovo.** Kosovo (XK) is not in Stripe's
supported-countries list, and — separately — Kosovo's non-universal recognition
means it is absent from many providers' country dropdowns and present on some
sanctions-screening vendors' "enhanced due diligence" lists, which trips
automated onboarding even where policy would allow it. Kosovo also has no ISO
3166-1 alpha-2 code in wide use (XK is a "user-assigned" placeholder), which
breaks provider onboarding forms in ways nobody will help you fix.

Consequences:

- Almost every modern, developer-friendly payment stack (Stripe, and the growing
  set of things built on Stripe — Lemon Squeezy, Polar, Paddle's card processing)
  is either unavailable or requires a non-Kosovo legal entity.
- **This is a 1–3 month lead-time item.** Company formation, bank/EMI account
  opening and merchant onboarding all have real latency and at least one of them
  will go wrong. Start it in week one, in parallel with building. If you start it
  when the product is ready, you will slip your launch by a quarter.

---

## 5.2 Why merchant-of-record, not "payment gateway"

Independent of the Kosovo problem, you should be selling through a **merchant of
record (MoR)** — a company that becomes the legal seller, charges the customer,
and handles tax.

The reason is tax, and it's not optional:

- **EU VAT on B2C digital services is due at the customer's rate, from the first
  euro.** There is no small-seller threshold for a supplier established outside
  the EU. Selling a €29 invitation to one person in Germany creates a German VAT
  obligation. You'd register for the **non-Union OSS** scheme, file quarterly,
  and track rates across 27 member states.
- **UK VAT** likewise, from the first sale, for a non-established seller.
- Plus Norway VOEC, Switzerland, Turkey's digital services VAT, Australia GST,
  Canada GST/HST, Japan CT, Saudi/UAE VAT, and a growing number of others.
- Plus EU consumer law: the **14-day right of withdrawal** for digital services,
  which you can only waive by taking an explicit, logged acknowledgement at
  checkout that the customer loses it upon immediate performance. If you skip that
  checkbox, every refund request within 14 days is mandatory.

A solo developer cannot run that. An MoR does it as the product. The 5–8% they
take is cheaper than an accountant, and much cheaper than getting it wrong.

**Recommendation: MoR from day one. Revisit only if you exceed ~€500k/yr,** at
which point the fee delta starts to justify direct acquiring plus a tax
compliance vendor.

---

## 5.3 Provider-by-provider

### Will not onboard you as a Kosovo entity (high confidence)

| Provider | Why |
|---|---|
| **Stripe** | Kosovo not in supported countries. This also rules out anything built on Stripe Connect. |
| **Lemon Squeezy** | Acquired by Stripe (2024); seller eligibility follows Stripe's footprint. |
| **Polar.sh** | Built on Stripe Connect. Same constraint. |
| **Adyen, Checkout.com, Braintree** | Enterprise onboarding, EU/US/UK entity expected, volume minimums you don't have. |
| **Apple/Google in-app** | Not applicable — web product — but note that if you ever ship native apps, IAP rules on digital goods would take 15–30%. Another reason to stay web-first. |

### Might onboard a Kosovo entity — worth a direct email, low confidence

| Provider | Notes |
|---|---|
| **FastSpring** | Full MoR, US-based, manual merchant review rather than automated country gating. They have historically onboarded sellers from unusual jurisdictions. **Email them first — this is the cheapest possible test of whether you can skip company formation entirely.** |
| **Paddle** | Full MoR, strong product, good tax handling. Seller country restrictions exist and I don't know whether Kosovo is on the permitted list. Worth asking; assume no. |
| **2Checkout / Verifone** | MoR, broad Balkan seller support historically (Romanian roots). Dated developer experience, but it works and they accept sellers others won't. |
| **Payhip, Gumroad** | Low-friction MoR-ish, but payouts route through PayPal/Stripe — so you inherit those constraints. Gumroad's fees and branding are poor for a €29 product. Possible for a very first revenue test, not a foundation. |
| **PayPal / Braintree** | PayPal's coverage of Kosovo has been partial and has changed over time — the recurring issue is *withdrawal to a local bank account*, not accepting payments. Verify current status directly. Even if it works, PayPal alone is not a checkout. |

### Local Kosovo acquiring

ProCredit Bank, Raiffeisen Kosovo, TEB, NLB and BKT all offer e-commerce
acquiring (typically fronted by a regional gateway such as Payten/ASEE or the
bank's own). Realistic assessment:

- **Good for:** domestic Kosovo/Albania card payments in EUR, and it makes you
  look local, which matters for trust in the home market.
- **Bad for:** everything else. Expect 3DS flows that fail on foreign cards, no
  Apple/Google Pay, weak or absent APIs and webhooks, EUR only, monthly fees, a
  deposit/rolling reserve, and zero help with international tax.
- **Verdict:** a Phase-2 supplement for the home market, never the primary rail.

---

## 5.4 Corporate structure: the three realistic paths

### Path A — Estonian OÜ via e-Residency **(recommended)**

- e-Residency card: ~€120–150 + pickup. Company formation online: ~€250–350.
  Mandatory contact person/legal address: ~€200–400/yr. Accounting: ~€600–1,500/yr.
- Gives you an **EU entity**, which unlocks Stripe *and* Paddle *and* FastSpring,
  gives you an EU establishment (so no separate GDPR Art. 27 representative
  needed), and makes you credible to EU customers.
- Estonia's corporate tax model taxes **distributed** profit, not retained profit
  — attractive while reinvesting. **Verify current rates and the 2026 changes with
  an accountant; Estonian rates have been moving.**
- **The thing to check before committing:** you are tax-resident in Kosovo. An
  Estonian company managed from Kosovo may create a Kosovo permanent
  establishment, and your dividends are taxable in Kosovo. Kosovo–Estonia double
  taxation treaty status needs checking. **This is an accountant question, not a
  Reddit question**, and getting it wrong is the expensive kind of mistake.
- Banking: Estonian banks rarely open accounts for e-residents with no local ties.
  Use an EMI — **Wise Business**, **Payoneer**, or an Estonian fintech (LHV's
  e-resident programme, Zen, Swan). Verify each will accept a Kosovo-resident
  director; this is the step that most often fails.

### Path B — US LLC (Delaware/Wyoming) via Stripe Atlas

- ~$500 formation + ~$100–300/yr registered agent, plus annual franchise tax.
- Stripe Atlas bundles formation + Stripe account + Mercury bank account. Fast.
- **But:** a single-member foreign-owned LLC must file Form 5472 + pro-forma 1120
  annually — **$25,000 penalty for late filing**, and most cheap bookkeepers get
  this wrong. You'll want a US CPA (~$800–1,500/yr).
- It does nothing for EU VAT — you'd still need an MoR or OSS registration.
- Worse for EU customer trust and for GDPR posture than an EU entity.
- **Choose this only if Path A's banking step fails.**

### Path C — Albanian entity

- Same language, cheap, one border away, familiar accountants, and culturally
  natural for your first market.
- **But** Albania is not in Stripe's supported countries either, and is not in the
  EU, so you gain very little on the payments axis over Kosovo.
- **Verdict:** fine as an operating/employment vehicle later, useless as the
  payments fix. Don't do this expecting it to solve Stripe.

### What I'd actually do, in order

1. **Week 1:** email FastSpring, Paddle and 2Checkout sales, plainly: "Kosovo
   sole proprietorship / LLC, digital invitations, expected €2–5k/mo in year 1,
   can you onboard me?" Written answers cost you three emails and might save you
   €2,000 and two months.
2. **Week 1, in parallel:** apply for Estonian e-Residency regardless. It takes
   4–8 weeks and it's the fallback for nearly every failure mode.
3. **Weeks 1–8, while waiting:** sell manually. Kosovo/Albania bank transfer and
   cash, invoice from your Kosovo entity, activate the invitation by hand
   (`orders.provider = 'bank_transfer'`, `EntitlementResolver` runs identically —
   the data model already supports this cleanly). Ten real paying customers before
   you have a checkout is worth more than the checkout.
4. **Week 8+:** wire up the MoR that said yes.

---

## 5.5 Regional payment methods — what actually matters

Once you have an MoR, cards, Apple Pay and Google Pay work nearly everywhere.
These are the places where cards alone lose you real sales:

| Market | What you need | Notes |
|---|---|---|
| **Germany / Austria** | **PayPal**, SEPA direct debit, Klarna | Card penetration for online purchases is genuinely low. PayPal is close to mandatory in DE — and DE is your #1 diaspora market. **Highest-priority non-card method.** |
| **Netherlands** | iDEAL | Dominant; near-universal |
| **Turkey** | iyzico or PayTR, and **instalments (taksit)** | Turkish consumers expect to split even small purchases across 3–6 instalments; the option is a conversion feature in itself. Requires a Turkish entity or a local PSP relationship, so realistically Phase 3. MoR card acceptance works in the meantime but converts worse. |
| **Saudi Arabia** | **mada** | Domestic debit scheme on most Saudi cards; a "Visa/Mastercard only" checkout fails a lot of them. Via Moyasar/Tap/HyperPay. |
| **UAE / Gulf** | Cards work fine; Tap Payments for local optimisation | Lower priority than mada |
| **Kuwait / Bahrain** | KNET / BENEFIT | Domestic schemes, same problem as mada |
| **Egypt / Morocco** | Fawry (EG), local cards, cash-on-delivery habits | Band C anyway; low absolute revenue. Deprioritise. |
| **India** | UPI (Razorpay/Cashfree) | UPI is overwhelmingly dominant. Razorpay requires an Indian entity. Also note RBI card-on-file tokenisation rules. Realistically Phase 3+ and probably only if India proves out. |
| **Pakistan** | JazzCash, Easypaisa | Low card penetration; same structural problem |
| **Brazil** | **PIX**, Boleto | PIX is now the default payment method in Brazil; cards alone leave most of the market on the table. Via dLocal/EBANX/Mercado Pago. |
| **Mexico** | OXXO, SPEI, Mercado Pago | |
| **Balkans (XK/AL/MK)** | Bank transfer, **cash**, card | Keep a manual bank-transfer path forever for the home market. It converts, and it costs you a webhook handler you already have. |

### Sequencing

- **Phase 1:** MoR (cards + Apple/Google Pay worldwide) + **PayPal** + manual
  bank transfer for the Balkans. That covers, at a rough guess, 85% of your
  realistic early revenue.
- **Phase 2:** iDEAL/Klarna (usually already inside your MoR), local Balkan
  acquiring.
- **Phase 3:** only where a market proves it deserves the integration work —
  iyzico for Turkey, Tap/Moyasar for the Gulf, dLocal for LatAm.

**Don't build for a market before it has bought anything.** Each local rail is
~2 weeks of integration plus ongoing reconciliation. That's a theme and a half.

---

## 5.6 Implementation notes

- **Webhook-driven, idempotent, replayable.** Store the raw payload verbatim,
  dedupe on `(provider, provider_order_id)`, and make `EntitlementResolver`
  recomputable from `orders` alone. You will need to replay; every payments
  integration eventually needs to replay.
- **Verify webhook signatures.** Every provider supports it; every provider has
  docs people skip.
- **Never grant entitlements from a redirect/success URL.** Only from the
  verified webhook. Show "processing" on the success page and poll — a payment
  granted by a client-side redirect is a payment anyone can grant themselves.
- **Handle refunds and chargebacks in code from day one**, not "later". Re-run
  the resolver; downgrade but **never unpublish an invitation whose event is
  within 14 days** — instead flag it for manual review. A guest-facing 404 on
  someone's wedding day because of a payment dispute is an unrecoverable
  reputational event.
- **Store the invoice/receipt URL** the MoR gives you on `orders`; customers in
  DACH will ask for a proper invoice and you want a one-click answer.
- **The withdrawal-right checkbox** at checkout ("I want immediate access and
  acknowledge I lose my 14-day right of withdrawal") — log the timestamp and the
  exact text version shown. MoRs generally provide this, but confirm it's present
  and that you receive the acknowledgement record.
