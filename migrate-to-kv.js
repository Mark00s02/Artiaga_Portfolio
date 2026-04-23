// migrate-to-kv.js
// Run this on the computer that has wrangler set up and authenticated.
// Usage: node migrate-to-kv.js
//
// Requires: wrangler CLI installed + logged in (wrangler login)
// What it does: writes works, reviews, and about directly into Cloudflare KV,
// preserving original IDs, dates, and approved status.

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const NAMESPACE_ID = 'fcaf0bfb2e5949fd867a29ced2c2c3b8';

// ── Data from old NeDB database ──────────────────────────────────────────────

const works = [
  {
    _id: "666VdFRN9z8EqtTl",
    title: "Untangle",
    cat: "System Application",
    desc: "An appointment system used for individuals to have easy access to therapy appointments.",
    img: "https://github.com/Mark00s02/Untangle-System/blob/main/Images/UserSide.png?raw=true",
    tags: "Java",
    featured: true,
    createdAt: 1773924960245,
  },
  {
    _id: "BACQ3pHmixO7hQ9g",
    title: "Zuitt 2048",
    cat: "Game",
    desc: "A 2048 game via Zuitt Bootcamp. Access the game here:\n\nhttps://mark00s28.github.io/js-game-dev/?fbclid=IwY2xjawQqZPdleHRuA2FlbQIxMQBzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEepIHSZuqPWnL7MTSxA6F_VAaVJLBfFVjOhNctQQQfPHM5yokzO6A7inhGOtQ_aem_BZyWm4Eeo8cVu3LQk5os_Q",
    img: "",
    tags: "HTML, CSS, JavaScript",
    featured: true,
    createdAt: 1774028294843,
  },
  {
    _id: "FfzQIN301X8rNfs5",
    title: "HRMS",
    cat: "Web System",
    desc: "A system used for the employee management in the company. It is used for easy access to personal information of the person.",
    img: "https://github.com/Mark00s02/HRMS_Showcase/blob/main/Screenshots/Login%20Page.png?raw=true",
    tags: "Laravel, Vue.JS",
    featured: true,
    createdAt: 1773924874709,
  },
  {
    _id: "TpuF9TpmblnFEuXb",
    title: "ULtrasonic Radar",
    cat: "System and Hardware",
    desc: "Detects object within a specific distance. It will show in the radar the distance and location of the object.",
    img: "https://github.com/Mark00s02/Ultrasonic-Radar/blob/main/Ultrasonic_radar-main/radar_ultrasonic/demo.png?raw=true",
    tags: "Python, Arduino",
    featured: true,
    createdAt: 1773924801706,
  },
  {
    _id: "oVEa8rRKniI1hpiG",
    title: "Excel Data Transfer",
    cat: "System Application",
    desc: "A Python Tkinter-based that transfers filtered data from one Excel file to another based on keyword detection with user-configurable column mapping.",
    img: "https://github.com/Mark00s02/Excel-Data-Transfer/blob/main/Screenshot%202026-03-19%20055752.png?raw=true",
    tags: "Python",
    featured: true,
    createdAt: 1773925142949,
  },
  {
    _id: "rBBk4DpUpZJDpBzE",
    title: "ArtGuardia",
    cat: "System Application",
    desc: "A system used to add protection to images so that Generative AI cannot replicate your images/art.",
    img: "https://github.com/Mark00s02/ArtGuardia/blob/main/images/ArtGuardiaImage.png?raw=true",
    tags: "Python",
    featured: true,
    createdAt: 1773924914996,
  },
];

const reviews = [
  {
    _id: "8pTwq7RTi0zpUDo5",
    name: "Crystelle Day Dignadice",
    role: "Team Leader",
    rating: 5,
    text: "The Auto System was that was created is very useful when it comes to my daily Work, it makes my job much easier especially when entering the data it became more efficient and accurate. he also has the ability to think outside the box, when it comes in fixing the problem. Thumbs up on this man!",
    date: "2026-03-19",
    approved: true,
    createdAt: 1773940056540,
  },
  {
    _id: "Bf5ixQ33IXmZJVjj",
    name: "Beverly",
    role: "IT Support",
    rating: 5,
    text: "yoyoyooyoyoyoyoyo what what oh heck yeah",
    date: "2026-03-19",
    approved: false,
    createdAt: 1773926098759,
  },
  {
    _id: "Uhce0fDr0EdCNYVC",
    name: "Renaa Desolar",
    role: "Manager",
    rating: 5,
    text: "Marc is a very helpful developer who managed to fix the persistent problem we encountered in our system",
    date: "2026-03-19",
    approved: true,
    createdAt: 1773925194596,
  },
];

const about = {
  _id: "lLkfBrEtRcV7zSW8",
  name: "Mark00s",
  role: "Full Stack Developer",
  bio: "<p>I'm a passionate full stack dev with a deep love for storytelling through programming. My work blends aesthetics with strategy, resulting in projects that don't just look beautiful — they perform.</p><p>With over 3 years of experience, I've had the privilege of working with brands across diverse industries, helping them articulate their vision and connect with their audiences in meaningful ways.</p>",
  skills: "React,Node.js,Unity,MySQL,Python,C#,Game Design,Unity",
  photo: "",
  social: "GitHub|https://github.com\nLinkedIn|https://linkedin.com\nitch.io|https://itch.io",
  stack: "React,Node.js,C#,PostgreSQL,Python,Unity",
};

// ── Upload to KV ─────────────────────────────────────────────────────────────

const tmpDir = path.join(__dirname, '.migrate-tmp');
fs.mkdirSync(tmpDir, { recursive: true });

function putKV(key, data) {
  const file = path.join(tmpDir, `${key}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Uploading "${key}"...`);
  try {
    execSync(
      `wrangler kv key put "${key}" --namespace-id=${NAMESPACE_ID} --path="${file}"`,
      { stdio: 'inherit' }
    );
    console.log(`✓ "${key}" done\n`);
  } catch (err) {
    console.error(`✗ Failed to upload "${key}". Make sure wrangler is installed and you are logged in (wrangler login).`);
    process.exit(1);
  } finally {
    fs.unlinkSync(file);
  }
}

putKV('works',   works);
putKV('reviews', reviews);
putKV('about',   about);

fs.rmdirSync(tmpDir);
console.log('Migration complete! All data is now in Cloudflare KV.');
