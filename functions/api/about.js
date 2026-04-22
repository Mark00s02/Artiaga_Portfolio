import { DEFAULT_ABOUT } from './_seed.js';

async function getAbout(env) {
  const data = await env.PORTFOLIO_KV.get('about', 'json');
  if (!data) {
    await env.PORTFOLIO_KV.put('about', JSON.stringify(DEFAULT_ABOUT));
    return DEFAULT_ABOUT;
  }
  return data;
}

export async function onRequestGet({ env }) {
  try {
    return Response.json(await getAbout(env));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    await env.PORTFOLIO_KV.put('about', JSON.stringify(data));
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
