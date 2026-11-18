import { sessionCookie } from './_auth.js';

export async function onRequestPost() {
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('', { maxAgeSec: 0 }) } });
}
