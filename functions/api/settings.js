export async function onRequestGet({ env }) {
  try {
    const settings = await env.PORTFOLIO_KV.get('contact_settings', 'json') || {};
    return Response.json(settings);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    await env.PORTFOLIO_KV.put('contact_settings', JSON.stringify(data));
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
