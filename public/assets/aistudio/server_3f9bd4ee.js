import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'posts.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');
const sessions = new Map();
const SESSION_MS = 12 * 60 * 60 * 1000;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(UPLOAD_DIR, { recursive: true });
try { await fs.access(DB_FILE); } catch { await fs.writeFile(DB_FILE, JSON.stringify({ posts: [], logs: [] }, null, 2)); }

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:', 'blob:'], connectSrc: ["'self'"] } } }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1h' }));
app.use(express.static(PUBLIC_DIR));
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 12 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) });

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || '')); const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function cookie(req, name) {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}
function auth(req, res, next) {
  const token = cookie(req, 'tts_session');
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return res.status(401).json({ error: 'Please log in again.' }); }
  session.expires = Date.now() + SESSION_MS;
  next();
}
async function readDb() { return JSON.parse(await fs.readFile(DB_FILE, 'utf8')); }
async function writeDb(db) { const tmp = `${DB_FILE}.tmp`; await fs.writeFile(tmp, JSON.stringify(db, null, 2)); await fs.rename(tmp, DB_FILE); }
function logEntry(db, type, message, postId = null) { db.logs.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), type, message, postId }); db.logs = db.logs.slice(0, 300); }
function settingsStatus() {
  return {
    adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD.includes('change-this')),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
    aiProvider: process.env.GEMINI_API_KEY ? 'Gemini' : (process.env.OPENAI_API_KEY ? 'OpenAI-compatible' : 'Not configured'),
    metaConfigured: Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN),
    publishingEnabled: process.env.ENABLE_FACEBOOK_PUBLISHING === 'true',
    autoPublishEnabled: process.env.ENABLE_AUTO_PUBLISH === 'true',
    graphVersion: GRAPH_VERSION,
    timezone: 'Asia/Karachi'
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'TopTech Social Studio', time: new Date().toISOString() }));
app.post('/api/login', loginLimiter, (req, res) => {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured || configured.includes('change-this')) return res.status(503).json({ error: 'Set ADMIN_PASSWORD in .env before logging in.' });
  if (!safeEqual(req.body.password, configured)) return res.status(401).json({ error: 'Incorrect password.' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expires: Date.now() + SESSION_MS });
  res.setHeader('Set-Cookie', `tts_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { sessions.delete(cookie(req, 'tts_session')); res.setHeader('Set-Cookie', 'tts_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/session', (req, res) => { const s = sessions.get(cookie(req, 'tts_session')); res.json({ authenticated: Boolean(s && s.expires > Date.now()) }); });

app.get('/api/status', auth, (_req, res) => res.json(settingsStatus()));
app.get('/api/posts', auth, async (_req, res) => { const db = await readDb(); res.json({ posts: db.posts.sort((a,b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || '')), logs: db.logs.slice(0, 60) }); });
app.post('/api/posts', auth, async (req, res) => {
  const { title = '', caption = '', topic = 'General', scheduledAt = '', status = 'draft', imageUrl = '' } = req.body || {};
  if (!caption.trim()) return res.status(400).json({ error: 'Caption is required.' });
  if (scheduledAt && Number.isNaN(Date.parse(scheduledAt))) return res.status(400).json({ error: 'Invalid scheduled date/time.' });
  const db = await readDb();
  const post = { id: crypto.randomUUID(), title: String(title).slice(0, 160), caption: String(caption).slice(0, 100000), topic: String(topic).slice(0, 100), scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : '', status: ['draft','approved','scheduled'].includes(status) ? status : 'draft', imageUrl: String(imageUrl).slice(0, 1000), createdAt: new Date().toISOString(), publishedAt: null, facebookPostId: null, lastError: null };
  if (post.status === 'scheduled' && !post.scheduledAt) return res.status(400).json({ error: 'Choose a scheduled date and time.' });
  db.posts.push(post); logEntry(db, 'created', `Created post: ${post.title || post.topic}`, post.id); await writeDb(db); res.status(201).json({ post });
});
app.patch('/api/posts/:id', auth, async (req, res) => {
  const db = await readDb(); const p = db.posts.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Post not found.' });
  if (p.status === 'published') return res.status(409).json({ error: 'Published posts cannot be edited here.' });
  for (const k of ['title','caption','topic','imageUrl']) if (req.body[k] !== undefined) p[k] = String(req.body[k]).slice(0, k === 'caption' ? 100000 : 1000);
  if (req.body.scheduledAt !== undefined) { if (req.body.scheduledAt && Number.isNaN(Date.parse(req.body.scheduledAt))) return res.status(400).json({ error: 'Invalid date/time.' }); p.scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt).toISOString() : ''; }
  if (req.body.status && ['draft','approved','scheduled'].includes(req.body.status)) p.status = req.body.status;
  if (p.status === 'scheduled' && !p.scheduledAt) return res.status(400).json({ error: 'Choose a date/time before scheduling.' });
  p.lastError = null; logEntry(db, 'updated', `Updated post: ${p.title || p.topic}`, p.id); await writeDb(db); res.json({ post: p });
});
app.delete('/api/posts/:id', auth, async (req, res) => { const db = await readDb(); const old = db.posts.find(p => p.id === req.params.id); if (!old) return res.status(404).json({ error: 'Post not found.' }); if (old.status === 'published') return res.status(409).json({ error: 'Published records are retained for audit.' }); db.posts = db.posts.filter(p => p.id !== req.params.id); logEntry(db, 'deleted', `Deleted post: ${old.title || old.topic}`, old.id); await writeDb(db); res.json({ ok: true }); });
app.post('/api/posts/:id/approve', auth, async (req, res) => { const db = await readDb(); const p = db.posts.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Post not found.' }); if (p.status === 'draft') p.status = 'approved'; logEntry(db, 'approved', `Approved post: ${p.title || p.topic}`, p.id); await writeDb(db); res.json({ post: p }); });
app.post('/api/upload', auth, upload.single('image'), async (req, res) => { if (!req.file) return res.status(400).json({ error: 'Upload a PNG, JPG, WEBP or GIF image (max 12 MB).' }); const ext = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' })[req.file.mimetype]; const target = `${req.file.filename}${ext}`; await fs.rename(req.file.path, path.join(UPLOAD_DIR, target)); res.json({ imageUrl: `/uploads/${target}` }); });

app.post('/api/ai/caption', auth, async (req, res) => {
  const { topic = 'AI learning', audience = 'small businesses and learners', tone = 'professional and motivating', goal = 'engagement', includeHashtags = true, language = 'English', contentType = 'Facebook post', length = 'medium', seriesName = '' } = req.body || {};
  const prompt = `Create original ${contentType} for TopTech Solutions. Topic: ${topic}. Series: ${seriesName || 'standalone'}. Audience: ${audience}. Language: ${language}. Tone: ${tone}. Goal: ${goal}. Length: ${length}. It may be a long-form article; do not force it into a short caption. Use headings for long articles. ${includeHashtags ? 'For social posts, add 3-6 relevant hashtags including #TopTechSolutions.' : 'Do not add hashtags.'} Do not invent offers, prices, credentials, results, testimonials, or guarantees. Return only the content.`;
  try {
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.8 } });
      return res.json({ caption: String(result.text || '').trim(), provider: 'Gemini' });
    }
    if (process.env.OPENAI_API_KEY) {
      const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
      const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', messages: [{ role: 'system', content: 'You are a careful social media copywriter and article writer. Be accurate and useful.' }, { role: 'user', content: prompt }], temperature: 0.8 }) });
      const d = await r.json(); if (!r.ok) return res.status(502).json({ error: d?.error?.message || 'AI provider request failed.' });
      return res.json({ caption: d.choices?.[0]?.message?.content?.trim() || '', provider: 'OpenAI-compatible' });
    }
    return res.status(503).json({ error: 'AI is not configured. Add GEMINI_API_KEY (recommended) or OPENAI_API_KEY to server .env.' });
  } catch (e) { res.status(502).json({ error: `AI request failed: ${e.message}` }); }
});

// CSV bulk import. Import creates drafts only; scheduling/publishing always requires review.
app.post('/api/import/csv', auth, async (req, res) => {
  const { rows } = req.body || {};
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'No CSV rows received.' });
  if (rows.length > 500) return res.status(400).json({ error: 'Import is limited to 500 rows per batch.' });
  const db = await readDb(); const created = [];
  for (const row of rows) {
    const title = String(row.title || row.post_title || '').slice(0,160);
    const caption = String(row.article_text || row.caption || row.content || row.text || '').slice(0,100000);
    if (!caption.trim()) continue;
    let scheduledAt = '';
    const rawDate = row.scheduled_at || row.scheduled_date || row.publish_at || '';
    if (rawDate && !Number.isNaN(Date.parse(rawDate))) scheduledAt = new Date(rawDate).toISOString();
    const post = { id: crypto.randomUUID(), title, caption, topic: String(row.topic || row.series_name || 'Bulk import').slice(0,100), seriesName: String(row.series_name || '').slice(0,160), episodeNumber: String(row.episode_number || ''), hashtags: String(row.hashtags || ''), imageUrl: String(row.image_url || row.image_filename || '').slice(0,1000), scheduledAt, status: 'draft', createdAt: new Date().toISOString(), publishedAt: null, facebookPostId: null, lastError: null };
    db.posts.push(post); created.push(post);
  }
  logEntry(db, 'bulk_import', `Imported ${created.length} posts as drafts`, null); await writeDb(db);
  res.json({ imported: created.length, skipped: rows.length-created.length, importedIds: created.map(p => p.id), message: 'Imported as drafts. Review each post and schedule it explicitly.' });
});

// Schedule a selected batch of imported drafts after the user reviews them.
app.post('/api/posts/bulk-schedule', auth, async (req, res) => {
  const { ids, startAt, cadence = 'daily', timeGapHours = 24 } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'Select imported posts to schedule.' });
  if (!startAt || Number.isNaN(Date.parse(startAt))) return res.status(400).json({ error: 'Choose a valid schedule start date and time.' });
  if (ids.length > 500) return res.status(400).json({ error: 'Scheduling is limited to 500 posts per batch.' });
  const allowed = ['daily', 'three-weekly', 'weekly', 'custom-hours'];
  if (!allowed.includes(cadence)) return res.status(400).json({ error: 'Invalid cadence.' });
  const db = await readDb();
  const interval = cadence === 'daily' ? 24 : cadence === 'three-weekly' ? 8 : cadence === 'weekly' ? 168 : Math.max(1, Math.min(720, Number(timeGapHours) || 24));
  let cursor = Date.parse(startAt); let updated = 0; const missing = [];
  for (const id of ids) {
    const post = db.posts.find(p => p.id === id);
    if (!post || post.status === 'published') { missing.push(id); continue; }
    post.scheduledAt = new Date(cursor).toISOString();
    post.status = 'scheduled';
    post.lastError = null;
    cursor += interval * 60 * 60 * 1000;
    updated++;
  }
  logEntry(db, 'bulk_schedule', `Scheduled ${updated} posts using ${cadence} cadence`, null);
  await writeDb(db);
  res.json({ scheduled: updated, skipped: missing.length, message: `${updated} posts scheduled. Confirm publishing settings before automatic publishing.` });
});

app.get('/api/prompts/master', auth, (_req, res) => {
  res.json({ prompt: `TOPTECH SOCIAL STUDIO — BULK CONTENT MASTER PROMPT\n\nAct as a professional content strategist, researcher, and social media planner for [BRAND].\nSeries/topic: [TOPIC]\nAudience: [AUDIENCE]\nLanguage: [LANGUAGE]\nNumber of items: [COUNT]\nContent type: [SHORT POSTS / LONG ARTICLES / EPISODIC SERIES]\nPlatforms: [FACEBOOK / INSTAGRAM / THREADS / TIKTOK / YOUTUBE / BLOG]\nTone: [TONE]\nSchedule start: [DATE] | cadence: [DAILY/WEEKLY/CUSTOM]\n\nFor every item provide: post_id, series_name, episode_number, topic, title, article_text, caption, hashtags, image_filename, image_prompt, scheduled_at. Long-form article_text is allowed and should not be shortened merely to fit a caption. Where platform limits apply, provide a separate platform-appropriate caption and keep the full article_text intact. Use UTF-8 CSV with properly escaped commas, quotes and line breaks. Set all items to DRAFT for human review. Never fabricate facts, statistics, quotes, sources, testimonials or guarantees. Do not claim anything has been published. Output a CSV file/table and a separate image ZIP with filenames matching image_filename.` });
});

app.post('/api/facebook/test', auth, async (_req, res) => {
  if (!process.env.META_PAGE_ID || !process.env.META_PAGE_ACCESS_TOKEN) return res.status(503).json({ error: 'Add META_PAGE_ID and META_PAGE_ACCESS_TOKEN to .env.' });
  try { const u = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${process.env.META_PAGE_ID}`); u.searchParams.set('fields', 'id,name'); u.searchParams.set('access_token', process.env.META_PAGE_ACCESS_TOKEN); const r = await fetch(u); const d = await r.json(); if (!r.ok) return res.status(502).json({ error: d.error?.message || 'Meta API check failed.' }); res.json({ ok: true, page: { id: d.id, name: d.name } }); }
  catch (e) { res.status(502).json({ error: `Meta connection failed: ${e.message}` }); }
});
app.post('/api/posts/:id/publish-now', auth, async (req, res) => {
  if (process.env.ENABLE_FACEBOOK_PUBLISHING !== 'true') return res.status(403).json({ error: 'Publishing is disabled. Set ENABLE_FACEBOOK_PUBLISHING=true after completing Meta setup.' });
  const db = await readDb(); const p = db.posts.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Post not found.' });
  try { const result = await publishPost(p); p.status = 'published'; p.publishedAt = new Date().toISOString(); p.facebookPostId = result.id || result.post_id || null; p.lastError = null; logEntry(db, 'published', `Published to Facebook: ${p.title || p.topic}`, p.id); await writeDb(db); res.json({ ok: true, post: p }); }
  catch (e) { p.lastError = e.message; logEntry(db, 'error', `Facebook publish failed: ${e.message}`, p.id); await writeDb(db); res.status(502).json({ error: e.message }); }
});
app.get('/api/export', auth, async (_req, res) => { const db = await readDb(); res.setHeader('Content-Type', 'application/json'); res.setHeader('Content-Disposition', 'attachment; filename="toptech-social-backup.json"'); res.send(JSON.stringify(db, null, 2)); });

async function publishPost(post) {
  if (!process.env.META_PAGE_ID || !process.env.META_PAGE_ACCESS_TOKEN) throw new Error('Meta Page ID or Page Access Token is missing.');
  const base = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.META_PAGE_ID}`;
  const form = new FormData(); form.set('message', post.caption); form.set('access_token', process.env.META_PAGE_ACCESS_TOKEN);
  let endpoint = `${base}/feed`;
  if (post.imageUrl) {
    const local = post.imageUrl.startsWith('/uploads/') ? path.join(UPLOAD_DIR, path.basename(post.imageUrl)) : null;
    if (local) { const buf = await fs.readFile(local); const ext = path.extname(local).toLowerCase(); const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg'; form.set('source', new Blob([buf], { type: mime }), path.basename(local)); endpoint = `${base}/photos`; }
    else { form.set('url', post.imageUrl); endpoint = `${base}/photos`; }
  }
  const r = await fetch(endpoint, { method: 'POST', body: form }); const data = await r.json(); if (!r.ok) throw new Error(data?.error?.message || 'Facebook publishing request failed.'); return data;
}

let schedulerBusy = false;
async function schedulerTick() {
  if (schedulerBusy || process.env.ENABLE_AUTO_PUBLISH !== 'true' || process.env.ENABLE_FACEBOOK_PUBLISHING !== 'true') return;
  schedulerBusy = true;
  try {
    const db = await readDb(); const now = Date.now();
    const due = db.posts.filter(p => p.status === 'scheduled' && p.scheduledAt && Date.parse(p.scheduledAt) <= now).slice(0, 5);
    for (const p of due) {
      try { const result = await publishPost(p); p.status = 'published'; p.publishedAt = new Date().toISOString(); p.facebookPostId = result.id || result.post_id || null; p.lastError = null; logEntry(db, 'published', `Auto-published to Facebook: ${p.title || p.topic}`, p.id); }
      catch (e) { p.status = 'approved'; p.lastError = e.message; logEntry(db, 'error', `Auto-publish failed: ${e.message}`, p.id); }
    }
    if (due.length) await writeDb(db);
  } catch (e) { console.error('Scheduler error:', e.message); } finally { schedulerBusy = false; }
}
setInterval(schedulerTick, 30_000).unref();

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Unexpected server error.' }); });
app.listen(PORT, () => console.log(`TopTech Social Studio listening on port ${PORT}`));
