import { Router } from 'itty-router';
import type { IRequest } from 'itty-router';
import type { Env } from './types.js';
import { CORS_HEADERS, jsonError } from './utils.js';
import { withAuth } from './auth.js';
import { signup, login, logout, me, resetPassword, refreshSession } from './handlers/auth.js';
import {
  listMandalas, createMandala, getMandala,
  deleteMandala, checkIn, listCheckins,
} from './handlers/mandalas.js';
import { updateProfile } from './handlers/profile.js';

const router = Router();

// ── CORS preflight ────────────────────────────────────────────────────────────
router.options('*', () => new Response(null, { status: 204, headers: CORS_HEADERS }));

// ── Auth routes ───────────────────────────────────────────────────────────────
router.post('/api/auth/signup',         (r: IRequest, e: Env) => signup(r, e));
router.post('/api/auth/login',          (r: IRequest, e: Env) => login(r, e));
router.post('/api/auth/logout',         (r: IRequest, e: Env) => logout(r, e));
router.get( '/api/auth/me',             withAuth(me));
router.post('/api/auth/reset-password', (r: IRequest, e: Env) => resetPassword(r, e));
router.post('/api/auth/refresh',        (r: IRequest, e: Env) => refreshSession(r, e));

// ── Mandala routes ────────────────────────────────────────────────────────────
router.get(   '/api/mandalas',          withAuth(listMandalas));
router.post(  '/api/mandalas',          withAuth(createMandala));
router.get(   '/api/mandalas/:id',      withAuth(getMandala));
router.delete('/api/mandalas/:id',      withAuth(deleteMandala));

router.post('/api/mandalas/:id/checkin',  withAuth(checkIn));
router.get( '/api/mandalas/:id/checkins', withAuth(listCheckins));

// ── Profile route ─────────────────────────────────────────────────────────────
router.patch('/api/profile', withAuth(updateProfile));

// ── 404 fallback ──────────────────────────────────────────────────────────────
router.all('*', () => jsonError('Not Found', 404));

// ── Worker export ─────────────────────────────────────────────────────────────
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return router.fetch(request, env).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Internal Server Error';
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    });
  },
};
