#!/usr/bin/env bash
# Vercel build entrypoint.
#
# `prisma migrate deploy` is best-effort: if migrations fail (DB drift, network
# blip, missing DATABASE_URL on Preview, etc.) we still want the deployment to
# go through so the public site stays online. Running migrations inline with
# the build was previously taking the whole site down — and `xthe-x.vercel.app`
# returning nothing on the main page is exactly that failure mode.
set -u

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[vercel-build] Running prisma migrate deploy"
  if ! npx prisma migrate deploy; then
    echo "[vercel-build] WARNING: prisma migrate deploy failed — continuing build."
  fi
else
  echo "[vercel-build] DATABASE_URL not set — skipping prisma migrate deploy"
fi

set -e
npx prisma generate
npx next build
