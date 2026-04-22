import { DEFAULT_REVIEWS } from '../_seed.js';

export async function onRequestGet({ env }) {
  try {
    let reviews = await env.PORTFOLIO_KV.get('reviews', 'json');
    if (!reviews) {
      reviews = DEFAULT_REVIEWS;
      await env.PORTFOLIO_KV.put('reviews', JSON.stringify(reviews));
    }
    return Response.json(reviews.sort((a, b) => b.createdAt - a.createdAt));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
