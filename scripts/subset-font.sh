#!/usr/bin/env bash
# Rebuilds src/fonts/bricolage-grotesque.woff2: the Latin variable font from @fontsource,
# cut to the weights the stylesheet uses (280–700) and the characters the site shows.
# 41 KB → 33 KB. Needs fonttools and brotli: pip install fonttools brotli
set -euo pipefail
cd "$(dirname "$0")/.."
src=node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2
tmp=$(mktemp -d)
fonttools varLib.instancer "$src" wght=280:700 -o "$tmp/instance.ttf" -q
pyftsubset "$tmp/instance.ttf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2039-203A,U+2190-2193,U+2212" \
  --layout-features="kern,liga,tnum,lnum,case" \
  --no-hinting --desubroutinize --flavor=woff2 \
  --output-file=src/fonts/bricolage-grotesque.woff2
rm -r "$tmp"
ls -l src/fonts/bricolage-grotesque.woff2
