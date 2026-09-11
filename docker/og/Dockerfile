# Headless Chromium render service: OG images now, print-ready PDFs later.
#
# Chromium rather than a PHP image library or Satori, because Imvite renders
# Arabic, Urdu (Nastaliq), Devanagari, Cyrillic, Greek and Hebrew. Chromium
# brings HarfBuzz shaping and full bidi; GD and Imagick bring neither.
# See docs/architecture/07-link-previews.md §7.1.
#
# The tag MUST stay in lockstep with the playwright version in
# services/og-render/package.json — a mismatch is the usual cause of
# "Executable doesn't exist at /ms-playwright/...".
FROM mcr.microsoft.com/playwright:v1.56.1-noble

# Fonts are baked into the image, not fetched at render time. A missing face
# here produces tofu boxes in the one image every guest sees in WhatsApp.
#
# CJK is deliberately absent: it is ~10MB per weight and is out of scope for
# v1 (docs/architecture/03-i18n-and-typography.md §3.3). Add fonts-noto-cjk
# here when that changes.
RUN apt-get update && apt-get install -y --no-install-recommends \
      fonts-noto-core \
      fonts-noto-extra \
      fonts-noto-ui-core \
      fonts-noto-color-emoji \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

# Fail the BUILD, not a render, when a script has no face. This is the
# deploy-time smoke test doc 07 §7.1 calls for, hoisted as early as possible.
COPY docker/og/verify-fonts.sh /usr/local/bin/verify-fonts
RUN chmod +x /usr/local/bin/verify-fonts && verify-fonts

WORKDIR /srv/app

# Dependencies first so a source edit does not invalidate the npm layer.
COPY services/og-render/package.json services/og-render/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY services/og-render/ ./

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000
CMD ["node", "server.mjs"]
