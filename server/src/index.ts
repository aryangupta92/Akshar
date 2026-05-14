// @ts-nocheck
/* eslint-disable */
/**
 * Demo In-Memory Server
 * Works WITHOUT MongoDB or Redis.
 * All data is stored in-memory and resets on server restart.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ── In-Memory Store ───────────────────────────────────────────
interface User { id: string; name: string; email: string; password: string; preferredLanguage: string; bio?: string; }
interface Content {
  _id: string; title: string; genre: string; language: string; tags: string[];
  authorId: string; currentDelta: object; versions: object[];
  bookmarkCount: number; ratings: {userId:string;value:number}[];
  isPublished: boolean; createdAt: string; updatedAt: string;
}

const users = new Map<string, User>();
const contents = new Map<string, Content>();
const sessions = new Map<string, string>(); // token -> userId
const bookmarks = new Map<string, Set<string>>(); // userId -> Set<contentId>

// Seed demo user
const DEMO_ID = 'demo-user-001';
users.set(DEMO_ID, { id: DEMO_ID, name: 'Aryan Gupta', email: 'demo@akshar.com', password: 'demo1234', preferredLanguage: 'hi', bio: 'Poet & Lyricist' });

// Seed sample content
const sampleContent = [
  { title: 'मेरे दिल की बात', genre: 'lyrics', language: 'hi', tags: ['प्रेम', 'दिल'], text: 'दिल के रास्ते में कहीं\nखो गया मैं तेरे साथ...' },
  { title: 'The Silent River', genre: 'poem', language: 'en', tags: ['nature', 'peace'], text: 'The river runs silently\nthrough the heart of stone...' },
  { title: 'காதல் மழை', genre: 'lyrics', language: 'ta', tags: ['காதல்'], text: 'மழை வரும் நேரம்\nநினைவுகள் வருகின்றன...' },
  { title: 'जिंदगी एक सफर', genre: 'story', language: 'hi', tags: ['जिंदगी', 'सफर'], text: 'एक छोटे से गाँव में एक लड़का था...' },
  { title: 'Monsoon Memories', genre: 'poem', language: 'en', tags: ['monsoon', 'memory'], text: 'When the first drop falls\non the parched earth...' },
  { title: 'ਮਾਂ ਦੀ ਯਾਦ', genre: 'poem', language: 'pa', tags: ['ਮਾਂ', 'ਪਿਆਰ'], text: 'ਮਾਂ ਦੀਆਂ ਅੱਖਾਂ ਵਿੱਚ\nਪਿਆਰ ਦੀ ਰੋਸ਼ਨੀ...' },
];

sampleContent.forEach((s, i) => {
  const id = `content-${i + 1}`;
  contents.set(id, {
    _id: id, title: s.title, genre: s.genre, language: s.language, tags: s.tags,
    authorId: DEMO_ID,
    currentDelta: { ops: [{ insert: s.text + '\n' }] },
    versions: [], bookmarkCount: Math.floor(Math.random() * 50),
    ratings: [{ userId: 'x', value: 4 }, { userId: 'y', value: 5 }],
    isPublished: true,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

// ── Helpers ───────────────────────────────────────────────────
function makeToken() { return crypto.randomBytes(32).toString('hex'); }
function safeUser(u: User) { return { id: u.id, name: u.name, email: u.email, preferredLanguage: u.preferredLanguage, bio: u.bio }; }
function populateContent(c: Content) {
  const author = users.get(c.authorId);
  const avg = c.ratings.length ? c.ratings.reduce((s, r) => s + r.value, 0) / c.ratings.length : 0;
  return { ...c, authorId: author ? safeUser(author) : { id: c.authorId, name: 'Unknown' }, avgRating: avg };
}
function authMiddleware(req: Request, res: Response, next: Function) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  (req as any).userId = sessions.get(token);
  next();
}

// ── Auth Routes ───────────────────────────────────────────────
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, preferredLanguage = 'hi' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const existing = [...users.values()].find(u => u.email === email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const id = `user-${Date.now()}`;
  const user: User = { id, name, email, password, preferredLanguage };
  users.set(id, user);
  const token = makeToken();
  sessions.set(token, id);
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 86400000 });
  res.json({ user: safeUser(user) });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = [...users.values()].find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const token = makeToken();
  sessions.set(token, user.id);
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 86400000 });
  res.json({ user: safeUser(user) });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (token) sessions.delete(token);
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Not authenticated' });
  const userId = sessions.get(token)!;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

// ── Content Routes ────────────────────────────────────────────
app.get('/api/content', (req: Request, res: Response) => {
  const language = String(req.query.language || '');
  const genre    = String(req.query.genre    || '');
  const page     = parseInt(String(req.query.page  || '1'), 10);
  const limit    = parseInt(String(req.query.limit || '12'), 10);
  let list = [...contents.values()].filter(c => c.isPublished);
  if (language) list = list.filter(c => c.language === language);
  if (genre)    list = list.filter(c => c.genre    === genre);
  const total = list.length;
  const paged = list.slice((page - 1) * limit, page * limit);
  res.json({ contents: paged.map(populateContent), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

app.get('/api/content/my', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const mine = [...contents.values()].filter(c => c.authorId === userId);
  res.json({ contents: mine.map(populateContent) });
});

app.get('/api/content/:id', (req: Request, res: Response) => {
  const c = contents.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({ content: populateContent(c) });
});

app.post('/api/content', authMiddleware, (req: Request, res: Response) => {
  const { title, genre, language, tags = [] } = req.body;
  if (!title || !genre || !language) return res.status(400).json({ error: 'title, genre, language required' });
  const id = `content-${Date.now()}`;
  const content: Content = {
    _id: id, title, genre, language, tags,
    authorId: (req as any).userId,
    currentDelta: { ops: [{ insert: '\n' }] },
    versions: [], bookmarkCount: 0, ratings: [],
    isPublished: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  contents.set(id, content);
  res.status(201).json({ content: populateContent(content) });
});

app.put('/api/content/:id', authMiddleware, (req: Request, res: Response) => {
  const c = contents.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (c.authorId !== (req as any).userId) return res.status(403).json({ error: 'Forbidden' });
  const updates = req.body;
  Object.assign(c, updates, { updatedAt: new Date().toISOString() });
  res.json({ content: populateContent(c) });
});

app.delete('/api/content/:id', authMiddleware, (req: Request, res: Response) => {
  const c = contents.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (c.authorId !== (req as any).userId) return res.status(403).json({ error: 'Forbidden' });
  contents.delete(req.params.id);
  res.json({ success: true });
});

app.patch('/api/content/:id/save', authMiddleware, (req: Request, res: Response) => {
  const c = contents.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const { delta } = req.body;
  const version = { versionId: Date.now().toString(), delta: c.currentDelta, editedAt: new Date().toISOString() };
  c.versions.unshift(version);
  if (c.versions.length > 50) c.versions.pop();
  c.currentDelta = delta;
  c.updatedAt = new Date().toISOString();
  res.json({ success: true, versionCount: c.versions.length });
});

app.get('/api/content/:id/versions', (req: Request, res: Response) => {
  const c = contents.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({ embedded: c.versions, archived: [] });
});

app.post('/api/content/:id/bookmark', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const c = contents.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (!bookmarks.has(userId)) bookmarks.set(userId, new Set());
  const userBM = bookmarks.get(userId)!;
  const bookmarked = userBM.has(req.params.id);
  if (bookmarked) { userBM.delete(req.params.id); c.bookmarkCount = Math.max(0, c.bookmarkCount - 1); }
  else { userBM.add(req.params.id); c.bookmarkCount++; }
  res.json({ bookmarked: !bookmarked, count: c.bookmarkCount });
});

app.post('/api/content/:id/rate', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const c = contents.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const { value } = req.body;
  c.ratings = c.ratings.filter(r => r.userId !== userId);
  c.ratings.push({ userId, value });
  const avg = c.ratings.reduce((s, r) => s + r.value, 0) / c.ratings.length;
  res.json({ avgRating: avg, count: c.ratings.length });
});

// ── Search ────────────────────────────────────────────────────
app.get('/api/search', (req: Request, res: Response) => {
  const q        = String(req.query.q        || '').toLowerCase();
  const genre    = String(req.query.genre    || '');
  const language = String(req.query.language || '');
  let results = [...contents.values()].filter(c => c.isPublished);
  if (q)        results = results.filter(c => c.title.toLowerCase().includes(q) || (c.tags as string[]).some(t => t.toLowerCase().includes(q)));
  if (genre)    results = results.filter(c => c.genre    === genre);
  if (language) results = results.filter(c => c.language === language);
  res.json({ results: results.map(populateContent) });
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', mode: 'demo-in-memory', ts: Date.now() }));
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`\n🚀 [Akshar Server] Running on http://localhost:${PORT}`);
  console.log(`📦 Mode: DEMO (in-memory, no database needed)`);
  console.log(`🔑 Demo login: demo@akshar.com / demo1234\n`);
});
