import type { IRequest } from 'itty-router';
import type { Env, AuthedRequest } from './types.js';
import { jsonError } from './utils.js';

// ── Password hashing (Web Crypto SHA-256 + random salt) ──────────────────────

export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const encoded = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const colonIdx = stored.indexOf(':');
  if (colonIdx === -1) return false;
  const salt = stored.slice(0, colonIdx);
  const expectedHash = stored.slice(colonIdx + 1);
  const encoded = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const actualHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return actualHash === expectedHash;
}

// ── Session management (KV, 30-day TTL) ─────────────────────────────────────

export async function createSession(userId: string, kv: KVNamespace): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const sessionId = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await kv.put(`session:${sessionId}`, userId, { expirationTtl: 30 * 24 * 60 * 60 });
  return sessionId;
}

export async function getSession(sessionId: string, kv: KVNamespace): Promise<string | null> {
  return kv.get(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string, kv: KVNamespace): Promise<void> {
  await kv.delete(`session:${sessionId}`);
}

// ── Auth middleware ───────────────────────────────────────────────────────────

export function withAuth(
  handler: (req: AuthedRequest, env: Env) => Promise<Response>
): (req: IRequest, env: Env) => Promise<Response> {
  return async (req: IRequest, env: Env): Promise<Response> => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401);
    }
    const token = authHeader.slice(7);
    const userId = await getSession(token, env.SESSIONS);
    if (!userId) {
      return jsonError('Unauthorized', 401);
    }
    (req as AuthedRequest).userId = userId;
    return handler(req as AuthedRequest, env);
  };
}
