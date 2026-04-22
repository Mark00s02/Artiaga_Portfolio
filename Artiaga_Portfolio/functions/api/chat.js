import { DEFAULT_ABOUT, DEFAULT_WORKS, DEFAULT_REVIEWS } from './_seed.js';

export async function onRequestPost({ request, env }) {
  const GROQ_API_KEY = env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return Response.json({ error: 'API key not configured. Add GROQ_API_KEY to Cloudflare environment variables.' }, { status: 500 });
  }
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid messages.' }, { status: 400 });
    }

    const [about, works, reviews] = await Promise.all([
      env.PORTFOLIO_KV.get('about', 'json').then(d => d || DEFAULT_ABOUT),
      env.PORTFOLIO_KV.get('works', 'json').then(d => d || DEFAULT_WORKS),
      env.PORTFOLIO_KV.get('reviews', 'json').then(d => d || DEFAULT_REVIEWS),
    ]);

    const worksList   = works.map(w => `- ${w.title} (${w.cat}): ${w.desc} [Tech: ${w.tags}]`).join('\n');
    const reviewsList = reviews.filter(r => r.approved).map(r => `- ${r.name} (${r.role}) ${r.rating}/5: "${r.text}"`).join('\n');

    const systemPrompt = `You are an elite AI representative on the portfolio of Mark00s — a Full Stack Developer and Game Developer based in the Philippines. You speak on Marc's behalf with intelligence, precision, and a refined professional tone.

== ABOUT MARC ==
Name: ${about.name}
Role: ${about.role}
Bio: ${about.bio?.replace(/<[^>]+>/g, '') || ''}
Skills: ${about.skills}
Stack: ${about.stack}

== PROJECTS ==
${worksList || 'No projects listed yet.'}

== CLIENT REVIEWS ==
${reviewsList || 'No reviews yet.'}

== YOUR PERSONA & BEHAVIOR ==
- Speak with sophistication and confidence — you are a premium AI assistant, not a basic chatbot
- Use precise, articulate language. Avoid filler phrases like "Sure!", "Of course!", or "Great question!"
- When discussing Marc's work, convey genuine depth and expertise — highlight technical complexity and impact
- For general coding or tech questions, answer with authority and clarity
- If asked about unavailable details (exact rates, personal contact), gracefully acknowledge the limitation and direct the visitor to the Reviews or Contact section
- Keep responses concise but substantive — quality over quantity
- Maintain a tone that is sharp, intelligent, and slightly refined — befitting a serious developer's portfolio
- Never fabricate projects, reviews, or credentials — integrity is paramount
- When a visitor expresses interest in hiring Marc, respond with assured enthusiasm and guide them toward making contact`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return Response.json({ error: 'AI service error. Try again shortly.' }, { status: 500 });
    }

    const data  = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Apologies — I encountered an issue. Please try again.';
    return Response.json({ reply });
  } catch (e) {
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
