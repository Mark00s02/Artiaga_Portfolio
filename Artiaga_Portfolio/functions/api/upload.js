const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only JPG, PNG, GIF, and WebP images are allowed.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 });
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const filename = `${crypto.randomUUID()}.${ext}`;

    await env.IMAGES.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    return Response.json({ url: `/api/images/${filename}` });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
