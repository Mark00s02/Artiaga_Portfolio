# Mark00s Portfolio

A full-stack portfolio website with a real shared database.

## Setup

1. Make sure you have **Node.js** installed (https://nodejs.org)

2. Open a terminal in this folder and install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   node server.js
   ```

4. Open your browser at:
   ```
   http://localhost:3000
   ```

5. Other devices on your network can access it at:
   ```
   http://<your-ip-address>:3000
   ```
   (Find your IP: run `ipconfig` on Windows or `ifconfig` on Mac/Linux)

## Admin Panel
- Visit the site → scroll to footer → click **root@admin**
- Username: `User`
- Password: `Pass123`

## Database
All data is stored in the `/data` folder as `.db` files:
- `data/works.db` — your projects
- `data/reviews.db` — client reviews
- `data/about.db` — your about info

These are real files on your computer — all devices share the same data.

## File Structure
```
mark00s/
├── server.js          ← Express backend (run this)
├── package.json
├── data/              ← Database files (auto-created)
│   ├── works.db
│   ├── reviews.db
│   └── about.db
└── public/            ← Frontend files
    ├── index.html
    ├── style.css
    ├── app.js
    └── db.js
```
