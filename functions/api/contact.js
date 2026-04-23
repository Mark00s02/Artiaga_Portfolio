export async function onRequestPost({ request, env }) {
  try {
    const { name, email, subject, message } = await request.json();
    if (!name || !email || !message) {
      return Response.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    const settings = await env.PORTFOLIO_KV.get('contact_settings', 'json');
    if (!settings?.resend_api_key) {
      return Response.json({ error: 'Contact form not configured — add your Resend API key in the admin panel.' }, { status: 500 });
    }
    if (!settings?.to_email) {
      return Response.json({ error: 'Receiving email not configured in admin panel.' }, { status: 500 });
    }

    const fromEmail = 'onboarding@resend.dev';
    const fromName  = 'Portfolio Contact';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.resend_api_key}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [settings.to_email],
        reply_to: email,
        subject: `[Portfolio] ${subject || 'New Inquiry'} — from ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;color:#111">
            <h2 style="color:#3b82f6;margin-bottom:1rem">New Contact via Portfolio</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
              <tr style="border-bottom:1px solid #eee"><td style="padding:10px;font-weight:bold;width:100px">Name</td><td style="padding:10px">${name}</td></tr>
              <tr style="border-bottom:1px solid #eee"><td style="padding:10px;font-weight:bold">Email</td><td style="padding:10px"><a href="mailto:${email}" style="color:#3b82f6">${email}</a></td></tr>
              <tr style="border-bottom:1px solid #eee"><td style="padding:10px;font-weight:bold">Subject</td><td style="padding:10px">${subject || 'Project Inquiry'}</td></tr>
            </table>
            <p style="font-weight:bold;margin-bottom:.5rem">Message:</p>
            <p style="white-space:pre-wrap;background:#f5f5f5;padding:1rem;border-radius:6px;line-height:1.7">${message}</p>
            <hr style="margin:1.5rem 0;border:none;border-top:1px solid #eee">
            <p style="color:#888;font-size:.85rem">Reply directly to this email to respond to ${name}.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      return Response.json({ error: 'Failed to send — check your Resend API key and from email address.' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
