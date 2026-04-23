// ============================================================
// db.js — API Client (replaces localStorage)
// All data is now fetched from / saved to the Express server
// ============================================================

const API = {
  base: '', // same origin — server serves both frontend and API

  async get(path) {
    const res = await fetch(this.base + path);
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(this.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },

  async patch(path) {
    const res = await fetch(this.base + path, { method: 'PATCH' });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },

  async patchBody(path, body) {
    const res = await fetch(this.base + path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },

  async del(path) {
    const res = await fetch(this.base + path, { method: 'DELETE' });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },
};

const DB = {
  // ---- ABOUT ----
  async getAbout()      { return API.get('/api/about'); },
  async saveAbout(data) { return API.post('/api/about', data); },

  // ---- WORKS ----
  async getWorks()         { return API.get('/api/works'); },
  async getFeaturedWorks() { return API.get('/api/works/featured'); },
  async addWork(work)         { return API.post('/api/works', work); },
  async updateWork(id, work)  { return API.patchBody('/api/works/' + id, work); },
  async deleteWork(id)        { return API.del('/api/works/' + id); },
  async getCategories() {
    const works = await this.getWorks();
    return [...new Set(works.map(w => w.cat))];
  },

  // ---- CONTACT SETTINGS ----
  async getSettings()         { return API.get('/api/settings'); },
  async saveSettings(data)    { return API.post('/api/settings', data); },
  async sendContact(data)     { return API.post('/api/contact', data); },

  // ---- REVIEWS ----
  async getReviews()       { return API.get('/api/reviews'); },       // approved only
  async getAllReviews()     { return API.get('/api/reviews/all'); },   // admin: all
  async addReview(review)  { return API.post('/api/reviews', review); },
  async approveReview(id)  { return API.patch('/api/reviews/' + id + '/approve'); },
  async deleteReview(id)   { return API.del('/api/reviews/' + id); },
  async getAvgRating() {
    const reviews = await this.getReviews();
    if (!reviews.length) return '5.0';
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  },
};
