// Default data seeded on first request when KV is empty
export const DEFAULT_ABOUT = {
  name: "Mark00s",
  role: "Full Stack & Game Developer",
  bio: "<p>I'm Marc — aka Mark00s — a full-stack developer and game dev who lives at the intersection of clean code and creative chaos. I build fast, scalable web apps and immersive game experiences that actually ship.</p><p>Whether it's architecting a backend system, crafting a pixel-perfect frontend, or building a game from scratch — I bring the same obsessive attention to detail to every project.</p>",
  skills: "React,Node.js,Unity,PostgreSQL,Python,C#,Docker,Game Design,TypeScript,AWS",
  photo: "",
  social: "GitHub|https://github.com\nLinkedIn|https://linkedin.com\nitch.io|https://itch.io",
  stack: "React,Node.js,Unity,C#,PostgreSQL,Python,Docker",
  stats: [
    { num: 40, suffix: "+",   label: "Projects Shipped" },
    { num: 98, suffix: "%",   label: "Client Satisfaction" },
    { num: 5,  suffix: "yrs", label: "In The Game" },
    { num: 12, suffix: "k+",  label: "Lines Committed" },
  ],
};

export const DEFAULT_WORKS = [
  { _id: "w1", title: "NexusPlay — Multiplayer Web Game",       cat: "Game Dev", desc: "A real-time browser-based multiplayer action game built with socket.io and WebGL. Supports 50+ concurrent players with server-side physics and matchmaking.", img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80", tags: "JavaScript,Socket.io,WebGL,Node.js,Redis", featured: true,  createdAt: 1700000006000 },
  { _id: "w2", title: "CodeBoard — Dev Collaboration Platform", cat: "Web App",  desc: "A real-time collaborative coding platform with live code execution, pair-programming, and integrated chat. Built for dev teams who need to code together remotely.", img: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&q=80", tags: "React,Node.js,PostgreSQL,Docker,WebSockets", featured: true,  createdAt: 1700000005000 },
  { _id: "w3", title: "EchoRPG — Unity Action RPG",             cat: "Game Dev", desc: "A 2.5D action RPG built in Unity with custom enemy AI, procedural dungeon generation, and a full inventory system. Published on itch.io with 2k+ downloads.", img: "https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=800&q=80", tags: "Unity,C#,Game Design,AI,Procedural Gen",    featured: true,  createdAt: 1700000004000 },
  { _id: "w4", title: "FluxAPI — RESTful Backend Service",      cat: "Backend",  desc: "A high-performance REST API serving 1M+ requests/day. Built with Express, Postgres, and Redis caching. Includes JWT auth, rate limiting, and full test coverage.", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", tags: "Node.js,Express,PostgreSQL,Redis,Docker",   featured: false, createdAt: 1700000003000 },
  { _id: "w5", title: "PixelDash — Mobile Runner Game",         cat: "Game Dev", desc: "An endless runner mobile game built with Unity for iOS & Android. Features pixel art graphics, procedural level generation, and daily leaderboards.", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80", tags: "Unity,C#,Mobile,iOS,Android",              featured: true,  createdAt: 1700000002000 },
  { _id: "w6", title: "TrackIt — SaaS Analytics Dashboard",     cat: "Web App",  desc: "A full-stack analytics SaaS product with real-time event tracking, custom dashboards, and multi-tenant architecture. Scaled to 500+ business users.", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", tags: "React,Python,FastAPI,PostgreSQL,AWS",       featured: false, createdAt: 1700000001000 },
];

export const DEFAULT_REVIEWS = [
  { _id: "r1", name: "Javier Cruz",  role: "CTO, CodeBoard",            rating: 5, text: "Marc's full-stack skills are insane. He built our entire platform from scratch in record time and the code quality is top-tier. One of the best devs we've worked with.", date: "2025-12-01", approved: true, createdAt: 1700000005000 },
  { _id: "r2", name: "Alyssa Tan",   role: "Game Producer, IndieForge", rating: 5, text: "EchoRPG was beyond our expectations. The AI systems and dungeon gen are genuinely impressive. He understood our vision immediately and delivered something special.", date: "2025-10-18", approved: true, createdAt: 1700000004000 },
  { _id: "r3", name: "Ryan Mendoza", role: "Lead Dev, FluxSystems",     rating: 5, text: "The API he built for us handles crazy traffic with zero issues. Clean architecture, great documentation, and he was always available. Will hire again without question.", date: "2025-09-05", approved: true, createdAt: 1700000003000 },
  { _id: "r4", name: "Sarah Kim",    role: "Founder, TrackIt",          rating: 4, text: "Really solid developer. Delivered everything on schedule and the dashboard looks beautiful. Communication was great throughout the whole project.", date: "2025-08-20", approved: true, createdAt: 1700000002000 },
  { _id: "r5", name: "Paulo Reyes",  role: "Indie Dev",                 rating: 5, text: "Collaborated with Marc on a jam game and he carried hard. His Unity skills are no joke — got our prototype running in 48 hours flat.", date: "2025-07-11", approved: true, createdAt: 1700000001000 },
];
