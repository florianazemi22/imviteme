# 3. Internationalisation, RTL and typography

The part that's cheap now and a rewrite later. Do all of it before theme #2.

---

## 3.1 Three separate translation systems

Keep these visibly separate. Conflating them is the classic mistake.

| System | Content | Storage | Who edits |
|---|---|---|---|
| **App UI** | Dashboard, editor, emails, errors | `translations/messages+intl-icu.<locale>.yaml`, `vue-i18n` | you / translators |
| **Theme defaults** | "Ceremony", "Reception", "Will you attend?" | `translations/theme+intl-icu.<locale>.yaml` | you / translators |
| **User content** | Names, story, custom FAQ | `invitation_sections.data` locale maps | the customer |

Use **ICU MessageFormat** throughout (`symfony/translation` supports it via the
`+intl-icu` suffix). You need it for plurals in Slavic and Arabic languages —
Arabic has six plural categories (`zero`, `one`, `two`, `few`, `many`, `other`)
and "3 guests confirmed" is wrong in five of them if you use naive `count == 1`.

```yaml
# translations/theme+intl-icu.ar.yaml
rsvp.confirmed: >-
  {count, plural,
    zero {لم يؤكد أحد}
    one {أكد ضيف واحد}
    two {أكد ضيفان}
    few {أكد # ضيوف}
    many {أكد # ضيفًا}
    other {أكد # ضيف}}
```

**Launch locale set (MVP):** `sq` (Albanian), `de`, `en`, `tr`, `ar`. That covers
the DACH-Albanian wedge plus one RTL script to prove the pipeline. Add `it`, `fr`,
`es`, `hi`/`ur`, `sr`/`bs`/`hr`, `mk`, `el`, `nl` as markets open.

**`sq` note:** Kosovo and Albania share standard Albanian; you do not need
`sq-XK` vs `sq-AL`. Do not over-split locales — each one is a translation
maintenance burden forever.

---

## 3.2 RTL: make it a property of data, not a second stylesheet

**Never ship `theme.css` and `theme.rtl.css`.** That's two codebases and the RTL
one always rots.

### The rules

1. **CSS logical properties only.** `margin-inline-start`, `padding-block`,
   `inset-inline-end`, `border-start-start-radius`, `text-align: start`.
   Ban `left`, `right`, `margin-left`, `padding-right`, `text-align: left|right`,
   `float: left|right` in theme CSS via a **stylelint rule**
   (`csstools/stylelint-use-logical`) that fails CI. This one lint rule
   eliminates ~90% of all RTL bugs.

2. **`dir` is set once, on `<html>`,** from the invitation's resolved direction.
   The script attribute rides alongside it:
   ```html
   <html lang="ar" dir="rtl" data-script="arab">
   ```

3. **Wrap every piece of user content in `<bdi>` or set `dir="auto"`.**
   This is the single highest-value line in the whole document. Without it, an
   Arabic invitation containing the venue "Hotel Emerald" renders the Latin name
   in the wrong position relative to surrounding punctuation, and phone numbers
   and dates reorder in ways that look like corruption:
   ```twig
   <bdi>{{ section.data.headline[locale] }}</bdi>
   ```
   Make it a Twig macro (`{{ ugc(section.data.headline, locale) }}`) so it can't
   be forgotten, and grep-test that no template interpolates content data outside
   that macro.

4. **Mirror only what should mirror.** Directional arrows, back chevrons,
   progress bars: yes. Logos, clock faces, photographs, the Kaaba, a checkmark:
   no. Convention: icons flip by default via `[dir="rtl"] .icon { transform: scaleX(-1) }`,
   and anything that must not flip carries `.no-flip`.

5. **Numerals.** `Intl.NumberFormat` / ICU with a numbering-system extension:
   `ar-EG-u-nu-arab` renders ٣٠, `ar-SA-u-nu-latn` renders 30. Preference splits
   by country (Egypt/Iran lean Arabic-Indic; the Gulf and most of the Maghreb lean
   Latin), so it's a per-invitation setting (`invitations.numeral_system`), not a
   locale-derived assumption. **Always keep phone numbers in Latin digits** — a
   `tel:` link with Arabic-Indic digits may not dial.

6. **Bilingual layouts.** `invitations.locale_display` picks:
   - `toggle` — a language switch pill; one language visible at a time. Safest,
     works in every theme. **Default.**
   - `stacked` — primary above secondary, with the secondary at ~85% size and
     muted. Good for a mixed-family wedding where both sides read the whole thing.
   - `split` — two columns. **Only for themes declaring
     `capabilities.supports_bilingual_split`,** and only above a container width
     threshold; it collapses to `stacked` on phones. Mixing an LTR and an RTL
     column is genuinely hard to do well — the natural reading order conflicts —
     so treat `split` as a premium, per-theme opt-in, not a global feature.

---

## 3.3 Fonts: roles, per-script mapping, subsetting

### The role system

Themes reference `--font-display`, `--font-body`, `--font-accent`. The
**manifest's `scripts` map** binds those roles to real families per script
(see [02](02-theme-architecture.md) §2.3). CI fails a theme whose
`supported_scripts` contains a script with no `scripts` entry.

### The fallback floor

Every theme's font stack ends in the relevant Noto face, self-hosted:

| script | body floor | notes |
|---|---|---|
| Latin | Inter / system-ui | |
| Cyrillic | Noto Sans / Inter | Inter covers Cyrillic; most *display* serifs don't |
| Greek | Noto Sans / Inter | check tonos rendering specifically |
| Arabic | Noto Naskh Arabic | Naskh for body; Kufi/Ruqaa only for display |
| Urdu | **Noto Nastaliq Urdu** | Nastaliq, not Naskh — using Naskh for Urdu reads as wrong/cheap to native readers |
| Hebrew | Noto Sans Hebrew / Frank Ruhl Libre | |
| Devanagari | Noto Sans Devanagari / Tiro Devanagari Hindi | |
| Bengali/Gurmukhi/Tamil | Noto Sans \<script\> | Phase 2 |
| CJK | Noto Sans SC/TC/JP/KR | **huge** — see below |

**Nastaliq is the one that will surprise you.** It's a cascading, steeply sloped
script: line-height needs ~2.0–2.2, descenders from one line collide with
ascenders of the next, and it needs far more vertical space per line than Latin.
A theme that looks airy in Latin looks cramped and overlapping in Urdu. Test it
explicitly (the `urdu-nastaliq` fixture) or don't claim Urdu support.

**CJK is a separate decision.** A full Noto Sans SC is ~10MB across weights.
Don't ship it with every theme. Either (a) declare CJK unsupported in v1, or (b)
serve it only for CJK invitations, dynamically subset. Given your stated markets,
I'd **cut CJK from v1 entirely** and list it in the roadmap. It is not in the
Balkans/Turkey/MENA/South Asia/LatAm/DACH wedge.

### Self-host, subset, and preload

- **Self-host all fonts** on your own domain / R2 + CDN. Google Fonts' CDN adds a
  third-party connection (latency + a GDPR argument that has already produced
  fines in Germany for embedding Google Fonts). Use `google-webfonts-helper` or
  `fontsource` packages to pull the files.
- **Subset per script with `pyftsubset` (fonttools)** at build time, `--flavor=woff2`,
  `--layout-features='*'` (do NOT drop OpenType layout features — that's what
  breaks Arabic joining and Devanagari conjuncts; the default `--layout-features`
  set is not enough for complex scripts).
- Emit `unicode-range` per `@font-face` so browsers fetch only what they render.
- **Preload only the display face for the resolved script** —
  `<link rel="preload" as="font" crossorigin>` — and nothing else. Preloading
  five faces is worse than preloading none.
- `font-display: swap` for body, `optional` for decorative accents.

---

## 3.4 Dates, times and calendars

- Store **`timestamptz` (UTC) + an IANA timezone string** per invitation and per
  sub-event. Never a naive local timestamp.
- Format server-side with `IntlDateFormatter` (PHP) and client-side with
  `Intl.DateTimeFormat`. Never hand-roll a format string per locale.
- **Show the timezone when it's ambiguous.** For a guest opening a Prishtina
  wedding link from Melbourne, render "18:00 (CET, Prishtina time)" — not the
  guest's local time. An invitation states the event's local time; converting it
  to the reader's zone is actively confusing. Offer "add to calendar" (`.ics`)
  which handles conversion correctly and is what the guest actually wants.
- **`.ics` generation** — one per sub-event and one combined. Use
  `eluceo/ical` (PHP). Get `VTIMEZONE` right or Outlook will shift the time.
- **Hijri display** — `Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura')` /
  PHP's `IntlDateFormatter` with `@calendar=islamic-umalqura`. Cheap to ship, so
  ship it in MVP as a display option.

  **The gotcha:** algorithmic Hijri calendars (Umm al-Qura, civil, tabular) can
  differ from the locally observed date by ±1 day, and which one is "correct"
  varies by country and by the family's own practice. Do **not** present a
  computed Hijri date as authoritative. Compute it as a suggestion, show it in the
  editor, and let the host overwrite it with free text
  (`invitations.hijri_override`). Same pattern applies for Hebrew calendar dates
  on bar/bat mitzvah invitations (`ca-hebrew`).

- **Date-only fields** (a save-the-date with no time) need an `is_time_tbc` flag
  rather than a fake 00:00, or you will render "Ceremony at 12:00 AM".

---

## 3.5 The traps, collected

Things that will bite, in rough order of likelihood:

1. **Turkish dotted/dotless i.** `strtoupper('i')` → `I` not `İ`. Avoid case
   transforms on user content entirely; if you must, use `mb_convert_case` with
   the right locale, and never in CSS.
2. **Greek uppercase drops the tonos.** `ΆΝΝΑ` should be `ΑΝΝΑ`. Browsers get
   this right *only* with `lang="el"` set. Another reason to avoid
   `text-transform`.
3. **`.length` is not character count.** Use `Intl.Segmenter` (JS) /
   `grapheme_str_split` from `symfony/string` (PHP). An emoji family is 1
   grapheme, 7 code points, 25 UTF-8 bytes.
4. **Sorting names.** `ORDER BY name` in Postgres uses the DB collation, which
   will mis-sort Albanian (Ç, Ë), Turkish (İ, Ş, Ğ), Czech (Ch). Use ICU
   collations: `CREATE COLLATION sq_icu (provider = icu, locale = 'sq')` and sort
   the guest list with it, or sort in PHP with `Collator`.
5. **Email subject lines** with non-Latin scripts need RFC 2047 encoding —
   Symfony Mailer handles it, but test with an Arabic subject before launch.
6. **Slug generation from non-Latin names.** Transliterate with
   `symfony/string`'s `AsciiSlugger` (backed by `intl` transliteration), and fall
   back to a random slug when the result is empty. `AsciiSlugger` on Arabic input
   often returns "" — handle it, don't let it produce `imvite.me/i/-`.
7. **PDF/print generation** (QR pack, printed invitation) with non-Latin scripts:
   most PHP PDF libraries (TCPDF, FPDF, Dompdf) have poor or no complex-script
   shaping. If you need Arabic or Devanagari in a PDF, render it through **headless
   Chromium** (the same service that makes OG images) rather than a PHP PDF
   library. See [07](07-link-previews.md).
8. **Input method quirks.** Arabic keyboards produce Arabic-Indic digits by
   default; normalise digits on input for anything you parse (phone numbers,
   guest counts).
9. **Name order.** "First name / Last name" is a Western assumption. Use a single
   **"Full name as you'd like it to appear"** field for guests. It's simpler,
   more respectful, and avoids a whole class of bugs.
10. **Phone numbers.** Store E.164, validate with `giggsey/libphonenumber-for-php`,
    and always show the country selector defaulted from the invitation's country,
    not the browser's.
