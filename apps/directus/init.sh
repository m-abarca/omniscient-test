#!/bin/sh
# Bootstrap idempotente de Directus:
#  1. Espera a que Directus esté healthy.
#  2. Hace login con el admin configurado por env.
#  3. Si no existe la colección `production_orders`, la crea con todos sus campos.
# Re-ejecutar este script con la colección ya creada es no-op.
set -eu

: "${DIRECTUS_URL:?DIRECTUS_URL is required}"
: "${DIRECTUS_ADMIN_EMAIL:?DIRECTUS_ADMIN_EMAIL is required}"
: "${DIRECTUS_ADMIN_PASSWORD:?DIRECTUS_ADMIN_PASSWORD is required}"

COLLECTION="production_orders"
log() { echo "[directus-init] $*"; }

log "Waiting for Directus at $DIRECTUS_URL..."
i=0
until curl -sf "$DIRECTUS_URL/server/health" -o /dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 90 ]; then
    log "ERROR: Directus did not become healthy in time" >&2
    exit 1
  fi
  sleep 2
done
log "Directus is up."

log "Logging in as $DIRECTUS_ADMIN_EMAIL..."
LOGIN_BODY=$(
  printf '{"email":%s,"password":%s}' \
    "$(printf '%s' "$DIRECTUS_ADMIN_EMAIL" | jq -Rs .)" \
    "$(printf '%s' "$DIRECTUS_ADMIN_PASSWORD" | jq -Rs .)"
)
LOGIN_RESPONSE=$(
  curl -sf -X POST "$DIRECTUS_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_BODY"
) || {
  log "ERROR: Login failed (check DIRECTUS_ADMIN_EMAIL/PASSWORD match what Directus was bootstrapped with)" >&2
  exit 1
}
TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | jq -r '.data.access_token // empty')
if [ -z "$TOKEN" ]; then
  log "ERROR: Login response missing access_token" >&2
  exit 1
fi

STATUS=$(
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$DIRECTUS_URL/collections/$COLLECTION"
)
if [ "$STATUS" = "200" ]; then
  log "Collection '$COLLECTION' already exists. Nothing to do."
  exit 0
fi

log "Creating collection '$COLLECTION' with fields..."
curl -fS -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/init/collection.json \
  -o /tmp/create.out 2>/tmp/create.err || {
  log "ERROR: Collection creation failed:" >&2
  cat /tmp/create.err >&2 || true
  cat /tmp/create.out >&2 || true
  exit 1
}

log "Done. Collection '$COLLECTION' is ready."
