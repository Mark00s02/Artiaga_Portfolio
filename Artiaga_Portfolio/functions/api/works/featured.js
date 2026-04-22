import { DEFAULT_WORKS } from '../_seed.js';

export async function onRequestGet({ env }) {
  try {
    let works = await env.PORTFOLIO_KV.get('works', 'json');
    if (!works) {
      works = DEFAULT_WORKS;
      await env.PORTFOLIO_KV.put('works', JSON.stringify(works));
    }
    return Response.json(
      works.filter(w => w.featured).sort((a, b) => b.createdAt - a.createdAt)
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
