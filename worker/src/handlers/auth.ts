import type { IRequest } from 'itty-router';
import type { Env, AuthedRequest } from '../types.js';
import { hashPassword, verifyPassword, createSession, deleteSession, getSession } from '../auth.js';
import { jsonOk, jsonError } from '../utils.js';

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  push_token: string | null;
  created_at: string;
}

function publicUser(u: UserRow) {
  return { id: u.id, email: u.email, display_name: u.display_name, push_token: u.push_token, created_at: u.created_at };
}

export async function signup(req: IRequest, env: Env): Promise<Response> {
  let body: { email?: string; password?: string; display_name?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return jsonError('Invalid JSON');
  }
  const { email, password, display_name } = body;
  if (!email || !password || !display_name) {
    return jsonError('email, password and display_name are required');
  }
  if (password.length < 8) {
    return jsonError('Password must be at least 8 characters');
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
  if (existing) return jsonError('Email already in use', 409);

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);
  const now = new Date().toISOString();

  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, email, password_hash, display_name, now).run();

  const token = await createSession(id, env.SESSIONS);
  return jsonOk({ user: { id, email, display_name, push_token: null, created_at: now }, token }, 201);
}

export async function login(req: IRequest, env: Env): Promise<Response> {
  let body: { email?: string; password?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return jsonError('Invalid JSON');
  }
  const { email, password } = body;
  if (!email || !password) return jsonError('email and password are required');

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  if (!user) return jsonError('Invalid credentials', 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return jsonError('Invalid credentials', 401);

  const token = await createSession(user.id, env.SESSIONS);
  return jsonOk({ user: publicUser(user), token });
}

export async function logout(req: IRequest, env: Env): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    await deleteSession(authHeader.slice(7), env.SESSIONS);
  }
  return jsonOk({ message: 'Logged out' });
}

export async function me(req: AuthedRequest, env: Env): Promise<Response> {
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(req.userId).first<UserRow>();
  if (!user) return jsonError('User not found', 404);
  return jsonOk({ user: publicUser(user) });
}

export async function resetPassword(req: IRequest, _env: Env): Promise<Response> {
  let body: { email?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return jsonError('Invalid JSON');
  }
  if (!body.email) return jsonError('email is required');
  // Full email implementation deferred
  return jsonOk({ message: 'If that email exists, a reset link has been sent.' });
}

export async function refreshSession(req: IRequest, env: Env): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);
  const oldToken = authHeader.slice(7);
  const userId = await getSession(oldToken, env.SESSIONS);
  if (!userId) return jsonError('Unauthorized', 401);
  await deleteSession(oldToken, env.SESSIONS);
  const newToken = await createSession(userId, env.SESSIONS);
  return jsonOk({ token: newToken });
}
