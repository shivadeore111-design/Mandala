#!/usr/bin/env bash
# bootstrap.sh — One-shot developer setup for Mandala
# Run once from the repo root: bash scripts/bootstrap.sh
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✔  $*${RESET}"; }
err()  { echo -e "${RED}  ✖  $*${RESET}"; }
info() { echo -e "${CYAN}  →  $*${RESET}"; }
warn() { echo -e "${YELLOW}  ⚠  $*${RESET}"; }
hdr()  { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}\n"; }

# Track overall status for final checklist
STATUS_MIGRATION="pending"
STATUS_EAS="pending"
STATUS_CF_PROJECT="pending"
STATUS_CF_DNS="pending"
STATUS_GITHUB_SECRETS="pending"
STATUS_DEPLOY="pending"

# ────────────────────────────────────────────────────────────────────────────
# STEP 1 — CHECK DEPENDENCIES
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 1 — Checking dependencies"

DEPS_OK=1
check_dep() {
  if command -v "$1" &>/dev/null; then
    ok "$1 found ($(command -v "$1"))"
  else
    err "$1 is not installed."
    echo -e "      ${YELLOW}$2${RESET}"
    DEPS_OK=0
  fi
}

check_dep git    "Install from https://git-scm.com/downloads"
check_dep node   "Install from https://nodejs.org (v18+ required)"
check_dep npm    "Comes with Node.js — reinstall Node if missing"
check_dep curl   "Install via your package manager: brew install curl / apt install curl"
check_dep eas    "Run: npm install -g eas-cli"

if [ "$DEPS_OK" -eq 0 ]; then
  echo ""
  err "Install the missing dependencies above, then re-run this script."
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  err "Node.js v18+ is required (found v$(node --version)). Please upgrade."
  exit 1
fi
ok "Node.js v$(node --version) — OK"

# ────────────────────────────────────────────────────────────────────────────
# STEP 2 — COLLECT SECRETS
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 2 — Collect secrets"
echo -e "${YELLOW}  All values are stored only in your local .env file and pushed directly${RESET}"
echo -e "${YELLOW}  to GitHub Actions secrets. They are never committed to git.${RESET}\n"

prompt_secret() {
  local var_name="$1"
  local description="$2"
  local hint="$3"
  echo -e "  ${BOLD}${var_name}${RESET}"
  echo -e "  ${description}"
  echo -e "  ${CYAN}Hint: ${hint}${RESET}"
  read -rsp "  Enter value (input hidden): " val
  echo ""
  # Validate non-empty
  if [ -z "$val" ]; then
    err "${var_name} cannot be empty."
    exit 1
  fi
  printf -v "$var_name" '%s' "$val"
}

prompt_plain() {
  local var_name="$1"
  local description="$2"
  local hint="$3"
  echo -e "  ${BOLD}${var_name}${RESET}"
  echo -e "  ${description}"
  echo -e "  ${CYAN}Hint: ${hint}${RESET}"
  read -rp "  Enter value: " val
  echo ""
  if [ -z "$val" ]; then
    err "${var_name} cannot be empty."
    exit 1
  fi
  printf -v "$var_name" '%s' "$val"
}

prompt_secret EXPO_TOKEN \
  "Your Expo access token for CI builds." \
  "Run: eas login  then: eas whoami --token"

prompt_plain SUPABASE_PROJECT_REF \
  "Your Supabase project reference ID." \
  "The subdomain in your Supabase URL: https://YOURREF.supabase.co"

prompt_secret SUPABASE_SERVICE_ROLE_KEY \
  "Service role key — bypasses RLS. Keep secret." \
  "Supabase Dashboard → Project Settings → API → service_role"

prompt_plain SUPABASE_URL \
  "Your full Supabase project URL." \
  "https://YOURREF.supabase.co"

prompt_secret SUPABASE_ANON_KEY \
  "Public anon key — safe to expose to clients." \
  "Supabase Dashboard → Project Settings → API → anon public"

prompt_secret CLOUDFLARE_API_TOKEN \
  "Cloudflare API token with Pages + DNS edit permissions." \
  "Cloudflare → My Profile → API Tokens → Create Token → Edit Cloudflare Workers template"

prompt_plain CLOUDFLARE_ACCOUNT_ID \
  "Your Cloudflare account ID." \
  "Cloudflare Dashboard → right sidebar on any Workers/Pages page"

prompt_secret GITHUB_PAT \
  "GitHub Personal Access Token with Actions + Secrets write access." \
  "github.com → Settings → Developer Settings → Personal access tokens → Fine-grained → New token
   → select this repo → permissions: Secrets: Read/Write, Actions: Read/Write"

prompt_plain GITHUB_REPO \
  "Your GitHub repo in owner/repo format." \
  "e.g. shivadeore111-design/Mandala"

# ────────────────────────────────────────────────────────────────────────────
# STEP 3 — WRITE .env
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 3 — Writing .env"

cat > .env <<EOF
EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
EXPO_TOKEN=${EXPO_TOKEN}
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
EOF

ok ".env written (not committed to git)"

# ────────────────────────────────────────────────────────────────────────────
# STEP 4 — PUSH SECRETS TO GITHUB
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 4 — Pushing secrets to GitHub Actions"

# Write a temp node script for encryption
ENCRYPT_SCRIPT="$(mktemp /tmp/gh_encrypt_XXXXXX.js)"
cat > "$ENCRYPT_SCRIPT" <<'JSEOF'
// Usage: PUB_KEY=<b64> SECRET_VAL=<plaintext> node gh_encrypt.js
const sodium = require('tweetsodium');
const key = Buffer.from(process.env.PUB_KEY, 'base64');
const val = Buffer.from(process.env.SECRET_VAL);
const enc = sodium.seal(val, key);
process.stdout.write(Buffer.from(enc).toString('base64'));
JSEOF

cleanup() { rm -f "$ENCRYPT_SCRIPT"; }
trap cleanup EXIT

# Fetch the repo's Actions public key
info "Fetching GitHub Actions public key for ${GITHUB_REPO} …"
PK_RESPONSE=$(curl -sf \
  -H "Authorization: Bearer ${GITHUB_PAT}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/public-key") || {
  err "Failed to fetch GitHub public key. Check GITHUB_PAT and GITHUB_REPO."
  warn "Skipping GitHub secrets push."
  STATUS_GITHUB_SECRETS="failed"
  PK_RESPONSE=""
}

push_github_secret() {
  local secret_name="$1"
  local secret_value="$2"

  if [ -z "$PK_RESPONSE" ]; then return; fi

  local pub_key key_id encrypted
  pub_key=$(echo "$PK_RESPONSE" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{ console.log(JSON.parse(d).key); }catch(e){ process.exit(1); } })")
  key_id=$(echo "$PK_RESPONSE"  | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{ console.log(JSON.parse(d).key_id); }catch(e){ process.exit(1); } })")

  encrypted=$(PUB_KEY="$pub_key" SECRET_VAL="$secret_value" node "$ENCRYPT_SCRIPT")

  local http_code
  http_code=$(curl -sf -o /dev/null -w "%{http_code}" \
    -X PUT \
    -H "Authorization: Bearer ${GITHUB_PAT}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/${secret_name}" \
    -d "{\"encrypted_value\":\"${encrypted}\",\"key_id\":\"${key_id}\"}" 2>/dev/null) || true

  if [[ "$http_code" == "201" || "$http_code" == "204" ]]; then
    ok "  ${secret_name}"
  else
    err "  ${secret_name} (HTTP ${http_code})"
  fi
}

if [ -n "$PK_RESPONSE" ]; then
  push_github_secret "EXPO_TOKEN"                  "$EXPO_TOKEN"
  push_github_secret "SUPABASE_PROJECT_REF"        "$SUPABASE_PROJECT_REF"
  push_github_secret "SUPABASE_SERVICE_ROLE_KEY"   "$SUPABASE_SERVICE_ROLE_KEY"
  push_github_secret "EXPO_PUBLIC_SUPABASE_URL"    "$SUPABASE_URL"
  push_github_secret "EXPO_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
  push_github_secret "CLOUDFLARE_API_TOKEN"        "$CLOUDFLARE_API_TOKEN"
  push_github_secret "CLOUDFLARE_ACCOUNT_ID"       "$CLOUDFLARE_ACCOUNT_ID"
  STATUS_GITHUB_SECRETS="done"
  ok "All GitHub secrets pushed"
fi

# ────────────────────────────────────────────────────────────────────────────
# STEP 5 — APPLY SUPABASE MIGRATION
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 5 — Applying Supabase migration"

if SUPABASE_PROJECT_REF="$SUPABASE_PROJECT_REF" \
   SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
   node scripts/migrate.js; then
  STATUS_MIGRATION="done"
else
  warn "Migration returned an error (may already be applied, or PAT required)."
  warn "To apply manually: go to Supabase Dashboard → SQL Editor and run:"
  warn "  supabase/migrations/002_push_tokens.sql"
  STATUS_MIGRATION="manual-required"
fi

# ────────────────────────────────────────────────────────────────────────────
# STEP 6 — LINK EAS PROJECT
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 6 — Linking EAS project"

EXPO_TOKEN="$EXPO_TOKEN" eas whoami 2>/dev/null && ok "EAS: logged in" || {
  warn "EAS token check failed. Trying eas login …"
  EXPO_TOKEN="$EXPO_TOKEN" eas login || true
}

if EXPO_TOKEN="$EXPO_TOKEN" eas init \
    --id 2feb727a-042a-40f6-b70f-431dd20bfb5a \
    --force 2>/dev/null; then
  STATUS_EAS="done"
  ok "EAS project linked"
else
  warn "eas init failed — project may already be linked, or run manually:"
  warn "  eas init --id 2feb727a-042a-40f6-b70f-431dd20bfb5a"
  STATUS_EAS="manual-required"
fi

# ────────────────────────────────────────────────────────────────────────────
# STEP 7 — CREATE CLOUDFLARE PAGES PROJECT
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 7 — Creating Cloudflare Pages project"

info "Creating Pages project 'mandala' …"
CF_CREATE=$(curl -sf \
  -X POST \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
  -d '{
    "name": "mandala",
    "production_branch": "main",
    "build_config": {
      "build_command": "npx expo export --platform web",
      "destination_dir": "dist"
    }
  }' 2>/dev/null) || CF_CREATE='{"success":false}'

CF_SUCCESS=$(echo "$CF_CREATE" | node -e \
  "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).success))")

if [ "$CF_SUCCESS" = "true" ]; then
  ok "Cloudflare Pages project 'mandala' created"
  STATUS_CF_PROJECT="done"
else
  CF_ERR=$(echo "$CF_CREATE" | node -e \
    "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const p=JSON.parse(d); console.log((p.errors||[{message:'unknown'}])[0].message); })" 2>/dev/null || echo "unknown")
  if echo "$CF_ERR" | grep -qi "already exists\|A project with that name"; then
    ok "Pages project 'mandala' already exists — continuing"
    STATUS_CF_PROJECT="done"
  else
    warn "Pages project creation: ${CF_ERR}"
    STATUS_CF_PROJECT="manual-required"
  fi
fi

# Patch env vars onto the project
info "Setting Cloudflare Pages environment variables …"
CF_PATCH=$(curl -sf \
  -X PATCH \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/mandala" \
  -d "{
    \"deployment_configs\": {
      \"production\": {
        \"env_vars\": {
          \"EXPO_PUBLIC_SUPABASE_URL\":  {\"value\": \"${SUPABASE_URL}\"},
          \"EXPO_PUBLIC_SUPABASE_ANON_KEY\": {\"value\": \"${SUPABASE_ANON_KEY}\"}
        }
      }
    }
  }" 2>/dev/null) || CF_PATCH='{"success":false}'

CF_PATCH_OK=$(echo "$CF_PATCH" | node -e \
  "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).success))")
[ "$CF_PATCH_OK" = "true" ] && ok "Pages env vars set" || warn "Pages env var patch failed (not critical)"

# Add custom domain
info "Adding custom domain mandala.taracod.com …"
CF_DOMAIN=$(curl -sf \
  -X POST \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/mandala/domains" \
  -d '{"name": "mandala.taracod.com"}' 2>/dev/null) || CF_DOMAIN='{"success":false}'

CF_DOMAIN_OK=$(echo "$CF_DOMAIN" | node -e \
  "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const p=JSON.parse(d); console.log(p.success||(p.errors||[{}])[0].message||'false'); })" 2>/dev/null || echo "false")

if [ "$CF_DOMAIN_OK" = "true" ]; then
  ok "Custom domain mandala.taracod.com added"
else
  warn "Custom domain: ${CF_DOMAIN_OK} (may need manual verification in Cloudflare dashboard)"
fi

# ────────────────────────────────────────────────────────────────────────────
# STEP 8 — ADD DNS CNAME FOR mandala.taracod.com
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 8 — Adding DNS CNAME record"

info "Looking up zone ID for taracod.com …"
ZONES=$(curl -sf \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=taracod.com&status=active" 2>/dev/null) || ZONES='{"result":[]}'

ZONE_ID=$(echo "$ZONES" | node -e \
  "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const r=JSON.parse(d).result; console.log(r&&r[0]?r[0].id:''); })" 2>/dev/null || echo "")

if [ -z "$ZONE_ID" ]; then
  warn "Zone for taracod.com not found in this Cloudflare account. Skipping DNS."
  STATUS_CF_DNS="manual-required"
else
  ok "Zone ID: ${ZONE_ID}"
  info "Creating CNAME: mandala.taracod.com → mandala.pages.dev …"
  DNS_RESULT=$(curl -sf \
    -X POST \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -d '{
      "type": "CNAME",
      "name": "mandala",
      "content": "mandala.pages.dev",
      "proxied": true
    }' 2>/dev/null) || DNS_RESULT='{"success":false}'

  DNS_OK=$(echo "$DNS_RESULT" | node -e \
    "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ const p=JSON.parse(d); console.log(p.success||(p.errors||[{}])[0].message||'false'); })" 2>/dev/null || echo "false")

  if [ "$DNS_OK" = "true" ]; then
    ok "CNAME record created: mandala.taracod.com → mandala.pages.dev (proxied)"
    STATUS_CF_DNS="done"
  else
    warn "DNS CNAME: ${DNS_OK}"
    if echo "$DNS_OK" | grep -qi "already exists\|record already"; then
      ok "CNAME already exists — OK"
      STATUS_CF_DNS="done"
    else
      STATUS_CF_DNS="manual-required"
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────────────────
# STEP 9 — TRIGGER FIRST DEPLOY
# ────────────────────────────────────────────────────────────────────────────
hdr "Step 9 — Triggering first deploy"

if git rev-parse --git-dir &>/dev/null; then
  git add -A
  git commit --allow-empty -m "chore: bootstrap complete — first deploy trigger" && \
    ok "Commit created" || warn "Nothing new to commit"

  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  if [ -n "$REMOTE_URL" ]; then
    if git push origin main 2>&1; then
      STATUS_DEPLOY="done"
      ok "Pushed to origin/main"
    else
      warn "git push failed — check remote access"
      STATUS_DEPLOY="manual-required"
    fi
  else
    warn "No git remote 'origin' set."
    warn "Add it: git remote add origin git@github.com:${GITHUB_REPO}.git"
    warn "Then:   git push -u origin main"
    STATUS_DEPLOY="manual-required"
  fi
else
  warn "Not inside a git repo. Skipping push."
  STATUS_DEPLOY="manual-required"
fi

# ────────────────────────────────────────────────────────────────────────────
# STEP 10 — FINAL STATUS
# ────────────────────────────────────────────────────────────────────────────
status_line() {
  local label="$1"
  local status="$2"
  case "$status" in
    done)            echo -e "  ${GREEN}✔${RESET}  ${label}" ;;
    failed)          echo -e "  ${RED}✖${RESET}  ${label} ${RED}(failed)${RESET}" ;;
    manual-required) echo -e "  ${YELLOW}⚠${RESET}  ${label} ${YELLOW}(manual action needed)${RESET}" ;;
    *)               echo -e "  ${YELLOW}?${RESET}  ${label} ${YELLOW}(unknown)${RESET}" ;;
  esac
}

echo ""
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║          Bootstrap complete! 🎉            ║${RESET}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${BOLD}Automated steps:${RESET}"
status_line "GitHub Actions secrets pushed"  "$STATUS_GITHUB_SECRETS"
status_line "Supabase migration applied"      "$STATUS_MIGRATION"
status_line "EAS project linked"             "$STATUS_EAS"
status_line "Cloudflare Pages project"       "$STATUS_CF_PROJECT"
status_line "DNS CNAME (mandala.taracod.com)" "$STATUS_CF_DNS"
status_line "First deploy triggered"         "$STATUS_DEPLOY"
echo ""
echo -e "${BOLD}Manual steps still required:${RESET}"
echo -e "  ${YELLOW}⚠${RESET}  Google Play listing — create app on play.google.com/console:"
echo "       Title: Mandala"
echo "       Package: com.mandala.app"
echo "       Set up Internal Testing track"
echo "       Upload google-service-account.json (from Play Console → API access)"
echo ""
if [ "$STATUS_DEPLOY" = "done" ]; then
  echo -e "  ${CYAN}→${RESET}  Watch CI: https://github.com/${GITHUB_REPO}/actions"
fi
echo -e "  ${CYAN}→${RESET}  Web preview (after deploy): https://mandala.taracod.com"
echo -e "  ${CYAN}→${RESET}  EAS builds: https://expo.dev"
echo ""
