# Headless Chromium render service: OG images now, print-ready PDFs later.
#
# Chromium rather than a PHP image library, because it renders the theme's own
# CSS — the same engine as the invitation itself, so the card looks like the
# theme instead of approximating it. See docs/architecture/07-link-previews.md.
#
# The tag MUST stay in lockstep with the playwright version in
# services/og-render/package.json — a mismatch is the usual cause of
# "Executable doesn't exist at /ms-playwright/...".
FROM mcr.microsoft.com/playwright:v1.56.1-noble

# The themes' own subsetted woff2 files get copied in alongside the templates
# once themes exist. Until then Chromium's bundled fonts are enough; add an
# explicit COPY here rather than relying on whatever the base image happens to
# ship, so a render never silently falls back.

WORKDIR /srv/app

# Dependencies first so a source edit does not invalidate the npm layer.
COPY services/og-render/package.json services/og-render/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY services/og-render/ ./

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000
CMD ["node", "server.mjs"]
