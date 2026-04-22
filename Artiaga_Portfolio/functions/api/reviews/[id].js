export async function onRequestDelete({ params, env }) {
  try {
    const reviews = await env.PORTFOLIO_KV.get('reviews', 'json') || [];
    await env.PORTFOLIO_KV.put('reviews', JSON.stringify(reviews.filter(r => r._id !== params.id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
