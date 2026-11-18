import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, verifySession, credentialsMatch, requiresAdmin, readCookie, cleanReview } from '../functions/api/_auth.js';

const SECRET = 'admin-session:correct horse';

test('a fresh session verifies', async () => {
  const t = await createSession(SECRET, 1_000_000);
  assert.equal(await verifySession(SECRET, t, 1_000_001), true);
});

test('expired, tampered, wrong-secret and junk sessions are rejected', async () => {
  const t = await createSession(SECRET, 1_000_000, 60_000);
  assert.equal(await verifySession(SECRET, t, 1_000_000 + 60_001), false, 'expired');
  const [body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ exp: 9e15 })).toString('base64url');
  assert.equal(await verifySession(SECRET, `${forged}.${sig}`, 1_000_001), false, 'tampered body');
  assert.equal(await verifySession('admin-session:other', t, 1_000_001), false, 'wrong secret');
  for (const junk of ['', 'abc', 'a.b.c', null, undefined, `${body}.`]) assert.equal(await verifySession(SECRET, junk, 1_000_001), false, String(junk));
});

test('credentials must match exactly; an unset password never matches', async () => {
  assert.equal(await credentialsMatch('marc', 'pw1', 'marc', 'pw1'), true);
  assert.equal(await credentialsMatch('marc', 'pw2', 'marc', 'pw1'), false);
  assert.equal(await credentialsMatch('Marc', 'pw1', 'marc', 'pw1'), false);
  assert.equal(await credentialsMatch('', '', '', ''), false);
  assert.equal(await credentialsMatch('marc', '', 'marc', undefined), false);
});

test('visitors can read the site and post reviews, contact and chat; everything else needs admin', () => {
  for (const [m, p] of [['GET', '/api/works'], ['GET', '/api/reviews'], ['GET', '/api/about'], ['GET', '/api/session'],
    ['POST', '/api/reviews'], ['POST', '/api/contact'], ['POST', '/api/chat'], ['POST', '/api/login'], ['POST', '/api/logout'], ['OPTIONS', '/api/works']])
    assert.equal(requiresAdmin(m, p), false, `${m} ${p}`);
  for (const [m, p] of [['POST', '/api/works'], ['PATCH', '/api/works/abc'], ['DELETE', '/api/works/abc'], ['POST', '/api/about'],
    ['POST', '/api/settings'], ['GET', '/api/settings'], ['GET', '/api/reviews/all'], ['GET', '/api/reviews/all/'], ['PATCH', '/api/reviews/abc/approve'],
    ['DELETE', '/api/reviews/abc'], ['POST', '/api/upload'], ['PUT', '/api/reviews'], ['POST', '/api/reviews/abc']])
    assert.equal(requiresAdmin(m, p), true, `${m} ${p}`);
});

test('readCookie finds the named cookie only', () => {
  assert.equal(readCookie('a=1; admin_session=tok.sig; b=2', 'admin_session'), 'tok.sig');
  assert.equal(readCookie('xadmin_session=evil', 'admin_session'), null);
  assert.equal(readCookie(null, 'admin_session'), null);
});

test('cleanReview clamps rating and lengths and rejects empty reviews', () => {
  assert.deepEqual(cleanReview({ name: ' Ann ', role: 'PM', text: 'Great', rating: 99 }), { name: 'Ann', role: 'PM', text: 'Great', rating: 5 });
  assert.equal(cleanReview({ name: 'A', text: 'ok', rating: 'x' }).rating, 5);
  assert.equal(cleanReview({ name: 'A', text: 'ok', rating: -3 }).rating, 1);
  assert.equal(cleanReview({ name: 'A'.repeat(500), text: 'ok' }).name.length, 80);
  assert.equal(cleanReview({ name: 'A', text: 'x'.repeat(5000) }).text.length, 1500);
  assert.equal(cleanReview({ name: '', text: 'ok' }), null);
  assert.equal(cleanReview({ name: 'A', text: '   ' }), null);
});
