# Local development

Everything runs in Docker. You need Docker Desktop (or Colima / Docker Engine)
and nothing else — no local PHP, Node, or Postgres.

```bash
cp .env.example .env
make up
make smoke
```

| Service | URL | What it is |
|---|---|---|
| landing | http://localhost:8080 | the static marketing page (`landing/`) |
| app | http://localhost:8000 | Symfony, via nginx → php-fpm |
| og | http://localhost:3000/healthz | Chromium render service (OG images, print PDFs) |
| mailpit | http://localhost:8025 | catches every outbound mail |
| db | localhost:5432 | Postgres 16 (`imvite`, `imvite_test`) |
| redis | localhost:6379 | cache + Messenger transport |

`make help` lists the rest.

---

## The Symfony application does not exist yet

`app/public/index.php` is a placeholder that reports whether each backing
service is reachable from the PHP container. Open http://localhost:8000 after
`make up` and you get a table: PHP version, ICU version with a real Albanian
and Hijri date formatted through it, Postgres version with its extensions and
ICU collations, Redis, the render service, and SMTP. It returns HTTP 503 if
anything is down, so it works as a CI check too.

### Scaffolding Symfony over it

`composer create-project` refuses a non-empty directory, so build beside it and
move in:

```bash
make sh                                    # inside the php container
composer create-project symfony/skeleton /tmp/skel
rm -rf /app/public/index.php
cp -rT /tmp/skel /app
composer require symfony/runtime symfony/framework-bundle
```

`DATABASE_URL`, `REDIS_URL`, `MESSENGER_TRANSPORT_DSN`, `MAILER_DSN` and
`OG_SERVICE_URL` are already exported into the container by `compose.yaml`, so
Symfony picks them up without a `.env.local`.

The database schema comes from Doctrine migrations.
`docs/architecture/schema.sql` is a design sketch and is deliberately **not**
loaded by the container — it would drift from the migrations within a week.

---

## Why these choices

**PHP on Debian, not Alpine.** Imvite depends on ICU for locale-aware date
formatting, ICU collation of guest names and grapheme segmentation
(`docs/architecture/03-i18n-and-typography.md`). Debian ships a full ICU; musl
images have a history of locale edge cases that would surface as subtly wrong
Albanian or Turkish sorting rather than as a crash. A quietly mis-sorted guest
list is a much worse bug than a build failure.

**Postgres gets extensions and ICU collations in both databases.**
`docker/postgres/initdb/01-databases.sh` creates `citext`, `pg_trgm` and six
ICU collations in the app *and* test databases. Doing this as plain `.sql`
would only reach the default database, and the test suite would then fail on a
missing `citext` in a way that looks like a code bug.

**The render service bakes fonts into the image and asserts them at build
time.** `docker/og/verify-fonts.sh` runs during `docker build` and fails the
build if any supported script has no face. It checks Nastaliq by *family*, not
by `fc-list :lang=ur`, because `:lang=ur` is satisfied by Naskh faces — and
setting Urdu in Naskh reads as cheap to native readers. The failure this
prevents is silent: Chromium falls back, the OG image renders in the wrong
face, and nobody notices until a customer shares their invitation.

**`shm_size: 1gb` on the og service.** Chromium crashes on larger pages with
Docker's default 64MB `/dev/shm`. The alternative is
`--disable-dev-shm-usage`, which trades the crash for slower rendering.

**The landing container sends the production security headers.** So a header
mistake shows up on localhost rather than after launch. The CSP matches
`landing/README.md`; the page has no inline script or style, so it needs no
`'unsafe-inline'`.

---

## Common problems

**`Executable doesn't exist at /ms-playwright/...`** — the Playwright base
image tag in `docker/og/Dockerfile` and the `playwright` version in
`services/og-render/package.json` have drifted apart. They must match exactly.

**Permission errors on `app/var/` (Linux hosts).** php-fpm runs as `www-data`
(uid 33) and your host user probably is not. Either `sudo chown -R 33:33
app/var`, or add a `user:` mapping to the `php` service in a
`compose.override.yaml` that you do not commit.

**Port already in use.** Every port is overridable in `.env` —
`WEB_PORT`, `LANDING_PORT`, `OG_PORT`, `POSTGRES_PORT`, `REDIS_PORT`,
`MAILPIT_UI_PORT`, `MAILPIT_SMTP_PORT`.

**`make nuke` deletes the database volume.** `make down` does not. Reach for
`down` unless you actually want to re-run the init scripts — they only run
against an empty data directory.

---

## Running the render service without Docker

Useful when iterating on the OG template. It needs Playwright's Chromium:

```bash
cd services/og-render
npm install
npx playwright install chromium
PORT=3000 npm start
```

Fonts then come from your machine rather than the image, so what you see is
not what production renders. Check anything script-related in the container.
