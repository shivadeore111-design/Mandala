import type { Env, AuthedRequest } from '../types.js';
import { jsonOk, jsonError } from '../utils.js';

interface MandalaRow {
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
  created_at: string;
  updated_at: string;
  completed_days?: number;
}

interface CheckInRow {
  id: string;
  mandala_id: string;
  user_id: string;
  checked_in_at: string;
  created_at: string;
}

export async function listMandalas(req: AuthedRequest, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(`
    SELECT m.*, COUNT(c.id) as completed_days
    FROM mandalas m
    LEFT JOIN check_ins c ON c.mandala_id = m.id
    WHERE m.user_id = ? AND m.is_active = 1
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `).bind(req.userId).all<MandalaRow>();
  return jsonOk({ mandalas: results });
}

export async function createMandala(req: AuthedRequest, env: Env): Promise<Response> {
  let body: {
    practice_name?: string;
    practice_type?: string;
    practice_description?: string;
    target_days?: number;
  };
  try {
    body = await req.json() as typeof body;
  } catch {
    return jsonError('Invalid JSON');
  }
  const { practice_name, practice_type, practice_description, target_days } = body;
  if (!practice_name) return jsonError('practice_name is required');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const days = target_days ?? 40;

  await env.DB.prepare(`
    INSERT INTO mandalas
      (id, user_id, practice_name, practice_type, practice_description, target_days,
       current_streak, longest_streak, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)
  `).bind(
    id, req.userId,
    practice_name,
    practice_type ?? 'custom',
    practice_description ?? '',
    days, now, now
  ).run();

  const mandala = await env.DB.prepare('SELECT * FROM mandalas WHERE id = ?').bind(id).first<MandalaRow>();
  return jsonOk({ mandala: { ...mandala, completed_days: 0 } }, 201);
}

export async function getMandala(req: AuthedRequest, env: Env): Promise<Response> {
  const { id } = req.params as { id: string };
  const mandala = await env.DB.prepare(`
    SELECT m.*, COUNT(c.id) as completed_days
    FROM mandalas m
    LEFT JOIN check_ins c ON c.mandala_id = m.id
    WHERE m.id = ? AND m.user_id = ?
    GROUP BY m.id
  `).bind(id, req.userId).first<MandalaRow>();
  if (!mandala) return jsonError('Mandala not found', 404);
  return jsonOk({ mandala });
}

export async function deleteMandala(req: AuthedRequest, env: Env): Promise<Response> {
  const { id } = req.params as { id: string };
  const existing = await env.DB.prepare(
    'SELECT id FROM mandalas WHERE id = ? AND user_id = ?'
  ).bind(id, req.userId).first<{ id: string }>();
  if (!existing) return jsonError('Mandala not found', 404);

  await env.DB.prepare('UPDATE mandalas SET is_active = 0, updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), id).run();
  return jsonOk({ message: 'Deleted' });
}

export async function checkIn(req: AuthedRequest, env: Env): Promise<Response> {
  const { id } = req.params as { id: string };

  const mandala = await env.DB.prepare(
    'SELECT * FROM mandalas WHERE id = ? AND user_id = ? AND is_active = 1'
  ).bind(id, req.userId).first<MandalaRow>();
  if (!mandala) return jsonError('Mandala not found', 404);

  // Already checked in today?
  const alreadyIn = await env.DB.prepare(`
    SELECT id FROM check_ins
    WHERE mandala_id = ? AND user_id = ? AND date(checked_in_at) = date('now')
    LIMIT 1
  `).bind(id, req.userId).first<{ id: string }>();
  if (alreadyIn) return jsonError('Already checked in today', 409);

  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  // Calculate new streak
  let newStreak = 1;
  if (mandala.last_checkin_at) {
    const lastDate = mandala.last_checkin_at.split('T')[0];
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (lastDate === yesterdayStr) {
      newStreak = mandala.current_streak + 1;
    }
  }
  const newLongest = Math.max(mandala.longest_streak, newStreak);

  // Insert check-in and update mandala atomically
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO check_ins (id, mandala_id, user_id, checked_in_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), id, req.userId, now, now),
    env.DB.prepare(`
      UPDATE mandalas SET current_streak = ?, longest_streak = ?, last_checkin_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(newStreak, newLongest, now, now, id),
  ]);

  const updated = await env.DB.prepare(`
    SELECT m.*, COUNT(c.id) as completed_days
    FROM mandalas m LEFT JOIN check_ins c ON c.mandala_id = m.id
    WHERE m.id = ? GROUP BY m.id
  `).bind(id).first<MandalaRow>();

  return jsonOk({ mandala: updated, today: todayStr });
}

export async function listCheckins(req: AuthedRequest, env: Env): Promise<Response> {
  const { id } = req.params as { id: string };

  // Ownership check
  const exists = await env.DB.prepare(
    'SELECT id FROM mandalas WHERE id = ? AND user_id = ?'
  ).bind(id, req.userId).first<{ id: string }>();
  if (!exists) return jsonError('Mandala not found', 404);

  const { results } = await env.DB.prepare(`
    SELECT * FROM check_ins
    WHERE mandala_id = ? AND user_id = ?
    ORDER BY checked_in_at DESC
    LIMIT 40
  `).bind(id, req.userId).all<CheckInRow>();
  return jsonOk({ checkins: results });
}
