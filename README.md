# Mandala

Sadhana streak tracker and seeker community app.
Built with **Expo Router** · **Supabase** · **NativeWind** · **React Query** · **Zustand**

---

## Quick start

Run this once from the repo root — it handles everything automatically:

```bash
bash scripts/bootstrap.sh
```

The script will:

1. Verify all required tools are installed (`git`, `node`, `npm`, `curl`, `eas-cli`)
2. Prompt you for all credentials (Expo, Supabase, Cloudflare, GitHub)
3. Write your local `.env` file
4. Push all secrets to GitHub Actions
5. Apply the Supabase database migration
6. Link the EAS project
7. Create the Cloudflare Pages project and DNS record (`mandala.taracod.com`)
8. Trigger the first CI build via `git push`

---

## Manual commands

```bash
# Start local dev server
npm start

# Apply Supabase migration manually
npm run migrate

# Type-check
npm run typecheck

# Lint
npm run lint

# EAS build (production AAB)
eas build --platform android --profile production

# EAS submit to Google Play Internal Testing
eas submit --platform android --latest
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_PROJECT_REF` | Supabase project reference ID |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (or PAT for Management API) |

---

## GitHub Actions secrets

| Secret | Used by |
|---|---|
| `EXPO_TOKEN` | EAS build + submit |
| `SUPABASE_PROJECT_REF` | Migration |
| `SUPABASE_SERVICE_ROLE_KEY` | Migration |
| `EXPO_PUBLIC_SUPABASE_URL` | Cloudflare web build |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Cloudflare web build |
| `CLOUDFLARE_API_TOKEN` | Pages deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Pages deploy |

`bootstrap.sh` pushes all of these automatically.

---

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | push + PR to `main` | tsc + expo lint |
| `eas-build.yml` | push to `main` | lint → EAS build → Google Play submit |
| `cloudflare-deploy.yml` | push to `main` | `expo export --platform web` → Cloudflare Pages |

---

## Database

Migrations live in `supabase/migrations/`.

| File | Description |
|---|---|
| `202603200001_initial_schema.sql` | Full schema: profiles, mandalas, checkins, circles, posts, events |
| `002_push_tokens.sql` | Adds `push_token` to profiles, `last_checkin_at` to mandalas, `increment_streak` RPC |

---

## Stack

- **Expo 51** + **Expo Router** (file-based routing)
- **Supabase** (Postgres, Auth, RLS, Edge Functions)
- **NativeWind v4** (Tailwind for React Native)
- **TanStack React Query v5** (data fetching, offline queue)
- **Zustand** (auth state)
- **EAS Build + Submit** (Android AAB → Google Play)
- **Cloudflare Pages** (web build at `mandala.taracod.com`)
