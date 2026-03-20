# Mandala — Sadhana Streak & Seeker Community App

This repository now contains the Sprint 1 foundation scaffold for an Expo Router + Supabase mobile app.

## Included in this commit

- Expo Router app shell with `(auth)` and `(tabs)` route groups
- Initial screens for auth and tabs
- Root React Query provider setup
- Supabase client bootstrap with AsyncStorage session persistence
- Zustand auth store starter
- Shared design palette constants
- Initial Mandala TypeScript domain type
- Full Supabase SQL migration with schema, indexes, RLS, policies, and functions

## Next high-priority steps

1. Replace auth placeholders with real Supabase Auth flows.
2. Add profile setup onboarding after signup.
3. Implement create/check-in Mandala hooks with offline queue.
4. Wire live home dashboard cards with React Query.
5. Add tests and lint/typecheck CI pipeline.
