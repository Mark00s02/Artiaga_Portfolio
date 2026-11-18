import { credentialsMatch, createSession, sessionCookie, sessionSecret } from './_auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD) return Response.json({ error: 'Admin login is not configured on the server.' }, { status: 503 });
  const { username = '', password = '' } = await request.json().catch(() => ({}));
  if (!await credentialsMatch(String(username), String(password), env.ADMIN_USER, env.ADMIN_PASSWORD)) {
    await new Promise(r => setTimeout(r, 800)); // slow down password guessing
    return Response.json({ error: 'Invalid credentials.' }, { status: 401 });
  }
  const token = await createSession(sessionSecret(env));
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(token) } });
}
