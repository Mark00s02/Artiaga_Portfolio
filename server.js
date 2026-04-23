// ============================================================
// server.js — Mark00s Portfolio Backend
// Node.js + Express + NeDB + Claude AI Chatbot
// ============================================================

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const Datastore = require('nedb-promises');

const app  = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = {
  works:   Datastore.create({ filename: path.join(__dirname, 'data/works.db'),   autoload: true }),
  reviews: Datastore.create({ filename: path.join(__dirname, 'data/reviews.db'), autoload: true }),
  about:   Datastore.create({ filename: path.join(__dirname, 'data/about.db'),   autoload: true }),
};

async function seedData() {
  const worksCount = await db.works.count({});
  if (worksCount === 0) {
    await db.works.insert([
      { title: "NexusPlay — Multiplayer Web Game",       cat: "Game Dev", desc: "A real-time browser-based multiplayer action game built with socket.io and WebGL. Supports 50+ concurrent players with server-side physics and matchmaking.", img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80", tags: "JavaScript,Socket.io,WebGL,Node.js,Redis", featured: true,  createdAt: Date.now() },
      { title: "CodeBoard — Dev Collaboration Platform", cat: "Web App",  desc: "A real-time collaborative coding platform with live code execution, pair-programming, and integrated chat. Built for dev teams who need to code together remotely.", img: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&q=80", tags: "React,Node.js,PostgreSQL,Docker,WebSockets", featured: true,  createdAt: Date.now() },
      { title: "EchoRPG — Unity Action RPG",             cat: "Game Dev", desc: "A 2.5D action RPG built in Unity with custom enemy AI, procedural dungeon generation, and a full inventory system. Published on itch.io with 2k+ downloads.", img: "https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=800&q=80", tags: "Unity,C#,Game Design,AI,Procedural Gen",    featured: true,  createdAt: Date.now() },
      { title: "FluxAPI — RESTful Backend Service",      cat: "Backend",  desc: "A high-performance REST API serving 1M+ requests/day. Built with Express, Postgres, and Redis caching. Includes JWT auth, rate limiting, and full test coverage.", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", tags: "Node.js,Express,PostgreSQL,Redis,Docker",   featured: false, createdAt: Date.now() },
      { title: "PixelDash — Mobile Runner Game",         cat: "Game Dev", desc: "An endless runner mobile game built with Unity for iOS & Android. Features pixel art graphics, procedural level generation, and daily leaderboards.", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80", tags: "Unity,C#,Mobile,iOS,Android",              featured: true,  createdAt: Date.now() },
      { title: "TrackIt — SaaS Analytics Dashboard",     cat: "Web App",  desc: "A full-stack analytics SaaS product with real-time event tracking, custom dashboards, and multi-tenant architecture. Scaled to 500+ business users.", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", tags: "React,Python,FastAPI,PostgreSQL,AWS",       featured: false, createdAt: Date.now() },
    ]);
    console.log('[DB] Seeded default works');
  }
  const reviewsCount = await db.reviews.count({});
  if (reviewsCount === 0) {
    await db.reviews.insert([
      { name: "Javier Cruz",  role: "CTO, CodeBoard",            rating: 5, text: "Marc's full-stack skills are insane. He built our entire platform from scratch in record time and the code quality is top-tier. One of the best devs we've worked with.", date: "2025-12-01", approved: true, createdAt: Date.now() },
      { name: "Alyssa Tan",   role: "Game Producer, IndieForge", rating: 5, text: "EchoRPG was beyond our expectations. The AI systems and dungeon gen are genuinely impressive. He understood our vision immediately and delivered something special.", date: "2025-10-18", approved: true, createdAt: Date.now() },
      { name: "Ryan Mendoza", role: "Lead Dev, FluxSystems",     rating: 5, text: "The API he built for us handles crazy traffic with zero issues. Clean architecture, great documentation, and he was always available. Will hire again without question.", date: "2025-09-05", approved: true, createdAt: Date.now() },
      { name: "Sarah Kim",    role: "Founder, TrackIt",          rating: 4, text: "Really solid developer. Delivered everything on schedule and the dashboard looks beautiful. Communication was great throughout the whole project.", date: "2025-08-20", approved: true, createdAt: Date.now() },
      { name: "Paulo Reyes",  role: "Indie Dev",                 rating: 5, text: "Collaborated with Marc on a jam game and he carried hard. His Unity skills are no joke — got our prototype running in 48 hours flat.", date: "2025-07-11", approved: true, createdAt: Date.now() },
    ]);
    console.log('[DB] Seeded default reviews');
  }
  const aboutCount = await db.about.count({});
  if (aboutCount === 0) {
    await db.about.insert({
      name: "Mark00s", role: "Full Stack & Game Developer",
      bio: "<p>I'm Marc — aka Mark00s — a full-stack developer and game dev who lives at the intersection of clean code and creative chaos. I build fast, scalable web apps and immersive game experiences that actually ship.</p><p>Whether it's architecting a backend system, crafting a pixel-perfect frontend, or building a game from scratch — I bring the same obsessive attention to detail to every project.</p>",
      skills: "React,Node.js,Unity,PostgreSQL,Python,C#,Docker,Game Design,TypeScript,AWS",
      photo: "", social: "GitHub|https://github.com\nLinkedIn|https://linkedin.com\nitch.io|https://itch.io",
      stack: "React,Node.js,Unity,C#,PostgreSQL,Python,Docker",
    });
    console.log('[DB] Seeded default about');
  }
}

// ---- ABOUT ----
app.get('/api/about', async (req, res) => {
  try { res.json(await db.about.findOne({}) || {}); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/about', async (req, res) => {
  try {
    const existing = await db.about.findOne({});
    if (existing) await db.about.update({}, { $set: req.body }, {});
    else await db.about.insert(req.body);
    res.json(await db.about.findOne({}));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- WORKS ----
app.get('/api/works', async (req, res) => {
  try { res.json(await db.works.find({}).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/works/featured', async (req, res) => {
  try { res.json(await db.works.find({ featured: true }).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/works', async (req, res) => {
  try {
    const work = { ...req.body, createdAt: Date.now(), featured: req.body.featured === true || req.body.featured === 'true' };
    res.json(await db.works.insert(work));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.patch('/api/works/:id', async (req, res) => {
  try {
    const { _id, createdAt, ...fields } = req.body;
    const update = { ...fields, featured: fields.featured === true || fields.featured === 'true' };
    await db.works.update({ _id: req.params.id }, { $set: update }, {});
    res.json(await db.works.findOne({ _id: req.params.id }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/works/:id', async (req, res) => {
  try { await db.works.remove({ _id: req.params.id }, {}); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- REVIEWS ----
app.get('/api/reviews', async (req, res) => {
  try { res.json(await db.reviews.find({ approved: true }).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/reviews/all', async (req, res) => {
  try { res.json(await db.reviews.find({}).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/reviews', async (req, res) => {
  try {
    const review = { ...req.body, date: new Date().toISOString().split('T')[0], approved: false, createdAt: Date.now() };
    res.json(await db.reviews.insert(review));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.patch('/api/reviews/:id/approve', async (req, res) => {
  try { await db.reviews.update({ _id: req.params.id }, { $set: { approved: true } }, {}); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/reviews/:id', async (req, res) => {
  try { await db.reviews.remove({ _id: req.params.id }, {}); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// AI CHATBOT — powered by Groq (free)
// ============================================================
app.post('/api/chat', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key not configured. Add GROQ_API_KEY to your .env file.' });
  }
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages.' });

    const [about, works, reviews] = await Promise.all([
      db.about.findOne({}),
      db.works.find({}).sort({ createdAt: -1 }),
      db.reviews.find({ approved: true }).sort({ createdAt: -1 }),
    ]);

    const worksList   = works.map(w => `- ${w.title} (${w.cat}): ${w.desc} [Tech: ${w.tags}]`).join('\n');
    const reviewsList = reviews.map(r => `- ${r.name} (${r.role}) ${r.rating}/5: "${r.text}"`).join('\n');

    const systemPrompt = `You are an elite AI representative on the portfolio of Mark00s — a Full Stack Developer and Game Developer based in the Philippines. You speak on Marc's behalf with intelligence, precision, and a refined professional tone.

== ABOUT MARC ==
Name: ${about?.name || 'Mark00s'}
Role: ${about?.role || 'Full Stack & Game Developer'}
Bio: ${about?.bio?.replace(/<[^>]+>/g, '') || 'Full stack developer and game dev.'}
Skills: ${about?.skills || 'React, Node.js, Unity, C#, PostgreSQL, Python, Docker, Game Design'}
Stack: ${about?.stack || 'React, Node.js, Unity, C#, PostgreSQL, Python, Docker'}

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

    // Groq uses OpenAI-compatible format
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
      const err = await response.text();
      console.error('[Chat API Error]', err);
      return res.status(500).json({ error: 'AI service error. Try again shortly.' });
    }

    const data  = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Apologies — I encountered an issue. Please try again.';
    res.json({ reply });

  } catch (e) {
    console.error('[Chat Error]', e.message);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

// ---- CATCH-ALL ----

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---- START ----
seedData().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🟢 Mark00s Portfolio running!`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://<your-ip>:${PORT}`);
    console.log(`   Admin:   http://localhost:${PORT} → footer "root@admin"`);
    console.log(`   Chat:    ${GROQ_API_KEY ? '✓ AI chatbot active (Groq)' : '✗ No API key — add GROQ_API_KEY to .env'}\n`);
  });
});
