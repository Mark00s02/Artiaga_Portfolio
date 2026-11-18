import { readCookie, verifySession, sessionSecret, SESSION_COOKIE } from './_auth.js';

// Lets the admin page know whether its cookie is still valid (the cookie itself is unreadable to scripts).
export async function onRequestGet({ request, env }) {
  const admin = !!env.ADMIN_PASSWORD && await verifySession(sessionSecret(env), readCookie(request.headers.get('Cookie'), SESSION_COOKIE));
  return Response.json({ admin });
}
