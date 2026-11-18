// _auth.js — admin sessions and access rules, shared by the Cloudflare functions and the local server.js.
// Underscore prefix: Cloudflare Pages doesn't turn this file into a route.

export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Signing key for sessions. Tied to the password, so changing the password signs everyone out. */
export const sessionSecret = env => env.ADMIN_SESSION_SECRET || `admin-session:${env.ADMIN_USER}:${env.ADMIN_PASSWORD}`;

const enc = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const hmacKey = secret => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

/** Signed token "<body>.<signature>" whose body holds only its expiry time. */
export async function createSession(secret, now = Date.now(), ttlMs = SESSION_TTL_MS) {
  const body = b64url(enc.encode(JSON.stringify({ exp: now + ttlMs })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(secret, token, now = Date.now()) {
  if (typeof token !== 'string') return false;
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return false;
  try {
    // crypto.subtle.verify compares in constant time
    if (!await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64url(sig), enc.encode(body))) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(unb64url(body)));
    return typeof exp === 'number' && exp > now;
  } catch { return false; }
}

/** Constant-time comparison of submitted vs configured credentials. Unset credentials never match. */
export async function credentialsMatch(user, pass, expectedUser, expectedPass) {
  if (!expectedUser || !expectedPass) return false;
  const digest = s => crypto.subtle.digest('SHA-256', enc.encode(s));
  const [a, b] = await Promise.all([digest(`${user}\n${pass}`), digest(`${expectedUser}\n${expectedPass}`)]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Visitors may write only these; admin-only reads are listed separately.
const PUBLIC_POSTS = new Set(['/api/reviews', '/api/contact', '/api/chat', '/api/login', '/api/logout']);
const ADMIN_READS = new Set(['/api/settings', '/api/reviews/all']);

export function requiresAdmin(method, pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const m = method.toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return ADMIN_READS.has(path);
  return !(m === 'POST' && PUBLIC_POSTS.has(path));
}

export function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

/** HttpOnly so page scripts can't read it; SameSite=Strict so other sites can't send it. */
export function sessionCookie(token, { secure = true, maxAgeSec = SESSION_TTL_MS / 1000 } = {}) {
  return `${SESSION_COOKIE}=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}

/** Visitor-submitted review: trimmed, length-capped, rating clamped to 1–5. Null if name or text is empty. */
export function cleanReview(body = {}) {
  const str = (v, max) => String(v ?? '').trim().slice(0, max);
  const name = str(body.name, 80), role = str(body.role, 80), text = str(body.text, 1500);
  if (!name || !text) return null;
  const n = Math.round(Number(body.rating));
  return { name, role, text, rating: Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 5 };
}

/** Escape text for HTML (used for the contact email). */
export const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
