import { DEFAULT_REVIEWS } from './_seed.js';
import { cleanReview } from './_auth.js';

async function getReviews(env) {
  const data = await env.PORTFOLIO_KV.get('reviews', 'json');
  if (!data) {
    await env.PORTFOLIO_KV.put('reviews', JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  }
  return data;
}

export async function onRequestGet({ env }) {
  try {
    const reviews = await getReviews(env);
    return Response.json(
      reviews.filter(r => r.approved).sort((a, b) => b.createdAt - a.createdAt)
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const reviews = await getReviews(env);
    const clean = cleanReview(await request.json().catch(() => ({})));
    if (!clean) return Response.json({ error: 'Name and review text are required.' }, { status: 400 });
    const review = {
      ...clean,
      _id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      approved: false,
      createdAt: Date.now(),
    };
    reviews.push(review);
    await env.PORTFOLIO_KV.put('reviews', JSON.stringify(reviews));
    return Response.json(review);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
