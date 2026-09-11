# 9. Risks — what will actually kill this

Ordered by my estimate of how likely each is to end the project, not by how
dramatic it sounds.

---

## 9.1 Distribution, not product — **the one most likely to kill it**

You can build this. That is not in question, and it's also not the problem.

The problem: in nine months you will have twelve beautiful themes, six languages,
flawless RTL, and forty visitors a month. Digital invitations are a **zero-intent,
zero-retention, once-in-a-lifetime search**. Nobody browses for invitation
platforms. They search once, from a phone, three weeks before they need it, and
they buy whatever their cousin used.

That means distribution is:
- **SEO in each language** — "ftesa dasme online", "digitale Hochzeitseinladung",
  "düğün davetiyesi online", "دعوة زفاف الكترونية". Six months of lead time
  minimum, and the content has to be genuinely native, not translated.
- **Instagram and TikTok with local wedding creators** — this is where these
  audiences actually are, and it's paid or relationship-driven work.
- **Wedding planners and venues** — the highest-leverage channel and the one you
  can start today with a WhatsApp message. One planner = 30 weddings a year.
- **Word of mouth**, which is why the "Made with Imvite" footer is a growth loop
  and should never be free to remove.

**None of that is engineering.** Budget at least as much time for distribution as
for the product, from Phase 0. If you can't, then the plan is wrong, not the
execution.

**Concrete mitigation:** before you write theme #2, get five wedding planners in
Prishtina, Tirana, Zurich and Stuttgart on the phone. Not a survey — a call.
If you can't get five planners interested in a free trial, more themes won't fix
it.

---

## 9.2 The "many cultures from day one" trap

Covered in [README](README.md), restated because it's the second most likely
failure: **code internationalisation is cheap, market internationalisation is
not.** Supporting eight languages in the product costs you ~15% extra build time.
Supporting eight *markets* costs you eight SEO efforts, eight content
strategies, eight payment integrations, eight support inboxes and eight sets of
culturally correct default themes — with revenue split eight ways, none of which
reaches critical mass.

The specific failure mode: you spread across markets, are #7 in all of them,
build brand recognition in none, and run out of runway. Meanwhile a competitor
who owns Albanian weddings entirely has a defensible business.

**Build the architecture for all of them. Sell to one.**

---

## 9.3 Payment/company structure delay

Real, immediate, and entirely within your control if you start now. See
[05](05-payments.md). If you begin company formation when the product is ready,
you lose a quarter — and in a business with a May–September peak, losing a
quarter can mean losing a year.

**Start in week 1.**

---

## 9.4 Reliability on the day — the reputational cliff

Your failure mode is not "some downtime". It's "the invitation page was down on
Saturday the 18th of July while 400 people tried to open it, and the family is
now telling everyone they know." In tight-knit diaspora communities, one such
incident propagates further than a year of marketing.

Non-negotiables, all cheap:

- **Cloudflare cache with `stale-if-error` and Always Online.** Guests see the
  invitation even if your origin is dead. This alone converts your worst-case
  scenario from a catastrophe into an inconvenience.
- **Pinned theme versions** ([01](01-data-model.md) §1.5) so a deploy can never
  alter a live invitation.
- **A deploy freeze on Fridays and Saturdays, May–September.** Yes, really.
- **Postgres PITR with a restore you have actually performed.**
- **Uptime monitoring with a phone alert** (Better Stack / Uptime Robot) on the
  public render path specifically, not just the homepage.
- **A synthetic check that renders a real invitation and asserts the names appear**
  — not just a 200.
- **Never hard-delete guest data on a schedule without a reversible window.**

---

## 9.5 Legal — the specific things, not the generic list

### Dietary and allergy data is probably Article 9 special-category data

Under GDPR, data revealing health is special category. "Coeliac", "nut allergy",
"diabetic" are health data. "Halal", "kosher", "no pork" may reveal religious
belief — also Article 9. You are collecting these by design, from **third parties
(guests) who never signed up to your service**.

Mitigations, all worth doing:
- Frame the field as **"meal preference"** with neutral preset options, plus an
  optional free-text note.
- Collect **explicit consent** at the point of RSVP ("we'll share this with the
  hosts and their caterer"), logged with the text version shown.
- **Retention limit** — purge N days after the event, default 90, host gets an
  export first. Ship this in the MVP.
- Never use it for analytics, aggregation across invitations, or training
  anything.
- Make it an optional field the host can disable entirely.

This is the GDPR exposure that most invitation platforms have and almost none
handle. It won't kill you, but it's the one a German data protection authority
would find interesting, and it's cheap to get right up front.

### Controller / processor roles

The host uploads other people's personal data. You are most likely a **processor**
for guest data (the host determines the purposes) and a **controller** for account
data — but the line is genuinely blurry and platforms have been found to be joint
controllers. Practical steps: publish an **Art. 28 DPA** the host accepts as part
of the ToS, list your sub-processors (Cloudflare, R2, your mail provider, your
MoR, your host), and provide a per-invitation data export and delete. **Get an
hour with a lawyer on this specific question**; it's not a thing to resolve from
blog posts.

### EU representative (Art. 27)

If you have no EU establishment and you process EU residents' data, you need a
designated EU representative. An Estonian OÜ removes the requirement. If you stay
Kosovo-only, budget €300–800/yr for a representative service.

### Music licensing

See [02](02-theme-architecture.md) §2.6. The trap is assuming an Epidemic
Sound/Artlist subscription covers music on pages *your customers* publish. It
generally does not — those licenses cover the subscriber's own content.
**Commission original tracks with a full buyout.** ~€3,000 makes this problem
permanently go away, and it's the cheapest legal insurance in this document.

### Theme asset licensing — **the underrated one**

If you build themes from Envato/Creative Market/Canva assets, read the license.
Most standard licenses explicitly prohibit use in a product where **end users can
customise the item** — which is precisely what a theme marketplace is. Using a
€16 Envato floral set across your catalog could mean a takedown of your entire
theme library, and the rightsholder would be in the right.

- Commission original illustration/ornament sets, or
- Buy explicitly resale-compatible / "extended for templates" licenses, and
- **Keep a `LICENSE.md` per theme** recording the provenance of every asset and
  font, with the license text or purchase receipt. Do this from theme #1; it's
  impossible to reconstruct later.
- Fonts too: many beautiful display fonts prohibit webfont embedding or
  server-side rendering (which your OG service does). Check each one.

### Consumer law

- **14-day right of withdrawal** on digital services, waivable only with an
  explicit logged acknowledgement at checkout ([05](05-payments.md) §5.6).
- **EU Omnibus Directive**: a struck-through "was" price must be the lowest price
  charged in the previous 30 days. Don't invent anchors.
- **Cookie-free by default on public invitation pages.** Use Plausible/Umami
  (self-hosted, no cookies) or Cloudflare Web Analytics. A consent banner on a
  wedding invitation is both a conversion killer and aesthetically insulting to
  the artefact you just sold.

### Kosovo specifics

Kosovo's Law No. 06/L-082 on Personal Data Protection is GDPR-aligned. GDPR
applies to you extraterritorially (Art. 3(2)) for EU customers regardless. No
conflict, but you'll be complying with both.

---

## 9.6 Competition — the honest map

**You are not defensible technically.** Everything in this document can be
rebuilt by a competent team in four months. Your moat is theme quality,
localisation depth, and trust inside specific communities. Accept that and
compete on execution and taste.

| Competitor | Where | Threat |
|---|---|---|
| **eftesa.com** | Albanian | Direct, incumbent, knows the market. They can add languages faster than you can build a brand. **Your advantage is only that you're building multi-script from the schema up; use it or you have nothing.** |
| **Withjoy, Zola, The Knot** | US | Free wedding websites, VC-funded. They will not localise to the Balkans or add Nastaliq. Not a real threat in your markets; a serious one if you chase the US. |
| **Greenvelope, Paperless Post** | US/UK | Premium, English-first, card-aesthetic. They own the anglophone premium segment. Don't fight there. |
| **Evite** | US | Free, ad-supported, downmarket. Irrelevant to you. |
| **Local Turkish `davetiye` apps** | TR | Numerous, cheap (₺100–300), decent. Turkey is a crowded, price-compressed market. **Reconsider whether Turkey is really your phase-3 pick.** |
| **Zankyou, Bodas.net** | ES/LatAm | Established, marketplace model |
| **WedMeGood, ShaadiSaga** | IN | Marketplace-first with invitations attached; huge and entrenched |
| **Freelancers on Instagram with After Effects** | MENA, South Asia | **The actual incumbent in those markets.** They deliver an animated MP4 to WhatsApp for $20–50, personally, in the customer's language, over DM. Your web-link product is a *different* format, and convincing that customer to want a link instead of a video is a market-education problem, not a feature gap. This is the biggest reason to be sceptical of an early MENA/South Asia push — and the reason MP4 export matters if you do go there. |

---

## 9.7 Seasonality and one-shot economics

Balkan, Turkish and South Asian weddings cluster heavily May–September. Revenue
will be spiky and there is **no retention** — every year you start from zero
customers. Implications:

- CAC must be recovered on the first (only) purchase. Paid acquisition at €29 AOV
  is brutal; organic, referral and planner channels are the only viable ones.
- Cash flow: you'll earn in summer and burn in winter. Plan personal runway
  around that, and use the off-season to build.
- **The fixes are structural, not marketing:** multiple purchases per wedding
  (save-the-date + invitation + thank-you), the planner subscription, and
  after-event add-ons (photo album, 10-year archive) sold at the emotional peak.
  Build all three into the model early.

---

## 9.8 Solo-founder load

Two specific failure modes worth naming:

- **Support in N languages.** Every launch language is an inbox in that language,
  in a timezone, during a season when questions are urgent and emotional. This
  breaks solo founders more reliably than technical debt does. Limit launch
  languages to those you (or one cheap contractor) can genuinely cover. Invest
  early in in-product help and canned responses.
- **Wedding-week urgency.** A customer whose wedding is Saturday and whose QR
  code won't scan will call you at 23:00. Set expectations publicly (support
  hours), and build the product so those calls don't happen — which is what §9.4
  is for.

---

## 9.9 Technical risks, ranked

1. **The guest page getting fat.** The most likely technical failure. Every theme
   wants one more font, one more animation library, one more 3MB hero image. Set
   a hard CI budget (JS < 60KB gz, LCP < 2.5s on the `max-content` fixture) and
   fail the build. Without an enforced budget this *will* degrade.
2. **Complex-script rendering regressions.** A font subsetting change drops an
   OpenType feature and Arabic stops joining — and you won't notice, because you
   don't read Arabic. The fixture matrix with pixel diffs is the only defence.
   Have a native reader review each script once before launch.
3. **The OG service as a single point of failure.** Chromium leaks memory and
   dies. Recycle the browser, health-check it, and make the publish flow degrade
   to a theme-generic OG image rather than blocking publication.
4. **Timezone/DST bugs.** An event at 02:30 on a DST transition date, or a
   sub-event in a different zone. Test explicitly; use `timestamptz` everywhere.
5. **A guest-list leak across tenants.** One missing `WHERE invitation_id`.
   Enforce with a Doctrine filter and a test that asserts cross-tenant access
   returns 404.
6. **Import encoding corruption.** Turkish/Albanian CSVs from Excel. Handled in
   [06](06-guests-and-rsvp.md) §6.5, but it'll bite if you skip it.

---

## 9.10 The summary, if you read nothing else

**Technical risk is low. You will build this fine.**

**Commercial risk is high and concentrated in one place:** whether you can reach
the right people in one market cheaply enough to make a €29 one-time purchase
work. Everything in the architecture above is designed so that when you find that
channel, you can serve every other market without a rewrite — and so that until
you find it, you haven't spent a year building for eight markets that haven't
asked for you yet.
