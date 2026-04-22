export async function onRequestGet({ params, env }) {
  try {
    const obj = await env.IMAGES.get(params.filename);
    if (!obj) return new Response('Image not found.', { status: 404 });

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(obj.body, { headers });
  } catch (e) {
    return new Response('Error loading image.', { status: 500 });
  }
}
