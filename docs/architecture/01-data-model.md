# 1. Data model

Postgres 16. UUIDv7 primary keys generated app-side with `symfony/uid`
(`Uuid::v7()`) — time-ordered so they index like bigints but don't leak counts.
`citext` for email. `jsonb` for structured content with JSON Schema validation
at the application boundary, never a free-for-all.

Full DDL sketch: [schema.sql](schema.sql).

---

## 1.1 The three axes that must stay decoupled

The whole model exists to keep these three independent:

```
        THEME                 CONTENT                ENTITLEMENTS
   (how it looks)         (what it says)          (what was bought)
   themes                 invitations             orders
   theme_versions         invitation_sections     order_items
   (design-owned,         invitation_events       invitation_entitlements
    versioned,            guests, venues,         (resolved feature state)
    swappable)            media_assets
```

**Rules, enforced by review and by a CI check:**

- A theme template may read `content` and `entitlements`. It may never write,
  and it may never define a content field that doesn't exist in the shared
  section vocabulary.
- Nothing in the render path may query `orders`, `order_items`, `plans` or a
  price table. Only `invitation_entitlements`.
- Changing `invitations.theme_id` is a single `UPDATE` with no content
  migration. If that ever stops being true, the abstraction has leaked and you
  fix it immediately, not later.

The practical test: **a user must be able to switch from a minimalist theme to
an ornate one and back without losing a single character of content, and
without their purchased add-ons changing.**

---

## 1.2 Identity and ownership

```
users
  id uuid pk
  email citext unique
  password_hash text null          -- null = magic-link only account
  display_name text
  country_code char(2) null        -- last known billing country (pricing band)
  created_at, updated_at, deleted_at
```

Auth: **magic link as the primary path**, password optional. Your users are
buying one thing once, often on a phone, often at 11pm. Password reset flows are
pure conversion loss. Use `symfony/security-bundle` with a custom login-link
authenticator (`symfony/security-http` ships `LoginLinkHandler`).

One user owns many invitations. Multi-user collaboration on one invitation is
Phase 2 — model it now as a join table so you don't have to rewrite ownership
checks later:

```
invitation_collaborators
  invitation_id, user_id, role enum(owner, editor, viewer)
  PK(invitation_id, user_id)
```

At MVP, exactly one `owner` row per invitation. Do all authorisation through
this table from day one (Symfony Voter on `Invitation`), never through
`invitation.owner_id`. It costs nothing now and saves a painful refactor.

---

## 1.3 The invitation

```
invitations
  id uuid pk
  slug citext unique                -- imvite.me/i/{slug}
  status enum(draft, published, archived, expired)
  event_kind text fk-> event_kinds.code
  theme_id uuid fk-> themes
  theme_version int                 -- PINNED at publish; see §1.5
  timezone text                     -- IANA, e.g. 'Europe/Belgrade'
  numeral_system enum(latn, arab, deva) default 'latn'
  published_at timestamptz null
  expires_at timestamptz null       -- link lifetime, driven by entitlements
  rsvp_deadline timestamptz null
  rsvp_mode enum(open, invite_only, closed)
  passcode_hash text null           -- optional gate; see §6
  og_image_key text null            -- R2 key, content-hashed; see §7
  og_generated_at timestamptz null
  content_hash text                 -- sha256 of rendered content; drives OG + CDN purge
  created_at, updated_at, deleted_at
```

Notes on specific columns:

- **`slug`** — short, pronounceable, CSPRNG-derived, collision-checked. Never
  sequential (leaks volume and enables enumeration of other people's weddings).
  Something like `anna-luis-x7k2`. Let paid users set a vanity slug; that's an
  add-on SKU.
- **`timezone` on the invitation, and again on each sub-event.** A rehearsal
  dinner and a reception are not always in the same place, and destination
  weddings span zones. Store all instants as `timestamptz` (UTC) and carry the
  IANA zone separately. Never store local wall-clock time in a naive column.
- **`content_hash`** — recomputed on every save of content/sections/events. It is
  the cache key for the OG image and the purge key for the CDN. See [07](07-link-previews.md).
- **`expires_at`** — driven by the `link_lifetime_days` entitlement, not hardcoded.

### Event kinds

```
event_kinds (seeded catalog, not user data)
  code text pk              -- 'wedding','engagement','civil','rehearsal_dinner',
                            -- 'baptism','birthday','anniversary','graduation',
                            -- 'save_the_date','party'
  family text               -- 'wedding','milestone','religious'
  default_sections jsonb    -- ordered section types + starter defaults
  default_sub_events jsonb  -- e.g. wedding -> [ceremony, reception]
  sort_order int
  is_active boolean
```

**Display names are not in this table.** They live in the application's
translation catalog keyed `event_kind.<code>`, so renaming an event kind for
the UI is never a data migration.

This is why supporting a dozen event types is nearly free: an event kind is a
label, a default section set and a default sub-event set. The rendering
machinery is identical. The expensive part is the *copy* and *default imagery*
per kind — design work, not engineering.

---

## 1.4 Content: the section model

Three options were on the table and I'm rejecting two:

- **Normalised columns** (`bride_name`, `groom_name`, `ceremony_venue`…) — breaks
  the moment you add a christening or a single-host birthday. Rejected.
- **One `content jsonb` blob per invitation** — flexible, but you lose ordering,
  per-section visibility, per-section entitlement gating, and partial saves.
  Rejected.
- **Ordered typed sections** — chosen.

```
invitation_sections
  id uuid pk
  invitation_id uuid fk
  type text                 -- from the fixed vocabulary below
  position int
  is_visible boolean
  data jsonb                -- validated against a JSON Schema per type
  created_at, updated_at
  UNIQUE(invitation_id, type, position)   -- most types are singletons; see below
```

### The section vocabulary (v1)

Fixed, versioned, and shared by every theme:

| type | purpose | singleton? |
|---|---|---|
| `hero` | names/title, headline date, primary image | yes |
| `quote` | religious verse, poem, proverb | no |
| `countdown` | to a chosen sub-event | yes |
| `story` | how we met / about the celebrant | yes |
| `schedule` | renders `invitation_events`, does not own them | yes |
| `venue` | renders `venues`, does not own them | yes |
| `travel` | hotels, parking, airport notes | yes |
| `dress_code` | text + optional swatches | yes |
| `gallery` | photo grid / slider | yes |
| `rsvp` | the form; config lives here | yes |
| `gifts` | wording + optional external registry link | yes |
| `faq` | Q/A list | yes |
| `contacts` | who to call, with `tel:`/`wa.me:` links | yes |
| `livestream` | external URL + time | yes |
| `custom_text` | escape hatch, rich text | no |

`schedule` and `venue` are *renderers*, not owners — the actual sub-events and
venues are relational (§1.6) because you need to query and join them for
per-guest scoping. This is the one place I'd resist putting data in jsonb.

### What `data` looks like

```json
{
  "headline": "Anna & Luis",
  "subtitle": "We would love you to join us",
  "image_id": "0192f3a1-...",
  "alignment": "center"
}
```

Every section type has its own JSON Schema, validated at the application
boundary. A section may not carry a field its schema does not declare, and a
theme may not read one.

### Theme labels are not content

Default labels a theme ships — "Ceremony", "Reception", "Will you attend?" —
live in the application's translation catalog keyed `theme.label.*`, not in
`invitation_sections.data`. The host may override any of them per invitation,
which writes the override into the section `data`.

Keep the two separate. Conflating them is how you end up unable to fix a typo
in a default label without republishing 4,000 invitations.

---

## 1.5 Themes

```
themes
  id uuid pk
  code text unique                 -- 'ardhja', 'nur', 'sahara'
  status enum(draft, beta, published, retired)
  current_version int
  tier enum(standard, premium)     -- drives which entitlement unlocks it
  supported_sections text[]
  capabilities jsonb               -- {music:true, parallax:true, photo_slots:6,
                                   --  hero_image_aspect:"3/4", supports_two_column_bilingual:true}
  preview_assets jsonb
  created_at, updated_at

theme_versions
  theme_id uuid fk
  version int
  manifest jsonb                   -- the full validated manifest
  asset_bundle_key text            -- R2 key for CSS/fonts/images, immutable
  released_at timestamptz
  changelog text
  PK(theme_id, version)
```

**`invitations.theme_version` is pinned at publish time and never auto-advanced.**
This is non-negotiable. The failure mode you're avoiding: you refactor a theme's
hero animation on a Friday, and 200 weddings happening that Saturday render
broken. Theme upgrades are opt-in, surfaced in the editor as "a new version of
this theme is available — preview it".

Corollary: `asset_bundle_key` must be immutable per version, served with
`Cache-Control: public, max-age=31536000, immutable`.

---

## 1.6 Sub-events and venues

This is the multi-day celebration model, and it's the part that most competitors
get wrong.

```
invitation_events                  -- the sub-events
  id uuid pk
  invitation_id uuid fk
  code text                        -- 'ceremony','reception','rehearsal_dinner',
                                   -- 'civil','brunch','after_party'
  title text                       -- overrides catalog label
  description text null
  starts_at timestamptz
  ends_at timestamptz null
  timezone text                    -- may differ from the invitation
  is_time_tbc boolean              -- "evening, time TBC" is extremely common
  venue_id uuid fk-> venues null
  dress_code text null
  position int
  default_invited boolean          -- guests are invited unless scoped out
  requires_rsvp boolean            -- a henna night may be informational only
  capacity int null

venues
  id uuid pk
  invitation_id uuid fk
  name text
  address text                     -- free text; do not normalise
  lat numeric(9,6) null
  lng numeric(9,6) null
  map_url text null                -- host-pasted Google/Apple Maps link
  directions_note text null
  position int
```

**Why `default_invited` + per-guest overrides rather than explicit
guest↔event rows for everyone:** a 600-guest Kosovar wedding invites everyone to
the reception and 40 people to the family dinner. Storing 600×5 = 3,000 rows to
express "everyone, except" is wasteful and makes the editor slow. The model is:
each sub-event has a default, and `guest_event_overrides` stores only the
exceptions. Resolution is `default_invited XOR override`. See [06](06-guests-and-rsvp.md).

**Do not normalise addresses.** Kosovo addresses are often "Rr. Nëna Terezë,
te ish-Kinemaja". Gulf addresses are often a Google Maps pin and nothing else.
One localised free-text field plus optional lat/lng plus a host-pasted maps URL
covers 100% of cases; a structured `street/city/postcode/state` model covers
maybe 60% and annoys everyone else.

---

## 1.7 Guests

Detailed in [06](06-guests-and-rsvp.md); the tables in brief:

```
guest_groups                 -- the unit that receives ONE link ("Familja Hoxha")
  id uuid pk
  invitation_id uuid fk
  label text                        -- internal, for the host's list
  greeting text null                -- what the guest sees
  token_hash bytea unique           -- sha256 of the link token; see §6.2
  token_hint char(4)                -- last 4 chars, so the host can match a link to a row
  seats_allocated int               -- total seats the host is offering
  allow_plus_one boolean
  plus_one_limit int default 0
  channel enum(whatsapp, viber, telegram, sms, email, print, unknown)
  phone_e164 text null
  email citext null
  notes text null
  imported_batch_id uuid null
  created_at, updated_at

guests                       -- named individuals, optional
  id uuid pk
  guest_group_id uuid fk
  full_name text
  is_child boolean
  age_band enum(adult, child, infant) null
  attending enum(pending, yes, no, maybe) default 'pending'
  meal_preference text null         -- see the Art. 9 note in 09-risks.md
  allergy_note text null
  added_by enum(host, guest)
  position int

guest_event_overrides        -- exceptions only
  guest_group_id uuid fk
  invitation_event_id uuid fk
  invited boolean
  PK(guest_group_id, invitation_event_id)

rsvp_submissions             -- APPEND-ONLY log
  id uuid pk
  invitation_id uuid fk
  guest_group_id uuid fk null       -- null for open-link RSVPs before matching
  payload jsonb                     -- full submitted form, exactly as received
  answers jsonb                     -- responses to custom questions
  submitted_at timestamptz
  source enum(personal_link, open_link, qr, host_manual, import)
  ip_hash bytea null                -- salted, for rate limiting only
  user_agent_hash bytea null
  superseded_by uuid null           -- when a later submission replaces this one
  review_status enum(accepted, pending_host_review, rejected)
```

**`rsvp_submissions` is append-only and `guests.attending` is a materialised
projection of it.** This matters because forwarded links mean several different
people will submit against the same token, sometimes contradicting each other,
sometimes days apart. You need the history to resolve "but I definitely RSVP'd"
support tickets during wedding week — and you will get those tickets.

---

## 1.8 Media

```
media_assets
  id uuid pk
  invitation_id uuid fk
  kind enum(image, audio, video)
  storage_key text                  -- R2 object key
  mime text, bytes bigint
  width int null, height int null, duration_ms int null
  blurhash text null                -- or a 20-byte LQIP; cheap and looks good
  focal_point jsonb null            -- {x:0.5,y:0.33} for art-directed crops
  checksum bytea
  moderation_status enum(pending, ok, flagged)
  created_at
```

Originals in **Cloudflare R2** (zero egress fees, which matters a lot when one
viral wedding link serves 4,000 guests a 2MB hero image). Derivatives via
**Cloudflare Images** or a self-hosted **imgproxy** — do not resize in PHP on the
request path. Always serve AVIF/WebP with a JPEG fallback via `<picture>`.

Store `focal_point` because every theme crops the hero differently and a
face-centred crop is the difference between a theme looking bespoke and looking
like a template.

---

## 1.9 Purchases and entitlements

The most important separation in the model.

```
features (seeded catalog)
  code text pk                     -- 'personalised_links','remove_branding',
                                   -- 'premium_themes',
                                   -- 'sub_events','custom_questions','gallery',
                                   -- 'music','guest_limit','link_lifetime_days',
                                   -- 'vanity_slug','photo_album','print_pack'
  value_type enum(bool, int)
  default_value jsonb              -- what a draft/free invitation gets

plans (seeded catalog)
  code text pk                     -- 'basic','plus'
  grants jsonb                     -- {feature_code: value}
  is_active boolean

price_points
  id uuid pk
  sku text                         -- 'plan.plus', 'addon.remove_branding'
  band enum(a, b, c)               -- see 04-pricing-and-tiering.md
  currency char(3)
  amount_minor int                 -- tax-inclusive for EU/UK display
  provider_price_id text null      -- Paddle/FastSpring price id
  active_from, active_to

orders
  id uuid pk
  user_id uuid fk
  invitation_id uuid fk null       -- null for planner credit packs
  provider enum(paddle, fastspring, paypal, bank_transfer, manual)
  provider_order_id text
  band enum(a, b, c)
  billing_country char(2)
  currency char(3)
  gross_minor int, tax_minor int, net_minor int
  status enum(pending, paid, refunded, partially_refunded, chargeback, failed)
  purchased_at timestamptz
  raw_payload jsonb                -- the provider webhook, stored verbatim
  UNIQUE(provider, provider_order_id)

order_items
  id uuid pk
  order_id uuid fk
  sku text
  quantity int
  unit_amount_minor int

invitation_entitlements          -- THE ONLY THING THE RENDERER READS
  invitation_id uuid fk
  feature_code text fk
  value jsonb                      -- true / 500 / 365
  source enum(default, plan, addon, promo, planner_credit, manual)
  order_item_id uuid fk null
  granted_at timestamptz
  expires_at timestamptz null
  PK(invitation_id, feature_code)
```

### How it works

1. Webhook arrives → `orders` + `order_items` written, `raw_payload` kept verbatim.
2. An **`EntitlementResolver`** service recomputes the full entitlement set for
   the invitation from (defaults ∪ plan grants ∪ add-ons ∪ promos ∪ manual
   grants), highest-wins per feature, and upserts `invitation_entitlements`.
3. The resolver is **idempotent and replayable**: given the same orders, it
   produces the same entitlements. Refunds re-run it with the item removed.

This buys you, for free:
- Comping a customer = insert a `manual` entitlement row. No fake order.
- Changing what "Plus" includes next month doesn't change what existing
  customers have (their rows are already written) — grandfathering by default.
- A chargeback downgrades an invitation by re-running one service.
- Planner credit packs grant entitlements to invitations created later.
- You can A/B a price or a bundle without touching a single template.

### The one rule

```php
// Anywhere in the render path:
if ($entitlements->bool($invitation, 'remove_branding')) { ... }

// NEVER:
if ($invitation->getOrder()?->getPlan() === 'plus') { ... }  // <-- forbidden
```

Add a PHPStan rule or an ArchUnit-style test (`deptrac`) forbidding the
`Order`/`Plan` entities from being referenced inside the `Rendering` namespace.
It's ten lines of config and it keeps the boundary honest for years.

---

## 1.10 Indexing and operational notes

```sql
CREATE UNIQUE INDEX ON invitations (lower(slug));
CREATE INDEX ON invitations (owner_id, status) WHERE deleted_at IS NULL;
CREATE INDEX ON invitation_sections (invitation_id, position);
CREATE INDEX ON invitation_events (invitation_id, starts_at);
CREATE UNIQUE INDEX ON guest_groups (token_hash);
CREATE INDEX ON guest_groups (invitation_id) INCLUDE (label, seats_allocated);
CREATE INDEX ON rsvp_submissions (invitation_id, submitted_at DESC);
CREATE INDEX ON rsvp_submissions (guest_group_id, submitted_at DESC);
```

- **Soft delete everything guest-facing.** A host who deletes a guest group two
  days before the wedding and then panics is a support ticket you want to solve
  in one `UPDATE`.
- **Retention job**: purge guest PII N days after the last sub-event (default 90,
  configurable, host gets an export first). See [09-risks.md](09-risks.md) §GDPR.
  Ship this in the MVP — it's an afternoon now and a legal problem later.
- **Multi-tenancy**: every guest-scoped query goes through a Doctrine filter on
  `invitation_id`. One missing `WHERE` clause leaking one wedding's guest list
  into another's dashboard is a brand-ending bug in a community that talks.
- **Backups**: Postgres PITR (WAL archiving to R2) with a tested restore, not
  just `pg_dump`. Test the restore before launch, not after your first incident.
