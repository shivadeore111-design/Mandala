import { getToken } from './storage';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  push_token: string | null;
  created_at: string;
}

export interface Mandala {
  id: string;
  user_id: string;
  practice_name: string;
  practice_type: string;
  practice_description: string;
  target_days: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_at: string | null;
  is_active: number;
  completed_days: number;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  mandala_id: string;
  user_id: string;
  checked_in_at: string;
  created_at: string;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data['error'] as string | undefined) ?? `HTTP ${res.status}`);
  }
  return data as T;
}

// Auto-inject stored token for authenticated calls
async function authRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  return apiRequest<T>(method, path, body, token);
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, display_name: string) {
  return apiRequest<{ user: AppUser; token: string }>('POST', '/api/auth/signup', {
    email, password, display_name,
  });
}

export async function signIn(email: string, password: string) {
  return apiRequest<{ user: AppUser; token: string }>('POST', '/api/auth/login', {
    email, password,
  });
}

export async function signOut() {
  return authRequest<{ message: string }>('POST', '/api/auth/logout');
}

export async function getMe() {
  return authRequest<{ user: AppUser }>('GET', '/api/auth/me');
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>('POST', '/api/auth/reset-password', { email });
}

// ── Mandala API ───────────────────────────────────────────────────────────────

export async function getMandalas() {
  return authRequest<{ mandalas: Mandala[] }>('GET', '/api/mandalas');
}

export async function createMandala(params: {
  practice_name: string;
  practice_type?: string;
  practice_description?: string;
  target_days?: number;
}) {
  return authRequest<{ mandala: Mandala }>('POST', '/api/mandalas', params);
}

export async function deleteMandala(id: string) {
  return authRequest<{ message: string }>('DELETE', `/api/mandalas/${id}`);
}

export async function checkIn(mandalaId: string) {
  return authRequest<{ mandala: Mandala }>('POST', `/api/mandalas/${mandalaId}/checkin`);
}

export async function getCheckins(mandalaId: string) {
  return authRequest<{ checkins: CheckIn[] }>('GET', `/api/mandalas/${mandalaId}/checkins`);
}

// ── Profile API ───────────────────────────────────────────────────────────────

export async function updateProfile(params: { display_name?: string; push_token?: string }) {
  return authRequest<{ user: AppUser }>('PATCH', '/api/profile', params);
}
