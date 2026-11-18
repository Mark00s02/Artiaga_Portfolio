// Gatekeeper for every /api/* request: admin-only actions need a valid session cookie.
import { requiresAdmin, readCookie, verifySession, sessionSecret, SESSION_COOKIE } from './_auth.js';

export async function onRequest({ request, env, next }) {
  if (!requiresAdmin(request.method, new URL(request.url).pathname)) return next();
  // fail closed: with no password configured, nobody gets admin access
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD) return Response.json({ error: 'Admin login is not configured on the server.' }, { status: 503 });
  const ok = await verifySession(sessionSecret(env), readCookie(request.headers.get('Cookie'), SESSION_COOKIE));
  return ok ? next() : Response.json({ error: 'Not signed in.' }, { status: 401 });
}
