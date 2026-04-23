export async function onRequestPatch({ params, request, env }) {
  try {
    const works = await env.PORTFOLIO_KV.get('works', 'json') || [];
    const body  = await request.json();
    const idx   = works.findIndex(w => w._id === params.id);
    if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 });
    works[idx] = {
      ...works[idx],
      ...body,
      _id:       works[idx]._id,
      createdAt: works[idx].createdAt,
      featured:  body.featured === true || body.featured === 'true',
    };
    await env.PORTFOLIO_KV.put('works', JSON.stringify(works));
    return Response.json(works[idx]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete({ params, env }) {
  try {
    const works = await env.PORTFOLIO_KV.get('works', 'json') || [];
    await env.PORTFOLIO_KV.put('works', JSON.stringify(works.filter(w => w._id !== params.id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
