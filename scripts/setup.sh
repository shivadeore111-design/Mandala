#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        Mandala — First-time setup     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Check required env vars ──────────────────────────────────────────────
MISSING=0

check_env() {
  local var="$1"
  if [ -z "${!var:-}" ]; then
    echo "  ✖  Missing: $var"
    MISSING=1
  else
    echo "  ✔  $var"
  fi
}

echo "Checking .env …"

if [ ! -f ".env" ]; then
  echo "  ✖  .env file not found. Copy .env.example and fill in your values:"
  echo "       cp .env.example .env"
  exit 1
fi

# shellcheck disable=SC2046
export $(grep -v '^#' .env | grep '=' | xargs)

check_env EXPO_PUBLIC_SUPABASE_URL
check_env EXPO_PUBLIC_SUPABASE_ANON_KEY
check_env SUPABASE_PROJECT_REF
check_env SUPABASE_SERVICE_ROLE_KEY

if [ "$MISSING" -ne 0 ]; then
  echo ""
  echo "✖  Fix the missing variables in .env, then re-run this script."
  exit 1
fi

echo ""

# ── 2. npm install ───────────────────────────────────────────────────────────
echo "Installing dependencies …"
npm install
echo ""

# ── 3. Apply Supabase migration ──────────────────────────────────────────────
echo "Applying Supabase migration …"
node scripts/migrate.js
echo ""

# ── 4. EAS login ─────────────────────────────────────────────────────────────
echo "Logging in to EAS (Expo Application Services) …"
echo "If you already have an EXPO_TOKEN set, you can skip the browser login."
echo ""
eas login
echo ""

# ── 5. Link EAS project ──────────────────────────────────────────────────────
echo "Linking to EAS project …"
eas init --id 2feb727a-042a-40f6-b70f-431dd20bfb5a --force
echo ""

# ── Done ─────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════╗"
echo "║           Setup complete! 🎉              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start the dev server:"
echo "       npm start"
echo ""
echo "  2. Run a local dev build on a connected Android device:"
echo "       eas build --platform android --profile development"
echo ""
echo "  3. Trigger a production build:"
echo "       eas build --platform android --profile production"
echo ""
echo "  4. Submit to Google Play Internal Testing:"
echo "       eas submit --platform android --latest"
echo ""
echo "  5. Add these secrets to GitHub → Settings → Secrets → Actions:"
echo "       EXPO_TOKEN"
echo "       SUPABASE_PROJECT_REF"
echo "       SUPABASE_SERVICE_ROLE_KEY"
echo "       CLOUDFLARE_API_TOKEN"
echo "       CLOUDFLARE_ACCOUNT_ID"
echo ""
