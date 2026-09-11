#!/usr/bin/env bash
# Assert that every script Imvite claims to support has a real face installed.
#
# This runs at image build time. A missing font must break the build loudly,
# because the failure mode otherwise is silent: Chromium falls back, the OG
# image renders in the wrong face or in tofu boxes, and nobody notices until a
# customer shares their invitation.
set -euo pipefail

fail=0

# A family match, not a :lang match. :lang=ur is satisfied by Naskh faces, but
# setting Urdu in Naskh reads as cheap to native readers
# (docs/architecture/03-i18n-and-typography.md §3.3), so assert the real thing.
require_family() {
  local needle="$1" label="$2"
  if fc-list : family | tr ',' '\n' | grep -qi -- "$needle"; then
    printf '  ok      %-34s (%s)\n' "$label" "$needle"
  else
    printf '  MISSING %-34s (no family matching "%s")\n' "$label" "$needle"
    fail=1
  fi
}

require_lang() {
  local lang="$1" label="$2"
  if [ -n "$(fc-list ":lang=$lang" family)" ]; then
    printf '  ok      %-34s (:lang=%s)\n' "$label" "$lang"
  else
    printf '  MISSING %-34s (:lang=%s)\n' "$label" "$lang"
    fail=1
  fi
}

echo "Verifying font coverage for supported scripts:"
require_lang   sq  "Albanian / Latin"
require_lang   de  "German / Latin"
require_lang   tr  "Turkish / Latin"
require_lang   ru  "Cyrillic"
require_lang   el  "Greek"
require_lang   he  "Hebrew"
require_lang   hi  "Devanagari"
require_lang   ar  "Arabic"
require_family "Naskh"    "Arabic body (Noto Naskh Arabic)"
require_family "Nastaliq" "Urdu (Noto Nastaliq Urdu)"
require_family "Emoji"    "Emoji"

if [ "$fail" -ne 0 ]; then
  echo
  echo "Font verification FAILED. Install the missing package in docker/og/Dockerfile."
  echo "Installed families:"
  fc-list : family | tr ',' '\n' | sort -u | sed 's/^/    /'
  exit 1
fi

echo "All required scripts have a face."
