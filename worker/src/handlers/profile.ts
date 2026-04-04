import type { Env, AuthedRequest } from '../types.js';
import { jsonOk, jsonError } from '../utils.js';

export async function updateProfile(req: AuthedRequest, env: Env): Promise<Response> {
  let body: { display_name?: string; push_token?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return jsonError('Invalid JSON');
  }
  const { display_name, push_token } = body;

  if (display_name !== undefined) {
    await env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?')
      .bind(display_name, req.userId).run();
  }
  if (push_token !== undefined) {
    await env.DB.prepare('UPDATE users SET push_token = ? WHERE id = ?')
      .bind(push_token, req.userId).run();
  }

  const user = await env.DB.prepare(
    'SELECT id, email, display_name, push_token, created_at FROM users WHERE id = ?'
  ).bind(req.userId).first<{
    id: string; email: string; display_name: string; push_token: string | null; created_at: string;
  }>();
  if (!user) return jsonError('User not found', 404);
  return jsonOk({ user });
}
