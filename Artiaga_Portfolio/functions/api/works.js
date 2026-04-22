import { DEFAULT_WORKS } from './_seed.js';

async function getWorks(env) {
  const data = await env.PORTFOLIO_KV.get('works', 'json');
  if (!data) {
    await env.PORTFOLIO_KV.put('works', JSON.stringify(DEFAULT_WORKS));
    return DEFAULT_WORKS;
  }
  return data;
}

export async function onRequestGet({ env }) {
  try {
    const works = await getWorks(env);
    return Response.json(works.sort((a, b) => b.createdAt - a.createdAt));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const works = await getWorks(env);
    const body = await request.json();
    const work = {
      ...body,
      _id: crypto.randomUUID(),
      createdAt: Date.now(),
      featured: body.featured === true || body.featured === 'true',
    };
    works.push(work);
    await env.PORTFOLIO_KV.put('works', JSON.stringify(works));
    return Response.json(work);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
