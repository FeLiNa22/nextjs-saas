#!/bin/sh
set -e

echo "Running Drizzle migrations..."
if ! npm run db:migrate; then
  echo "ERROR: Drizzle migrations failed. Exiting." >&2
  exit 1
fi

echo "Starting Next.js server..."
exec npm run start
