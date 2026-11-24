#!/bin/sh
# tests/verify.sh — this realm's battery against a LIVE appliance, in one command.
#
#   APPLIANCE=http://localhost:11043 AUTH=user:pass sh tests/verify.sh
#
# L1 + L2: tests/views.smoke.mjs runs every view by name on its defaults (a refusal or an empty
# answer fails) and demands exact figures from tests/expected.json, which tests/ground_truth.py
# writes from the published sources read a second way. When the downloaded sources are present
# (data/source, fetched by scripts/fetch_sources.sh) and python has PyYAML and openpyxl, the
# reconciliation of reference/ against them runs first. There are no producers and no keys: every
# record is stored, so there is no source-cost check (L3) to make.
#
# The last line on success is exactly `ALL CHECKS PASS`; any failure exits non-zero.
set -eu
cd "$(dirname "$0")/.."

APPLIANCE=${APPLIANCE:-${APPLIANCE_URL:-http://localhost:11043}}
AUTH=${AUTH:-${EMBABEL_AUTH:-}}
[ -n "$AUTH" ] || { echo "set AUTH=user:pass for the target appliance"; exit 2; }

if [ -d data/source ] && python3 -c 'import yaml, openpyxl' 2>/dev/null; then
  echo "== reference/ against the downloaded sources"
  python3 tests/ground_truth.py
else
  echo "== reference/ against the sources: skipped (no data/source, or no PyYAML/openpyxl)"
fi

APPLIANCE_URL=$APPLIANCE EMBABEL_USER=${AUTH%%:*} EMBABEL_PASSWORD=${AUTH#*:} node tests/views.smoke.mjs
echo "ALL CHECKS PASS"
