export async function onRequestPatch({ params, env }) {
  try {
    const reviews = await env.PORTFOLIO_KV.get('reviews', 'json') || [];
    const updated = reviews.map(r => r._id === params.id ? { ...r, approved: true } : r);
    await env.PORTFOLIO_KV.put('reviews', JSON.stringify(updated));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
