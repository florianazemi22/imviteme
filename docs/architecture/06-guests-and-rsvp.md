# 6. Guests, RSVP and the share flow

The operational heart of the product. Themes sell it; this is what makes people
tell their friends.

---

## 6.1 The unit is the group, not the person

A wedding invitation is addressed to **"The Hartley family"** or **"Mr & Mrs
Blake and family"**, not to individuals. One link goes to one household via one
message. Modelling guests as individuals first and grouping them second gets
this backwards and makes the host's data entry miserable.

```
guest_groups (1) ──< guests (0..n)
```

- A group always exists. `guests` rows are **optional detail**.
- `seats_allocated` is what the host offers the group ("you and 3 others").
- The host can create a group with only a label and a seat count and never name
  the individuals — which is how most hosts will actually work for a 500-guest
  wedding.
- At RSVP time the *guest* can name the attendees, which fills in `guests` rows
  with `added_by = 'guest'`. **The guest doing your data entry for you is the
  key mechanic.**

### Plus-ones

Two separate concepts; keep them distinct:

- **`seats_allocated`** — "this invitation covers up to 4 people". Host-decided,
  known in advance.
- **`allow_plus_one` / `plus_one_limit`** — "you may bring a guest we haven't
  named". Used for single friends.

The RSVP form enforces `attending_count <= seats_allocated + plus_one_limit`, and
shows a clear message rather than a validation error when exceeded ("Your
invitation covers 4 guests. Need more seats? Message Anna directly." + a `wa.me`
link). Never let a guest silently add 12 people to a seated dinner; never make
them feel policed either.

---

## 6.2 Personalised links, and the fact they get forwarded

### The two link types

| | URL | Who gets it | Behaviour |
|---|---|---|---|
| **Open link** | `imvite.me/i/{slug}` | posted in a family WhatsApp group, printed on a card, QR | No greeting, no prefill. RSVP requires the guest to type their name. |
| **Personal link** | `imvite.me/i/{slug}/g/{token}` | sent 1:1 per household | Greeting, prefilled names, sub-event scoping, one-tap RSVP |

Token: 16 characters, base62, CSPRNG (`random_bytes` → base62). Stored as
`sha256(token)` in `guest_groups.token_hash` with a unique index — look up by
hashing the presented token. A database dump then doesn't hand out working links.
Keep `token_hint` (last 4 chars) in plaintext so the host's dashboard can show
"…x7k2" next to each group and match a link someone pasted into a support message.

### The forwarded-link problem, stated honestly

**Personal links will be forwarded. Plan for it; do not try to prevent it.**

The actual sequence in every real wedding: you send Anna's uncle his personal
link; he forwards it to the family group of 40 because he's proud of it; six
people RSVP through his token; three of them are not in his household.

Wrong responses:
- **Locking the token to the first device.** Guarantees support tickets from
  people who opened it on their phone and wanted to reply on a tablet, and from
  households where one person opens links for everyone. Never do a hard lock.
- **Assuming the invitation content is private.** It isn't. It's going into group
  chats. Anything you put on the page is public.

Right responses, in order:

1. **Make the open link the thing you encourage sharing.** The share sheet's
   primary button copies the *open* link. Personal links are surfaced one-per-row
   in the guest list, with copy/WhatsApp buttons — a deliberate 1:1 action.
2. **"Not you?" affordance.** A personal link shows the greeting with a quiet
   "Not the Hartley family? →" control. Tapping it drops to the open-link RSVP flow,
   creating a new group with `review_status = 'pending_host_review'`. Make it
   visible but not alarming.
3. **Soft device recognition.** First device to submit through a token sets a
   `HttpOnly` cookie. A *different* device submitting a *different* set of names
   through the same token gets the "Not you?" prompt promoted to the top and its
   submission flagged for host review. It never blocks.
4. **Cap by seats.** A token can't confirm more than
   `seats_allocated + plus_one_limit` people without host review.
5. **Rate limit by token and by IP hash.** 10 submissions per token per hour, 30
   per IP per hour. Enough for a big household and a shared café wifi, low enough
   to stop scripted abuse.
6. **A host review queue.** One dashboard tab: "3 responses need your attention"
   — self-registered guests, over-capacity requests, conflicting submissions.
   With one-tap accept/merge/reject. **This turns the forwarding problem from a
   bug into a feature**: the host discovers guests they'd forgotten to invite,
   which is exactly what happens at real weddings.

### The optional passcode

`invitations.passcode_hash` gates the whole invitation behind a 4–6 character
code printed on the physical card. Useful for high-profile or security-conscious
hosts (address reveal). **Default off** — it measurably reduces RSVP rates and
most people don't want it. Offer it; don't push it.

---

## 6.3 Sub-event scoping

Resolution, as established in [01](01-data-model.md) §1.6:

```
invited(group, event) =
    COALESCE(override.invited, event.default_invited)
```

Editor UX that makes this usable for a 600-guest wedding:

- The sub-event editor has a per-event toggle: **"Everyone" / "Only selected
  groups"**. That sets `default_invited`.
- The guest list has a column per sub-event with checkboxes, plus bulk selection
  and **tags** (see §6.5) so the host can do "invite everyone tagged
  `family-groom` to the henna night" in two clicks rather than 60.
- A visible per-event counter ("Rehearsal dinner: 42 groups, 138 seats") so the host can
  sanity-check against the venue's capacity.

Guest-facing: the invitation page shows only the sub-events that group is invited
to. This is the feature that makes multi-day celebrations actually work, and it's
the strongest reason to buy Plus.

**Design detail that matters:** when the henna night is hidden from a guest, do
not render an empty gap or a "you are not invited to 2 events" message. Just
render their schedule. Being told what you weren't invited to is a social injury
that will land in the host's inbox.

---

## 6.4 The RSVP form

Progressive, short, and phone-first. Target: **under 20 seconds for the common
case.**

**Screen 1** — "Anna & Luis would be delighted to see you" + [Yes, I'll be
there] / [Sadly, I can't]. Two enormous buttons. That's it. A "no" ends here with
an optional message box.

**Screen 2 (yes)** — "How many of you?" A stepper defaulting to
`seats_allocated`, with the named guests prefilled as toggleable chips when the
host entered names.

**Screen 3 (yes, if multi-day)** — which sub-events, as checkboxes, pre-checked
per their scoping.

**Screen 4 (yes, if configured)** — meal preference, allergies, custom questions.
**Keep custom questions capped at 5** and warn the host that each one costs
completion rate.

**Screen 5** — confirmation, "add to calendar" (`.ics`), "get directions",
optional "leave a message for the couple".

Implementation notes:

- **No account, no email required to RSVP.** Email is optional and only for a
  confirmation copy. Requiring an email at RSVP costs you 20–30% of responses from
  older guests.
- **Save partial state to `localStorage`** keyed by token, so a dropped
  connection mid-form doesn't lose the answers.
- **The form must work without JS** as a plain POST fallback. Not for a11y
  theatre — for the real case of an old Android on a bad connection where the
  island never hydrates. This is a wedding; the RSVP must never fail.
- **Allow edits.** A guest returning to their link sees their previous answer and
  can change it until `rsvp_deadline`. Each change is a new `rsvp_submissions` row
  with the previous one marked `superseded_by`.
- **Meal preference / allergies:** see the Art. 9 warning in
  [09-risks.md](09-risks.md). Frame as "meal preference" with preset options plus
  free text, collect an explicit consent tick, and set a retention date.

---

## 6.5 Bulk import

The host has their guest list somewhere. Meet it where it is.

| Source | Priority | Notes |
|---|---|---|
| **Paste from anywhere** | **1** | A textarea accepting pasted rows from Excel/Sheets/Notes/WhatsApp. Sniff the delimiter (tab, comma, semicolon, newline). This handles more real cases than a file upload and is far less intimidating. |
| **CSV/XLSX upload** | 2 | With a **column-mapping step** — never assume a header order. Use `box/spout` or `openspout` for XLSX (streaming, low memory). |
| **Phone contacts** | 3 | The Contact Picker API works on Android Chrome; unsupported on iOS Safari. Offer it where available, don't depend on it. |
| **Google Contacts** | 4 | OAuth; meaningful scope-review friction. Phase 3 at best. |

Import mechanics that matter:

- **Encoding.** A CSV exported from Excel is often CP1252 with a BOM rather than
  UTF-8, and accented names arrive mangled. Detect with `mb_detect_encoding` plus
  a BOM check, show a preview of the first five rows, and let the user correct it
  before committing. This one detail will save you a hundred support messages.
- **Preview and dry-run always.** Show exactly what will be created before
  writing anything.
- **Fuzzy duplicate detection** on import using `pg_trgm` similarity on
  normalised names plus exact match on E.164 phone. Present as "3 possible
  duplicates" with merge/keep-both, never auto-merge.
- **`imported_batch_id`** on `guest_groups` so an import can be undone wholesale.
  The host will get it wrong the first time.
- **Tags** (`guest_group_tags`: free-text labels like `family-bride`,
  `colleagues`, `village`) — importable as a column, and the primary bulk-action
  mechanism for sub-event scoping and reminders. Cheap to build, enormous
  leverage for the host.
- Phone normalisation to E.164 with `giggsey/libphonenumber-for-php`, defaulting
  the country from the invitation, with a per-row override.

---

## 6.6 The share flow

This is where the product either spreads or doesn't.

**After publishing**, a dedicated share screen — not a buried "copy link" icon:

1. **A rendered preview of what the WhatsApp message will look like** — the OG
   card with their names and date. Seeing it is the reassurance that makes people
   send it. (See [07](07-link-previews.md).)
2. **An editable pre-written message** in the invitation's language:
   > We would love to have you with us. Everything you need is here, and you
   > can reply in a minute: https://imvite.me/i/anna-luis-x7k2
3. **Channel buttons**, in this order:
   - **WhatsApp** — `https://wa.me/?text=` (plus `https://wa.me/{e164}?text=` for
     per-guest sending)
   - **Copy link** (with a success toast — many people paste manually)
   - **Instagram** — no text-prefill API exists; copy the link and open the app,
     with a line explaining to paste it into a story/DM
   - **Telegram** — `https://t.me/share/url?url=&text=`
   - **Viber** — `viber://forward?text=`
   - **iMessage/SMS** — `sms:&body=` (note: iOS uses `&`, Android historically
     `?`; emit both via UA sniffing or use `sms:?&body=` which works on both)
   - **Email**, **QR download**
4. **Per-guest sending.** In the guest list, each row has a WhatsApp button that
   opens `wa.me/{phone}?text={personalised message with that group's token link}`.
   Marks `sent_at` so the host can track who's been messaged. **For a 200-group
   list this is a lot of tapping — but the alternative (WhatsApp Business API) is
   expensive, requires template pre-approval, and per-message fees.** Manual
   sending is the right MVP answer, and the `sent_at` tracking is what makes it
   bearable.
5. **QR code** — generate with `endroid/qr-code` (PHP). Provide: PNG for screens,
   **SVG and print-ready PDF with quiet zone and ≥25mm size** for physical cards,
   and an optional centre logo at error-correction level H. Hosts *will* put this
   on printed cards, and a QR that fails to scan at the church door is a disaster
   — test the print pack on real paper before selling it.

### Does the share survive forwarding?

Yes, by design, if you follow §6.2: the open link is what gets shared into
groups, and it works perfectly for anyone. Personal links degrade gracefully
via "Not you?" rather than breaking. The thing that actually breaks a forwarded
share is **the link preview not rendering** — which is [07](07-link-previews.md)'s
job, and it's why that document exists separately.

---

## 6.7 The host dashboard

Minimum viable, but genuinely useful:

- **Headline numbers:** invited / confirmed / declined / awaiting, and total
  seats confirmed per sub-event. Seats, not groups — the caterer needs seats.
- **Guest table:** search, filter by status/tag/sub-event, sort, inline edit,
  bulk actions.
- **Review queue** (§6.2).
- **Export:** CSV and XLSX, one row per person, with meal preferences — this is
  what the host hands the caterer and the venue. Get the column set right and it's
  a genuine reason to buy.
- **Activity feed:** "the Hartley family confirmed 4 · 2h ago". Hosts check this
  compulsively; it's the return-visit hook and it costs you one query.
- **Reminders:** a one-click "message everyone who hasn't replied" that generates
  a list of `wa.me` links to work through, not an automated blast. Email reminders
  can be automated where you have addresses.
