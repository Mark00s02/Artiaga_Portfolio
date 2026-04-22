export async function onRequestDelete({ params, env }) {
  try {
    const works = await env.PORTFOLIO_KV.get('works', 'json') || [];
    await env.PORTFOLIO_KV.put('works', JSON.stringify(works.filter(w => w._id !== params.id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
