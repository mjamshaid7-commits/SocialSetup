import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  PLATFORMS,
  POST_TYPES,
  type PlatformId,
  type PostTypeId,
  type PostStatus,
  type SocialPost,
  type Campaign,
  type MediaAsset,
  type ActivityLog,
  normalizePlatform,
  normalizePostType,
  validatePostInput,
  parseCsvText,
  serializePostsToCsv,
} from './shared/platforms.ts';

const ROOT_DIR =
  typeof __dirname !== 'undefined' && fsSync.existsSync(path.join(__dirname, 'package.json'))
    ? __dirname
    : process.cwd();
const app = express();
const PORT: string | number = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'posts.json');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const SESSION_MS = 12 * 60 * 60 * 1000;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
const DEFAULT_TIMEZONE = 'Asia/Karachi';

// Free-tier eligible Gemini models only (blocks paid-only models to honor Free AI Only policy)
const FREE_ELIGIBLE_GEMINI_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
]);

interface SessionRecord {
  username: string;
  expires: number;
}

interface DiscoveredFacebookPage {
  id: string;
  name: string;
  category: string;
  link?: string;
  hasAccessToken?: boolean;
}

interface DatabaseSchema {
  schemaVersion: number;
  posts: SocialPost[];
  campaigns: Campaign[];
  media: MediaAsset[];
  logs: ActivityLog[];
  settings?: {
    adminUsername?: string;
    preferredAiProvider?: 'auto' | 'ollama' | 'gemini' | 'manual';
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    geminiModel?: string;
    timezone?: string;
    enableFacebookPublishing?: boolean;
    enableAutoPublish?: boolean;
    metaPageId?: string;
    metaPageName?: string;
    metaPageCategory?: string;
    metaGraphVersion?: string;
    facebookAppId?: string;
    runtimeMetaAccessToken?: string;
    discoveredPages?: DiscoveredFacebookPage[];
  };
}

const sessions = new Map<string, SessionRecord>();
const inFlightPublishIds = new Set<string>();

try {
  fsSync.mkdirSync(DATA_DIR, { recursive: true });
  fsSync.mkdirSync(BACKUP_DIR, { recursive: true });
  fsSync.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fsSync.existsSync(path.join(UPLOAD_DIR, '.gitkeep'))) {
    fsSync.writeFileSync(path.join(UPLOAD_DIR, '.gitkeep'), '');
  }
} catch (initErr) {
  console.warn('Storage directory init warning:', initErr);
}

function createInitialSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const twoDays = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const campId = 'camp-toptech-q4-ai';

  const initialCampaign: Campaign = {
    id: campId,
    name: 'TopTech SME Workflow Automation Series',
    topic: 'Practical Free AI & Process Automation for Growing Businesses',
    targetAudience: 'SME Founders, Operations Managers, and Tech Learners in South Asia & MENA',
    businessName: 'TopTech Solutions',
    goals: 'Educate business owners on cost-effective workflow automation and generate consultation inquiries',
    tone: 'Professional, practical, and authoritative',
    startDate: tomorrow.slice(0, 10),
    durationDays: 14,
    selectedPlatforms: ['facebook', 'linkedin', 'x', 'instagram', 'youtube', 'threads'],
    platformPostTypes: {
      facebook: 'link',
      linkedin: 'text',
      x: 'text',
      instagram: 'carousel',
      youtube: 'youtube_video',
      threads: 'text',
    },
    notes: 'Multi-platform educational series showcasing how each platform receives tailored copy, tags, and post types.',
    createdAt: now,
    updatedAt: now,
  };

  const initialPosts: SocialPost[] = [
    {
      id: 'post-seed-fb-1',
      campaignId: campId,
      title: '3 Manual Workflows Every SME Should Automate First',
      topic: 'Practical Free AI & Process Automation',
      seriesName: 'SME Automation Blueprint',
      episodeNumber: '1',
      platform: 'facebook',
      postType: 'link',
      caption:
        'Most growing teams lose 8–12 hours every week copying invoice rows, triaging repetitive support messages, and formatting weekly status reports.\n\nBefore investing in expensive enterprise suites, audit these three workflows:\n1. Standardized CSV data intake & validation\n2. Automated ticket categorization with local open-weights models\n3. Scheduled multi-channel content queues with human review gates\n\nRead our complete breakdown and checklist for operations teams.',
      articleText:
        '# 3 Manual Workflows Every SME Should Automate First\n\n## 1. Structured Data Intake\nStandardizing spreadsheets and CSV imports eliminates 70% of downstream entry errors.\n\n## 2. Local Free AI Triage\nRunning open-weights models via Ollama on office hardware keeps client data private with zero per-token API bills.\n\n## 3. Reviewed Publishing Queues\nBatch your communication weekly while keeping human approval mandatory before publication.',
      hashtags: '#TopTechSolutions #WorkflowAutomation #SMEGrowth #DigitalTransformation',
      platformTags: '@TopTechSolutions, Business Operations, Software Engineering',
      callToAction: 'Read the Engineering Checklist',
      destinationUrl: 'https://toptechsolutions.example.com/guides/sme-automation',
      imageUrl: '',
      mediaUrls: [],
      mediaFilename: '',
      mediaMimeType: '',
      scheduledAt: tomorrow,
      status: 'approved',
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null,
    },
    {
      id: 'post-seed-li-1',
      campaignId: campId,
      title: 'Why Operations Architecture Beats Expensive AI Subscriptions',
      topic: 'Practical Free AI & Process Automation',
      seriesName: 'SME Automation Blueprint',
      episodeNumber: '1',
      platform: 'linkedin',
      postType: 'text',
      caption:
        'We frequently audit teams spending thousands of dollars a year on overlapping SaaS subscriptions when their core bottleneck is actually unstructured data handoffs.\n\nAt TopTech Solutions, our rule for engineering sustainable internal tools is straightforward:\n• Standardize the schema first (clean CSV/JSON contracts)\n• Keep human review gates between draft generation and client-facing output\n• Use local inference (Ollama) or eligible free-tier models instead of uncapped per-seat API billing\n\nWhich internal workflow is currently taking your team the most manual effort each week?',
      articleText: '',
      hashtags: '#TopTechSolutions #SoftwareArchitecture #OperationsManagement #B2BTech',
      platformTags: '@TopTech Solutions, Information Technology, Business Strategy',
      callToAction: 'Share your workflow challenge in the comments',
      destinationUrl: 'https://toptechsolutions.example.com/guides/sme-automation',
      imageUrl: '',
      mediaUrls: [],
      mediaFilename: '',
      mediaMimeType: '',
      scheduledAt: twoDays,
      status: 'scheduled',
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null,
    },
    {
      id: 'post-seed-x-1',
      campaignId: campId,
      title: 'X Thread Opener: Clean Schemas Before AI',
      topic: 'Practical Free AI & Process Automation',
      seriesName: 'SME Automation Blueprint',
      episodeNumber: '1',
      platform: 'x',
      postType: 'text',
      caption:
        'Unpopular engineering truth: Clean CSV schemas + deterministic validation rules solve 80% of business automation problems before you even touch an LLM. Keep AI local & free, and keep humans in the approval loop.',
      articleText: '',
      hashtags: '#TopTechSolutions #BuildInPublic',
      platformTags: '@TopTechPK',
      callToAction: 'Bookmark for your next sprint',
      destinationUrl: '',
      imageUrl: '',
      mediaUrls: [],
      mediaFilename: '',
      mediaMimeType: '',
      scheduledAt: '',
      status: 'draft',
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null,
    },
    {
      id: 'post-seed-yt-1',
      campaignId: campId,
      title: 'How to Run Local AI (Ollama) for Business Content & Operations — Zero API Cost',
      topic: 'Practical Free AI & Process Automation',
      seriesName: 'SME Automation Blueprint',
      episodeNumber: '1',
      platform: 'youtube',
      postType: 'youtube_video',
      caption:
        'In this full walkthrough from TopTech Solutions, we demonstrate how to configure local open-weights models with Ollama (Llama 3.2) alongside TopTech Social Studio so your team can plan multi-platform campaigns, validate CSV imports, and schedule content without paying recurring API token fees.\n\nChapters:\n00:00 Why Free & Local AI Matters for SMEs\n02:15 Installing Ollama & Pulling llama3.2\n05:40 Generating Multi-Platform Campaigns\n09:10 Bulk CSV Import & Human Approval Workflow',
      articleText: '',
      hashtags: '#TopTechSolutions #Ollama #LocalAI',
      platformTags: 'toptech solutions, ollama tutorial, free ai for business, social media scheduler, llama 3.2',
      callToAction: 'Subscribe & download our free CSV campaign template',
      destinationUrl: 'https://toptechsolutions.example.com/templates',
      imageUrl: '',
      mediaUrls: [],
      mediaFilename: 'ollama-walkthrough-ep1.mp4',
      mediaMimeType: 'video/mp4',
      scheduledAt: '',
      status: 'draft',
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null,
    },
  ];

  return {
    schemaVersion: 2,
    posts: initialPosts,
    campaigns: [initialCampaign],
    media: [],
    logs: [
      {
        id: crypto.randomUUID(),
        at: now,
        type: 'system',
        message: 'Initialized TopTech Social Studio v2.0 database with multi-platform campaign schema.',
        postId: null,
      },
    ],
    settings: {
      preferredAiProvider: 'auto',
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
      geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      timezone: DEFAULT_TIMEZONE,
    },
  };
}

// Initialize DB_FILE synchronously if it does not already exist (never overwrite existing data!)
try {
  if (!fsSync.existsSync(DB_FILE)) {
    fsSync.writeFileSync(DB_FILE, JSON.stringify(createInitialSeedData(), null, 2), 'utf8');
  }
} catch (seedErr) {
  console.warn('Database seed init warning:', seedErr);
}

function normalizePostRecord(raw: Record<string, any>): SocialPost {
  const platform = normalizePlatform(raw.platform);
  const postType = normalizePostType(raw.postType || raw.post_type, platform);
  const imageUrl = String(raw.imageUrl || raw.image_url || raw.media_url || '').slice(0, 1000);
  const mediaUrls = Array.isArray(raw.mediaUrls)
    ? raw.mediaUrls.map((u: unknown) => String(u))
    : imageUrl
      ? [imageUrl]
      : [];
  const validStatuses: PostStatus[] = ['draft', 'approved', 'scheduled', 'published', 'failed'];
  const status: PostStatus = validStatuses.includes(raw.status) ? raw.status : 'draft';

  return {
    id: String(raw.id || crypto.randomUUID()),
    campaignId: String(raw.campaignId || raw.campaign_id || ''),
    title: String(raw.title || raw.post_title || '').slice(0, 200),
    topic: String(raw.topic || 'General').slice(0, 160),
    seriesName: String(raw.seriesName || raw.series_name || '').slice(0, 160),
    episodeNumber: String(raw.episodeNumber || raw.episode_number || '').slice(0, 40),
    platform,
    postType,
    caption: String(raw.caption || '').slice(0, 100000),
    articleText: String(raw.articleText || raw.article_text || '').slice(0, 100000),
    hashtags: String(raw.hashtags || '').slice(0, 2000),
    platformTags: String(raw.platformTags || raw.platform_tags || '').slice(0, 2000),
    callToAction: String(raw.callToAction || raw.call_to_action || '').slice(0, 300),
    destinationUrl: String(raw.destinationUrl || raw.destination_url || '').slice(0, 1000),
    imageUrl: imageUrl || (mediaUrls[0] ?? ''),
    mediaUrls,
    mediaFilename: String(raw.mediaFilename || raw.media_filename || raw.image_filename || '').slice(0, 260),
    mediaMimeType: String(raw.mediaMimeType || ''),
    scheduledAt: String(raw.scheduledAt || ''),
    status,
    isManuallyEdited: Boolean(raw.isManuallyEdited),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.createdAt || new Date().toISOString()),
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    facebookPostId: raw.facebookPostId ? String(raw.facebookPostId) : null,
    lastError: raw.lastError ? String(raw.lastError) : null,
  };
}

async function readDb(): Promise<DatabaseSchema> {
  const rawText = await fs.readFile(DB_FILE, 'utf8');
  const parsed = JSON.parse(rawText);
  const posts: SocialPost[] = Array.isArray(parsed.posts)
    ? parsed.posts.map(normalizePostRecord)
    : [];
  const campaigns: Campaign[] = Array.isArray(parsed.campaigns) ? parsed.campaigns : [];
  const media: MediaAsset[] = Array.isArray(parsed.media) ? parsed.media : [];
  const logs: ActivityLog[] = Array.isArray(parsed.logs) ? parsed.logs : [];
  return {
    schemaVersion: 2,
    posts,
    campaigns,
    media,
    logs,
    settings: {
      preferredAiProvider: parsed.settings?.preferredAiProvider || 'auto',
      ollamaBaseUrl: parsed.settings?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      ollamaModel: parsed.settings?.ollamaModel || process.env.OLLAMA_MODEL || 'llama3.2',
      geminiModel: parsed.settings?.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      timezone: parsed.settings?.timezone || DEFAULT_TIMEZONE,
      adminUsername: parsed.settings?.adminUsername || process.env.ADMIN_USERNAME || 'admin',
      metaPageId: parsed.settings?.metaPageId || process.env.META_PAGE_ID || '',
      metaPageName: parsed.settings?.metaPageName || '',
      metaPageCategory: parsed.settings?.metaPageCategory || '',
      metaGraphVersion: parsed.settings?.metaGraphVersion || process.env.META_GRAPH_VERSION || GRAPH_VERSION,
      facebookAppId: parsed.settings?.facebookAppId || '',
      enableFacebookPublishing:
        parsed.settings?.enableFacebookPublishing !== undefined
          ? Boolean(parsed.settings.enableFacebookPublishing)
          : process.env.ENABLE_FACEBOOK_PUBLISHING === 'true',
      enableAutoPublish:
        parsed.settings?.enableAutoPublish !== undefined
          ? Boolean(parsed.settings.enableAutoPublish)
          : process.env.ENABLE_AUTO_PUBLISH === 'true',
      discoveredPages: Array.isArray(parsed.settings?.discoveredPages)
        ? parsed.settings.discoveredPages
        : [],
      runtimeMetaAccessToken: parsed.settings?.runtimeMetaAccessToken || '',
    },
  };
}

async function writeDb(db: DatabaseSchema): Promise<void> {
  const tmp = `${DB_FILE}.tmp.${process.pid}.${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DB_FILE);
}

async function createBackupSnapshot(reason: string): Promise<string> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeReason = reason.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const filename = `posts-backup-${stamp}-${safeReason}.json`;
    await fs.writeFile(path.join(BACKUP_DIR, filename), raw, 'utf8');
    // Keep most recent 25 backups
    const files = (await fs.readdir(BACKUP_DIR))
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    for (const old of files.slice(25)) {
      await fs.unlink(path.join(BACKUP_DIR, old)).catch(() => {});
    }
    return filename;
  } catch {
    return '';
  }
}

function logEntry(db: DatabaseSchema, type: string, message: string, postId: string | null = null) {
  db.logs.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    type,
    message,
    postId,
  });
  db.logs = db.logs.slice(0, 400);
}

// Security headers & middleware (native Express — avoids helmet/express-rate-limit proxy conflicts on Hostinger LiteSpeed)
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1h' }));

function createMemoryRateLimiter(windowMs: number, maxRequests: number, errorMessage: string) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = String(req.ip || req.socket?.remoteAddress || 'global');
    const record = hits.get(key);
    if (!record || record.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    record.count += 1;
    if (record.count > maxRequests) {
      return res.status(429).json({ error: errorMessage });
    }
    return next();
  };
}

const loginLimiter = createMemoryRateLimiter(
  15 * 60 * 1000,
  20,
  'Too many login attempts. Please wait 15 minutes before retrying.'
);

const aiLimiter = createMemoryRateLimiter(
  60 * 1000,
  25,
  'AI generation rate limit reached (max 25 requests/minute). Please wait a moment.'
);

const ALLOWED_MIMES: Record<string, { ext: string; category: 'image' | 'video' }> = {
  'image/jpeg': { ext: '.jpg', category: 'image' },
  'image/png': { ext: '.png', category: 'image' },
  'image/webp': { ext: '.webp', category: 'image' },
  'image/gif': { ext: '.gif', category: 'image' },
  'video/mp4': { ext: '.mp4', category: 'video' },
  'video/webm': { ext: '.webm', category: 'video' },
  'video/quicktime': { ext: '.mov', category: 'video' },
};

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max for video, 12 MB checked for images
  fileFilter: (_req, file, cb) => {
    cb(null, Boolean(ALLOWED_MIMES[file.mimetype]));
  },
});

function isPlaceholderSecret(val?: string): boolean {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return (
    lower === '' ||
    lower.includes('change-this') ||
    lower.includes('change_this') ||
    lower.includes('replace-with') ||
    lower === 'my_gemini_api_key' ||
    lower === 'your_api_key'
  );
}

function verifyPasswordHash(inputPassword: string, configuredPassword: string): boolean {
  const salt = process.env.SESSION_SECRET || 'toptech-studio-default-salt';
  const hashA = crypto.scryptSync(String(inputPassword || ''), salt, 64);
  const hashB = crypto.scryptSync(String(configuredPassword || ''), salt, 64);
  return crypto.timingSafeEqual(hashA, hashB);
}

function getCookie(req: Request, name: string): string {
  const raw = req.headers.cookie || '';
  const item = raw
    .split(';')
    .map(s => s.trim())
    .find(s => s.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

function isProductionStrictAuth(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    !isPlaceholderSecret(process.env.ADMIN_PASSWORD)
  );
}

function auth(req: Request, res: Response, next: NextFunction) {
  const token = getCookie(req, 'tts_session');
  const session = sessions.get(token);
  if (session && session.expires > Date.now()) {
    session.expires = Date.now() + SESSION_MS;
    return next();
  }
  if (token) sessions.delete(token);

  // If ADMIN_PASSWORD is not configured (e.g. initial local/preview environment),
  // allow access when NODE_ENV !== 'production' so the studio is immediately usable,
  // while still honoring explicit login/logout when ADMIN_PASSWORD is set.
  if (isPlaceholderSecret(process.env.ADMIN_PASSWORD) && process.env.NODE_ENV !== 'production') {
    return next();
  }

  return res.status(401).json({ error: 'Authentication required. Please log in.' });
}

function hasValidGeminiKey(): boolean {
  return !isPlaceholderSecret(process.env.GEMINI_API_KEY);
}

async function probeOllama(baseUrl: string): Promise<{
  reachable: boolean;
  models: string[];
  error: string | null;
}> {
  const cleanBase = String(baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const r = await fetch(`${cleanBase}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) {
      return { reachable: false, models: [], error: `HTTP ${r.status} from Ollama server` };
    }
    const data = (await r.json()) as { models?: Array<{ name?: string }> };
    const models = Array.isArray(data.models)
      ? data.models.map(m => String(m.name || '')).filter(Boolean)
      : [];
    return { reachable: true, models, error: null };
  } catch (e: any) {
    clearTimeout(timer);
    return {
      reachable: false,
      models: [],
      error:
        cleanBase.includes('localhost') || cleanBase.includes('127.0.0.1')
          ? 'Local Ollama server not detected at ' +
            cleanBase +
            '. Ensure Ollama is installed and running (`ollama serve`) on the same machine running this Node.js server.'
          : `Could not connect to Ollama at ${cleanBase}: ${e?.message || 'Connection refused'}`,
    };
  }
}

function getEffectiveMetaCredentials(db: DatabaseSchema) {
  const pageId = String(db.settings?.metaPageId || process.env.META_PAGE_ID || '').trim();
  const envToken = !isPlaceholderSecret(process.env.META_PAGE_ACCESS_TOKEN)
    ? String(process.env.META_PAGE_ACCESS_TOKEN || '').trim()
    : '';
  const runtimeToken = !isPlaceholderSecret(db.settings?.runtimeMetaAccessToken)
    ? String(db.settings?.runtimeMetaAccessToken || '').trim()
    : '';
  const accessToken = runtimeToken || envToken;
  const graphVersion = String(
    db.settings?.metaGraphVersion || process.env.META_GRAPH_VERSION || GRAPH_VERSION
  ).trim() || 'v23.0';
  const publishingEnabled =
    db.settings?.enableFacebookPublishing !== undefined
      ? Boolean(db.settings.enableFacebookPublishing)
      : process.env.ENABLE_FACEBOOK_PUBLISHING === 'true';
  const autoPublishEnabled =
    db.settings?.enableAutoPublish !== undefined
      ? Boolean(db.settings.enableAutoPublish)
      : process.env.ENABLE_AUTO_PUBLISH === 'true';

  return {
    pageId,
    accessToken,
    graphVersion,
    publishingEnabled,
    autoPublishEnabled,
    metaConfigured: Boolean(pageId && accessToken),
  };
}

async function discoverFacebookPagesFromToken(
  db: DatabaseSchema,
  overrideToken?: string
): Promise<{
  ok: boolean;
  pages: DiscoveredFacebookPage[];
  selectedPage: DiscoveredFacebookPage | null;
  error?: string;
}> {
  const creds = getEffectiveMetaCredentials(db);
  const token = String(overrideToken || creds.accessToken || '').trim();
  const graphVer = creds.graphVersion || 'v23.0';

  if (!token) {
    return {
      ok: false,
      pages: db.settings?.discoveredPages || [],
      selectedPage: null,
      error: 'No Meta Access Token available yet. Connect via Facebook Login or provide a Page/User token in Login Info.',
    };
  }

  db.settings = db.settings || {};
  const discovered: DiscoveredFacebookPage[] = [];
  let pageSpecificToken = token;

  try {
    // 1. Check /me/accounts (if user logged in with a Meta User Access Token that manages Pages)
    const accountsUrl = new URL(`https://graph.facebook.com/${graphVer}/me/accounts`);
    accountsUrl.searchParams.set('fields', 'id,name,category,link,access_token');
    accountsUrl.searchParams.set('access_token', token);
    const rAcc = await fetch(accountsUrl);
    if (rAcc.ok) {
      const dAcc = (await rAcc.json()) as {
        data?: Array<{ id: string; name: string; category?: string; link?: string; access_token?: string }>;
      };
      if (Array.isArray(dAcc.data) && dAcc.data.length > 0) {
        for (const item of dAcc.data) {
          discovered.push({
            id: String(item.id),
            name: String(item.name || 'Facebook Page'),
            category: String(item.category || 'Facebook Page'),
            link: item.link ? String(item.link) : `https://www.facebook.com/${item.id}`,
          });
        }
        // Pick matching page or first page automatically
        const target =
          dAcc.data.find(x => x.id === db.settings?.metaPageId) || dAcc.data[0];
        if (target) {
          db.settings.metaPageId = String(target.id);
          db.settings.metaPageName = String(target.name || '');
          db.settings.metaPageCategory = String(target.category || 'Facebook Page');
          if (target.access_token) {
            pageSpecificToken = String(target.access_token);
          }
        }
      }
    }

    // 2. Also check /me directly (if token is already a Page Access Token)
    if (discovered.length === 0) {
      const meUrl = new URL(`https://graph.facebook.com/${graphVer}/me`);
      meUrl.searchParams.set('fields', 'id,name,category,link');
      meUrl.searchParams.set('access_token', token);
      const rMe = await fetch(meUrl);
      const dMe = (await rMe.json()) as Record<string, any>;
      if (!rMe.ok) {
        return {
          ok: false,
          pages: db.settings.discoveredPages || [],
          selectedPage: null,
          error: dMe?.error?.message || 'Meta Graph API rejected the token during auto-discovery.',
        };
      }
      if (dMe.id) {
        const pageObj: DiscoveredFacebookPage = {
          id: String(dMe.id),
          name: String(dMe.name || 'Connected Facebook Page'),
          category: String(dMe.category || 'Facebook Page'),
          link: dMe.link ? String(dMe.link) : `https://www.facebook.com/${dMe.id}`,
        };
        discovered.push(pageObj);
        db.settings.metaPageId = pageObj.id;
        db.settings.metaPageName = pageObj.name;
        db.settings.metaPageCategory = pageObj.category;
      }
    }

    if (overrideToken || pageSpecificToken) {
      db.settings.runtimeMetaAccessToken = pageSpecificToken;
    }
    if (!db.settings.metaGraphVersion) {
      db.settings.metaGraphVersion = graphVer;
    }
    db.settings.discoveredPages = discovered;

    const selectedPage =
      discovered.find(p => p.id === db.settings?.metaPageId) || discovered[0] || null;

    logEntry(
      db,
      'facebook_autodiscover',
      selectedPage
        ? `Auto-picked Facebook Page "${selectedPage.name}" (ID: ${selectedPage.id})`
        : 'Completed Facebook Page discovery check'
    );
    await writeDb(db);

    return {
      ok: true,
      pages: discovered,
      selectedPage,
    };
  } catch (e: any) {
    return {
      ok: false,
      pages: db.settings.discoveredPages || [],
      selectedPage: null,
      error: `Facebook Page auto-discovery failed: ${e.message}`,
    };
  }
}

async function getSystemStatus(db: DatabaseSchema) {
  const ollamaUrl = db.settings?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = db.settings?.ollamaModel || process.env.OLLAMA_MODEL || 'llama3.2';
  const geminiModel = db.settings?.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const geminiKeyPresent = hasValidGeminiKey();
  const geminiModelEligible = FREE_ELIGIBLE_GEMINI_MODELS.has(geminiModel);
  const ollamaProbe = await probeOllama(ollamaUrl);

  const adminPasswordConfigured = !isPlaceholderSecret(process.env.ADMIN_PASSWORD);
  const sessionSecretConfigured = !isPlaceholderSecret(process.env.SESSION_SECRET);
  const metaCreds = getEffectiveMetaCredentials(db);

  let activeAiSummary = 'Manual Mode (No Free AI Active)';
  if (ollamaProbe.reachable) {
    activeAiSummary = `Ollama Local (${ollamaModel})`;
  } else if (geminiKeyPresent && geminiModelEligible) {
    activeAiSummary = `Google Gemini Free-Tier Eligible (${geminiModel})`;
  }

  return {
    adminUsername: db.settings?.adminUsername || process.env.ADMIN_USERNAME || 'admin',
    adminPasswordConfigured,
    sessionSecretConfigured,
    strictAuthEnforced: isProductionStrictAuth(),
    aiConfigured: ollamaProbe.reachable || (geminiKeyPresent && geminiModelEligible),
    aiProvider: activeAiSummary,
    preferredAiProvider: db.settings?.preferredAiProvider || 'auto',
    ollama: {
      baseUrl: ollamaUrl,
      configuredModel: ollamaModel,
      reachable: ollamaProbe.reachable,
      installedModels: ollamaProbe.models,
      error: ollamaProbe.error,
      isLocalhost: ollamaUrl.includes('localhost') || ollamaUrl.includes('127.0.0.1'),
    },
    gemini: {
      keyConfigured: geminiKeyPresent,
      configuredModel: geminiModel,
      isFreeTierEligibleModel: geminiModelEligible,
      allowedFreeModels: Array.from(FREE_ELIGIBLE_GEMINI_MODELS),
      notice: geminiKeyPresent
        ? geminiModelEligible
          ? 'Server-side GEMINI_API_KEY detected with eligible Flash model. Subject to Google AI Studio free-tier rate and regional limits.'
          : `Configured model "${geminiModel}" is not on the Free-AI allowlist. Select gemini-2.5-flash or gemini-3.8-flash.`
        : 'GEMINI_API_KEY is not set in server environment.',
    },
    metaConfigured: metaCreds.metaConfigured,
    metaPageId: metaCreds.pageId,
    metaPageName: db.settings?.metaPageName || '',
    metaPageCategory: db.settings?.metaPageCategory || '',
    metaTokenConfigured: Boolean(metaCreds.accessToken),
    metaPageIdPreview: metaCreds.pageId
      ? `${String(metaCreds.pageId).slice(0, 8)}...`
      : null,
    facebookAppId: db.settings?.facebookAppId || '',
    discoveredPages: db.settings?.discoveredPages || [],
    publishingEnabled: metaCreds.publishingEnabled,
    autoPublishEnabled: metaCreds.autoPublishEnabled,
    graphVersion: metaCreds.graphVersion,
    timezone: db.settings?.timezone || DEFAULT_TIMEZONE,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
  };
}

// Health & Auth Routes
app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    app: 'TopTech Social Studio',
    version: '2.0.0',
    time: new Date().toISOString(),
  })
);

app.get('/api/session', async (req, res) => {
  const token = getCookie(req, 'tts_session');
  const s = sessions.get(token);
  const adminPasswordConfigured = !isPlaceholderSecret(process.env.ADMIN_PASSWORD);
  const authenticated =
    Boolean(s && s.expires > Date.now()) ||
    (!adminPasswordConfigured && process.env.NODE_ENV !== 'production');

  const db = await readDb();
  res.json({
    authenticated,
    username: s?.username || db.settings?.adminUsername || process.env.ADMIN_USERNAME || 'admin',
    adminPasswordConfigured,
    requiresSetupInProduction: !adminPasswordConfigured && process.env.NODE_ENV === 'production',
  });
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const db = await readDb();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const configuredUsername = db.settings?.adminUsername || process.env.ADMIN_USERNAME || 'admin';
  const { username = 'admin', password = '', facebookAccessToken = '' } = req.body || {};

  if (isPlaceholderSecret(configuredPassword)) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Set a strong ADMIN_PASSWORD and SESSION_SECRET in .env before logging in on production.',
      });
    }
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { username: configuredUsername, expires: Date.now() + SESSION_MS });
    res.setHeader(
      'Set-Cookie',
      `tts_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}`
    );
    // Automatically pick relevant values from already authorized/logged-in Facebook Page on login
    const autoPick = await discoverFacebookPagesFromToken(
      db,
      facebookAccessToken ? String(facebookAccessToken) : undefined
    );
    return res.json({
      ok: true,
      mode: 'development-preview',
      facebookAutoPicked: autoPick.selectedPage,
    });
  }

  if (String(username).trim() !== configuredUsername || !verifyPasswordHash(password, configuredPassword!)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username: configuredUsername, expires: Date.now() + SESSION_MS });
  res.setHeader(
    'Set-Cookie',
    `tts_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(
      SESSION_MS / 1000
    )}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
  const autoPick = await discoverFacebookPagesFromToken(
    db,
    facebookAccessToken ? String(facebookAccessToken) : undefined
  );
  res.json({ ok: true, facebookAutoPicked: autoPick.selectedPage });
});

app.post('/api/logout', (req, res) => {
  sessions.delete(getCookie(req, 'tts_session'));
  res.setHeader('Set-Cookie', 'tts_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/status', auth, async (_req, res) => {
  const db = await readDb();
  res.json(await getSystemStatus(db));
});

app.patch('/api/settings', auth, async (req, res) => {
  const db = await readDb();
  db.settings = db.settings || {};
  const { preferredAiProvider, ollamaBaseUrl, ollamaModel, geminiModel, timezone } = req.body || {};

  if (preferredAiProvider && ['auto', 'ollama', 'gemini', 'manual'].includes(preferredAiProvider)) {
    db.settings.preferredAiProvider = preferredAiProvider;
  }
  if (typeof ollamaBaseUrl === 'string' && ollamaBaseUrl.trim()) {
    const cleanUrl = ollamaBaseUrl.trim().slice(0, 200);
    if (!/^https?:\/\/.+/i.test(cleanUrl)) {
      return res.status(400).json({ error: 'Ollama Base URL must start with http:// or https://.' });
    }
    db.settings.ollamaBaseUrl = cleanUrl;
  }
  if (typeof ollamaModel === 'string' && ollamaModel.trim()) {
    db.settings.ollamaModel = ollamaModel.trim().slice(0, 80);
  }
  if (typeof geminiModel === 'string' && geminiModel.trim()) {
    if (!FREE_ELIGIBLE_GEMINI_MODELS.has(geminiModel.trim())) {
      return res.status(400).json({
        error: `Model "${geminiModel}" is not allowed under the Free-AI-Only policy. Choose one of: ${Array.from(
          FREE_ELIGIBLE_GEMINI_MODELS
        ).join(', ')}.`,
      });
    }
    db.settings.geminiModel = geminiModel.trim();
  }
  if (typeof timezone === 'string' && timezone.trim()) {
    db.settings.timezone = timezone.trim().slice(0, 60);
  }

  logEntry(db, 'settings', `Updated studio settings (AI preference: ${db.settings.preferredAiProvider})`);
  await writeDb(db);
  res.json(await getSystemStatus(db));
});

// Login Info & Auto-Discovery Endpoints
app.post('/api/login-info', auth, async (req, res) => {
  const db = await readDb();
  db.settings = db.settings || {};
  const body = req.body || {};

  if (typeof body.adminUsername === 'string' && body.adminUsername.trim()) {
    db.settings.adminUsername = body.adminUsername.trim().slice(0, 80);
  }
  if (typeof body.ollamaBaseUrl === 'string' && body.ollamaBaseUrl.trim()) {
    const cleanUrl = body.ollamaBaseUrl.trim().slice(0, 200);
    if (!/^https?:\/\/.+/i.test(cleanUrl)) {
      return res.status(400).json({ error: 'OLLAMA_BASE_URL must start with http:// or https://.' });
    }
    db.settings.ollamaBaseUrl = cleanUrl;
  }
  if (typeof body.ollamaModel === 'string' && body.ollamaModel.trim()) {
    db.settings.ollamaModel = body.ollamaModel.trim().slice(0, 80);
  }
  if (typeof body.geminiModel === 'string' && body.geminiModel.trim()) {
    if (!FREE_ELIGIBLE_GEMINI_MODELS.has(body.geminiModel.trim())) {
      return res.status(400).json({
        error: `GEMINI_MODEL "${body.geminiModel}" is not on the Free-AI allowlist.`,
      });
    }
    db.settings.geminiModel = body.geminiModel.trim();
  }
  if (body.enableFacebookPublishing !== undefined) {
    db.settings.enableFacebookPublishing = Boolean(body.enableFacebookPublishing);
  }
  if (body.enableAutoPublish !== undefined) {
    db.settings.enableAutoPublish = Boolean(body.enableAutoPublish);
  }
  if (typeof body.metaPageId === 'string') {
    db.settings.metaPageId = body.metaPageId.trim().slice(0, 120);
  }
  if (typeof body.metaPageName === 'string') {
    db.settings.metaPageName = body.metaPageName.trim().slice(0, 160);
  }
  if (typeof body.metaGraphVersion === 'string' && body.metaGraphVersion.trim()) {
    db.settings.metaGraphVersion = body.metaGraphVersion.trim().slice(0, 30);
  }
  if (typeof body.facebookAppId === 'string') {
    db.settings.facebookAppId = body.facebookAppId.trim().slice(0, 80);
  }
  if (typeof body.metaPageAccessToken === 'string' && body.metaPageAccessToken.trim()) {
    db.settings.runtimeMetaAccessToken = body.metaPageAccessToken.trim();
  }

  logEntry(db, 'login_info_updated', 'Updated runtime configuration variables via Login Info tab');
  await writeDb(db);

  // If a Meta token is present, automatically discover & pick Facebook Page details
  if (body.autoDiscoverFacebook || body.metaPageAccessToken) {
    await discoverFacebookPagesFromToken(db);
  }

  res.json({
    ok: true,
    status: await getSystemStatus(db),
  });
});

app.post('/api/facebook/auto-discover', auth, async (req, res) => {
  const db = await readDb();
  const { accessToken, browserPages, selectedPageId } = req.body || {};

  // If browser Facebook JS SDK passed discovered pages directly
  if (Array.isArray(browserPages) && browserPages.length > 0) {
    db.settings = db.settings || {};
    const mapped: DiscoveredFacebookPage[] = browserPages.map((p: any) => ({
      id: String(p.id || ''),
      name: String(p.name || 'Facebook Page'),
      category: String(p.category || 'Facebook Page'),
      link: p.link ? String(p.link) : `https://www.facebook.com/${p.id}`,
    })).filter(p => p.id);

    db.settings.discoveredPages = mapped;
    const chosen =
      browserPages.find((p: any) => p.id === selectedPageId) || browserPages[0];
    if (chosen) {
      db.settings.metaPageId = String(chosen.id);
      db.settings.metaPageName = String(chosen.name || '');
      db.settings.metaPageCategory = String(chosen.category || 'Facebook Page');
      if (chosen.access_token) {
        db.settings.runtimeMetaAccessToken = String(chosen.access_token);
      }
    }
    logEntry(
      db,
      'facebook_autodiscover',
      `Auto-populated Facebook Page "${db.settings.metaPageName}" (${db.settings.metaPageId}) from browser Facebook session`
    );
    await writeDb(db);
    return res.json({
      ok: true,
      pages: mapped,
      selectedPage: chosen,
      status: await getSystemStatus(db),
    });
  }

  // If user selected one of the already discovered pages
  if (selectedPageId && (!accessToken || !String(accessToken).trim())) {
    db.settings = db.settings || {};
    const found = (db.settings.discoveredPages || []).find(p => p.id === selectedPageId);
    if (found) {
      db.settings.metaPageId = found.id;
      db.settings.metaPageName = found.name;
      db.settings.metaPageCategory = found.category;
      await writeDb(db);
      return res.json({
        ok: true,
        pages: db.settings.discoveredPages,
        selectedPage: found,
        status: await getSystemStatus(db),
      });
    }
  }

  const discovery = await discoverFacebookPagesFromToken(
    db,
    typeof accessToken === 'string' && accessToken.trim() ? accessToken.trim() : undefined
  );
  if (!discovery.ok) {
    return res.status(400).json({
      error: discovery.error || 'Could not auto-discover Facebook Pages.',
      status: await getSystemStatus(db),
    });
  }
  res.json({
    ok: true,
    pages: discovery.pages,
    selectedPage: discovery.selectedPage,
    status: await getSystemStatus(db),
  });
});

// Posts, Campaigns, and Media state
app.get('/api/posts', auth, async (_req, res) => {
  const db = await readDb();
  const sortedPosts = [...db.posts].sort((a, b) => {
    if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.localeCompare(b.scheduledAt);
    if (a.scheduledAt) return -1;
    if (b.scheduledAt) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  res.json({
    posts: sortedPosts,
    campaigns: db.campaigns,
    media: db.media,
    logs: db.logs.slice(0, 100),
  });
});

app.post('/api/posts', auth, async (req, res) => {
  const body = req.body || {};
  const platform = normalizePlatform(body.platform);
  const postType = normalizePostType(body.postType, platform);
  const status: PostStatus = ['draft', 'approved', 'scheduled'].includes(body.status)
    ? body.status
    : 'draft';

  const candidate: Partial<SocialPost> = {
    campaignId: String(body.campaignId || ''),
    title: String(body.title || '').slice(0, 200),
    topic: String(body.topic || 'General').slice(0, 160),
    seriesName: String(body.seriesName || '').slice(0, 160),
    episodeNumber: String(body.episodeNumber || '').slice(0, 40),
    platform,
    postType,
    caption: String(body.caption || '').slice(0, 100000),
    articleText: String(body.articleText || '').slice(0, 100000),
    hashtags: String(body.hashtags || '').slice(0, 2000),
    platformTags: String(body.platformTags || '').slice(0, 2000),
    callToAction: String(body.callToAction || '').slice(0, 300),
    destinationUrl: String(body.destinationUrl || '').slice(0, 1000),
    imageUrl: String(body.imageUrl || (Array.isArray(body.mediaUrls) && body.mediaUrls[0]) || '').slice(0, 1000),
    mediaUrls: Array.isArray(body.mediaUrls)
      ? body.mediaUrls.map((u: unknown) => String(u).slice(0, 1000))
      : body.imageUrl
        ? [String(body.imageUrl).slice(0, 1000)]
        : [],
    mediaFilename: String(body.mediaFilename || '').slice(0, 260),
    mediaMimeType: String(body.mediaMimeType || ''),
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt).toISOString() : '',
    status,
  };

  const validation = validatePostInput(candidate, status === 'scheduled');
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors.join(' '), warnings: validation.warnings });
  }

  const db = await readDb();
  const now = new Date().toISOString();
  const post: SocialPost = normalizePostRecord({
    ...candidate,
    id: crypto.randomUUID(),
    isManuallyEdited: Boolean(body.isManuallyEdited ?? true),
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    facebookPostId: null,
    lastError: null,
  });

  db.posts.push(post);
  logEntry(
    db,
    'created',
    `Created ${PLATFORMS[post.platform].name} (${POST_TYPES[post.postType].name}): ${post.title || post.topic}`,
    post.id
  );
  await writeDb(db);
  res.status(201).json({ post, warnings: validation.warnings });
});

app.patch('/api/posts/:id', auth, async (req, res) => {
  const db = await readDb();
  const p = db.posts.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Post not found.' });
  if (p.status === 'published') {
    return res.status(409).json({ error: 'Published posts are locked for audit history and cannot be edited.' });
  }

  const body = req.body || {};
  if (body.platform !== undefined) p.platform = normalizePlatform(body.platform);
  if (body.postType !== undefined) p.postType = normalizePostType(body.postType, p.platform);

  const stringFields: Array<{ key: keyof SocialPost; max: number }> = [
    { key: 'campaignId', max: 120 },
    { key: 'title', max: 200 },
    { key: 'topic', max: 160 },
    { key: 'seriesName', max: 160 },
    { key: 'episodeNumber', max: 40 },
    { key: 'caption', max: 100000 },
    { key: 'articleText', max: 100000 },
    { key: 'hashtags', max: 2000 },
    { key: 'platformTags', max: 2000 },
    { key: 'callToAction', max: 300 },
    { key: 'destinationUrl', max: 1000 },
    { key: 'imageUrl', max: 1000 },
    { key: 'mediaFilename', max: 260 },
    { key: 'mediaMimeType', max: 100 },
  ];

  for (const { key, max } of stringFields) {
    if (body[key] !== undefined) {
      (p as any)[key] = String(body[key]).slice(0, max);
    }
  }

  if (Array.isArray(body.mediaUrls)) {
    p.mediaUrls = body.mediaUrls.map((u: unknown) => String(u).slice(0, 1000));
    if (p.mediaUrls.length > 0 && !body.imageUrl) {
      p.imageUrl = p.mediaUrls[0];
    } else if (p.mediaUrls.length === 0 && body.imageUrl === '') {
      p.imageUrl = '';
    }
  } else if (body.imageUrl !== undefined) {
    p.mediaUrls = p.imageUrl ? [p.imageUrl] : [];
  }

  if (body.scheduledAt !== undefined) {
    if (body.scheduledAt && Number.isNaN(Date.parse(body.scheduledAt))) {
      return res.status(400).json({ error: 'Invalid scheduled date/time.' });
    }
    p.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt).toISOString() : '';
  }

  if (body.status && ['draft', 'approved', 'scheduled', 'failed'].includes(body.status)) {
    p.status = body.status;
  }

  const validation = validatePostInput(p, p.status === 'scheduled');
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors.join(' '), warnings: validation.warnings });
  }

  p.isManuallyEdited = body.isManuallyEdited !== undefined ? Boolean(body.isManuallyEdited) : true;
  p.updatedAt = new Date().toISOString();
  p.lastError = null;

  logEntry(
    db,
    'updated',
    `Updated ${PLATFORMS[p.platform].name} post: ${p.title || p.topic}`,
    p.id
  );
  await writeDb(db);
  res.json({ post: p, warnings: validation.warnings });
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  const db = await readDb();
  const old = db.posts.find(p => p.id === req.params.id);
  if (!old) return res.status(404).json({ error: 'Post not found.' });
  if (old.status === 'published') {
    return res.status(409).json({ error: 'Published records are retained for audit history.' });
  }
  db.posts = db.posts.filter(p => p.id !== req.params.id);
  logEntry(db, 'deleted', `Deleted post: ${old.title || old.topic} (${PLATFORMS[old.platform].name})`, old.id);
  await writeDb(db);
  res.json({ ok: true });
});

app.post('/api/posts/:id/approve', auth, async (req, res) => {
  const db = await readDb();
  const p = db.posts.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Post not found.' });
  if (p.status === 'draft' || p.status === 'failed') {
    p.status = 'approved';
    p.lastError = null;
    p.updatedAt = new Date().toISOString();
  }
  logEntry(db, 'approved', `Approved post: ${p.title || p.topic} (${PLATFORMS[p.platform].name})`, p.id);
  await writeDb(db);
  res.json({ post: p });
});

// Campaigns CRUD
app.get('/api/campaigns', auth, async (_req, res) => {
  const db = await readDb();
  res.json({ campaigns: db.campaigns });
});

app.post('/api/campaigns', auth, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 160);
  const topic = String(body.topic || '').trim().slice(0, 240);
  if (!name || !topic) {
    return res.status(400).json({ error: 'Campaign name and topic are required.' });
  }

  const selectedPlatforms: PlatformId[] = Array.isArray(body.selectedPlatforms) && body.selectedPlatforms.length
    ? body.selectedPlatforms.map((p: string) => normalizePlatform(p))
    : ['facebook', 'linkedin'];

  const platformPostTypes: Partial<Record<PlatformId, PostTypeId>> = {};
  for (const plat of selectedPlatforms) {
    const requestedType = body.platformPostTypes?.[plat];
    platformPostTypes[plat] = normalizePostType(requestedType, plat);
  }

  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: crypto.randomUUID(),
    name,
    topic,
    targetAudience: String(body.targetAudience || 'Small businesses and professionals').slice(0, 240),
    businessName: String(body.businessName || 'TopTech Solutions').slice(0, 160),
    goals: String(body.goals || 'Brand awareness and qualified engagement').slice(0, 240),
    tone: String(body.tone || 'Professional, insightful, and motivating').slice(0, 160),
    startDate: String(body.startDate || now.slice(0, 10)),
    durationDays: Math.max(1, Math.min(365, Number(body.durationDays) || 7)),
    selectedPlatforms,
    platformPostTypes,
    notes: String(body.notes || '').slice(0, 2000),
    createdAt: now,
    updatedAt: now,
  };

  const db = await readDb();
  db.campaigns.unshift(campaign);
  logEntry(db, 'campaign_created', `Created campaign: ${campaign.name} (${selectedPlatforms.length} platforms)`);
  await writeDb(db);
  res.status(201).json({ campaign });
});

app.patch('/api/campaigns/:id', auth, async (req, res) => {
  const db = await readDb();
  const c = db.campaigns.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Campaign not found.' });

  const body = req.body || {};
  if (body.name !== undefined) c.name = String(body.name).slice(0, 160);
  if (body.topic !== undefined) c.topic = String(body.topic).slice(0, 240);
  if (body.targetAudience !== undefined) c.targetAudience = String(body.targetAudience).slice(0, 240);
  if (body.businessName !== undefined) c.businessName = String(body.businessName).slice(0, 160);
  if (body.goals !== undefined) c.goals = String(body.goals).slice(0, 240);
  if (body.tone !== undefined) c.tone = String(body.tone).slice(0, 160);
  if (body.startDate !== undefined) c.startDate = String(body.startDate).slice(0, 30);
  if (body.durationDays !== undefined) c.durationDays = Math.max(1, Math.min(365, Number(body.durationDays) || 7));
  if (body.notes !== undefined) c.notes = String(body.notes).slice(0, 2000);
  if (Array.isArray(body.selectedPlatforms) && body.selectedPlatforms.length) {
    c.selectedPlatforms = body.selectedPlatforms.map((p: string) => normalizePlatform(p));
  }
  if (body.platformPostTypes && typeof body.platformPostTypes === 'object') {
    for (const plat of c.selectedPlatforms) {
      c.platformPostTypes[plat] = normalizePostType(body.platformPostTypes[plat], plat);
    }
  }
  c.updatedAt = new Date().toISOString();

  logEntry(db, 'campaign_updated', `Updated campaign: ${c.name}`);
  await writeDb(db);
  res.json({ campaign: c });
});

app.delete('/api/campaigns/:id', auth, async (req, res) => {
  const db = await readDb();
  const c = db.campaigns.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Campaign not found.' });
  await createBackupSnapshot('before_campaign_delete');
  db.campaigns = db.campaigns.filter(x => x.id !== req.params.id);
  // Unlink posts rather than deleting user content to prevent data loss!
  for (const p of db.posts) {
    if (p.campaignId === req.params.id) {
      p.campaignId = '';
    }
  }
  logEntry(db, 'campaign_deleted', `Deleted campaign "${c.name}" (linked posts preserved safely)`);
  await writeDb(db);
  res.json({ ok: true });
});

// Media Upload & Media Library
app.post('/api/upload', auth, upload.single('media'), async (req, res) => {
  // Support legacy field name 'image' or new 'media'
  const file = req.file;
  if (!file) {
    return res.status(400).json({
      error: 'Upload a valid image (JPG, PNG, WEBP, GIF up to 12 MB) or video (MP4, WEBM, MOV up to 50 MB).',
    });
  }

  const spec = ALLOWED_MIMES[file.mimetype];
  if (!spec) {
    await fs.unlink(file.path).catch(() => {});
    return res.status(400).json({ error: `Unsupported media MIME type: ${file.mimetype}` });
  }

  if (spec.category === 'image' && file.size > 12 * 1024 * 1024) {
    await fs.unlink(file.path).catch(() => {});
    return res.status(400).json({ error: 'Image file size exceeds the 12 MB limit.' });
  }

  const targetFilename = `${file.filename}${spec.ext}`;
  const targetPath = path.join(UPLOAD_DIR, targetFilename);
  await fs.rename(file.path, targetPath);

  const db = await readDb();
  const asset: MediaAsset = {
    id: crypto.randomUUID(),
    filename: targetFilename,
    originalName: String(file.originalname || targetFilename).slice(0, 200),
    url: `/uploads/${targetFilename}`,
    mimeType: file.mimetype,
    category: spec.category,
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
  };
  db.media.unshift(asset);
  logEntry(db, 'media_uploaded', `Uploaded ${spec.category}: ${asset.originalName} (${Math.round(file.size / 1024)} KB)`);
  await writeDb(db);

  res.json({
    imageUrl: asset.url, // Backward compatible key
    media: asset,
  });
});

app.get('/api/media', auth, async (_req, res) => {
  const db = await readDb();
  res.json({ media: db.media });
});

app.delete('/api/media/:id', auth, async (req, res) => {
  const db = await readDb();
  const asset = db.media.find(m => m.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Media asset not found.' });

  const linkedPosts = db.posts.filter(
    p => p.imageUrl === asset.url || p.mediaUrls.includes(asset.url)
  );
  if (linkedPosts.length > 0 && req.query.force !== 'true') {
    return res.status(409).json({
      error: `This file is currently used by ${linkedPosts.length} post(s). Pass ?force=true to remove it and unlink those references.`,
      linkedPostCount: linkedPosts.length,
    });
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(asset.url));
  await fs.unlink(filePath).catch(() => {});

  db.media = db.media.filter(m => m.id !== req.params.id);
  for (const p of linkedPosts) {
    if (p.imageUrl === asset.url) p.imageUrl = '';
    p.mediaUrls = p.mediaUrls.filter(u => u !== asset.url);
  }
  logEntry(db, 'media_deleted', `Deleted media file: ${asset.originalName}`);
  await writeDb(db);
  res.json({ ok: true });
});

// ============================================================================
// FREE AI GENERATION ENGINE (Ollama Local + Eligible Free-Tier Gemini Only)
// ============================================================================
async function generateWithFreeAi(
  db: DatabaseSchema,
  prompt: string,
  systemInstruction: string,
  requestedProvider?: 'auto' | 'ollama' | 'gemini'
): Promise<{ text: string; provider: string; model: string }> {
  const pref = requestedProvider || db.settings?.preferredAiProvider || 'auto';
  if (pref === 'manual') {
    throw new Error('AI generation is set to Manual Mode in AI Provider Settings.');
  }

  const ollamaUrl = (db.settings?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(
    /\/$/,
    ''
  );
  const ollamaModel = db.settings?.ollamaModel || process.env.OLLAMA_MODEL || 'llama3.2';
  const geminiModel = db.settings?.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const errors: string[] = [];

  // 1. Try Ollama if preferred or in 'auto' mode (Ollama is 100% local & free)
  if (pref === 'ollama' || pref === 'auto') {
    const probe = await probeOllama(ollamaUrl);
    if (probe.reachable) {
      const modelToUse =
        probe.models.includes(ollamaModel) || probe.models.some(m => m.startsWith(ollamaModel))
          ? ollamaModel
          : probe.models[0] || ollamaModel;

      const r = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          system: systemInstruction,
          prompt,
          stream: false,
        }),
      });
      if (r.ok) {
        const d = (await r.json()) as { response?: string };
        const text = String(d.response || '').trim();
        if (text) {
          return { text, provider: 'Ollama (Local Free AI)', model: modelToUse };
        }
      } else {
        const errBody = await r.text().catch(() => '');
        errors.push(`Ollama (${modelToUse}) returned HTTP ${r.status}: ${errBody.slice(0, 160)}`);
      }
    } else if (pref === 'ollama') {
      throw new Error(
        probe.error ||
          `Ollama is not reachable at ${ollamaUrl}. Start Ollama locally or switch to Manual / Gemini Free-Tier.`
      );
    } else if (probe.error) {
      errors.push(probe.error);
    }
  }

  // 2. Try Google Gemini ONLY if free-tier eligible model and server API key is present
  if (pref === 'gemini' || pref === 'auto') {
    if (!hasValidGeminiKey()) {
      errors.push('GEMINI_API_KEY is not configured in server environment variables.');
    } else if (!FREE_ELIGIBLE_GEMINI_MODELS.has(geminiModel)) {
      errors.push(
        `Configured Gemini model "${geminiModel}" is blocked because only Free-Tier eligible Flash models are permitted.`
      );
    } else {
      try {
        let text = '';
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });
          const response = await ai.models.generateContent({
            model: geminiModel,
            contents: prompt,
            config: {
              systemInstruction,
            },
          });
          text = String(response.text || '').trim();
        } catch (sdkErr: any) {
          // Fallback to direct Gemini REST API via Node 20 native fetch if SDK sub-dependencies are unavailable on shared hosting
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(String(process.env.GEMINI_API_KEY || ''))}`;
          const restRes = await fetch(restUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'aistudio-build',
            },
            body: JSON.stringify({
              systemInstruction: systemInstruction
                ? { parts: [{ text: systemInstruction }] }
                : undefined,
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
            }),
          });
          const restJson = (await restRes.json()) as any;
          if (!restRes.ok) {
            throw new Error(restJson?.error?.message || sdkErr?.message || `Gemini HTTP ${restRes.status}`);
          }
          text = String(
            restJson?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
          ).trim();
        }
        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }
        return {
          text,
          provider: 'Google Gemini (Free-Tier Eligible)',
          model: geminiModel,
        };
      } catch (e: any) {
        const msg = String(e?.message || e || 'Unknown Gemini error');
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          throw new Error(
            'Gemini Free-Tier quota exhausted (HTTP 429 RESOURCE_EXHAUSTED). Wait for your free quota window to reset, use local Ollama, or create content manually.'
          );
        }
        if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
          throw new Error(
            'Gemini API key is invalid or lacks permission. Check GEMINI_API_KEY in server configuration or switch to Ollama / Manual editing.'
          );
        }
        errors.push(`Gemini (${geminiModel}) error: ${msg}`);
      }
    }
  }

  throw new Error(
    `No Free AI provider is currently available. ${errors.join(' | ')} — You can continue creating, editing, and importing all posts manually without any paid API.`
  );
}

app.post('/api/ai/caption', auth, aiLimiter, async (req, res) => {
  const {
    topic = 'Practical workflow automation',
    audience = 'Small businesses and professionals',
    tone = 'Professional and motivating',
    goal = 'Engagement and education',
    includeHashtags = true,
    language = 'English',
    platform = 'facebook',
    postType = 'image',
    length = 'medium',
    seriesName = '',
    businessName = 'TopTech Solutions',
    provider,
  } = req.body || {};

  const normPlatform = normalizePlatform(platform);
  const platformSpec = PLATFORMS[normPlatform];
  const normPostType = normalizePostType(postType, normPlatform);
  const postTypeSpec = POST_TYPES[normPostType];

  const systemInstruction = `You are a senior social media strategist and copywriter for ${businessName}.
Never fabricate statistics, client testimonials, fake discounts, or unverified claims.
Respect platform limits:
- Target Platform: ${platformSpec.name} (Max caption length: ${platformSpec.maxCaptionLength} characters)
- Post Type: ${postTypeSpec.name}
- Hashtag guidance: ${platformSpec.recommendedHashtagCount.min} to ${platformSpec.recommendedHashtagCount.max} hashtags.
- Distinct Metadata Tags: Provide platform-specific metadata tags (${platformSpec.platformTagsLabel}) separately from hashtags.
Return valid JSON matching the requested schema.`;

  const prompt = `Generate a ${normPostType} post for ${platformSpec.name}.
Brand: ${businessName}
Topic: ${topic}
Series: ${seriesName || 'Standalone'}
Target Audience: ${audience}
Language: ${language}
Tone: ${tone}
Goal: ${goal}
Desired Length: ${length}
Include Hashtags: ${includeHashtags ? 'Yes (include #TopTechSolutions)' : 'No'}

Respond ONLY with a JSON object containing these exact keys:
{
  "title": "Concise post or video title (max ${platformSpec.maxTitleLength} chars)",
  "caption": "Platform-tailored caption under ${platformSpec.maxCaptionLength} chars",
  "articleText": "Optional extended long-form article or script if length is long or postType is video/youtube_video",
  "hashtags": "Space-separated hashtags (e.g. #TopTechSolutions #Tech)",
  "platformTags": "Comma-separated platform metadata tags (${platformSpec.platformTagsLabel})",
  "callToAction": "Clear call to action phrase"
}`;

  const db = await readDb();
  try {
    const result = await generateWithFreeAi(db, prompt, systemInstruction, provider);
    let parsed: Record<string, string> = {};
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { caption: result.text };
    } catch {
      parsed = { caption: result.text };
    }

    const caption = String(parsed.caption || result.text).slice(0, platformSpec.maxCaptionLength);
    logEntry(db, 'ai_generated', `Generated ${platformSpec.name} ${postTypeSpec.name} via ${result.provider}`);
    await writeDb(db);

    return res.json({
      title: String(parsed.title || topic).slice(0, platformSpec.maxTitleLength),
      caption,
      articleText: String(parsed.articleText || ''),
      hashtags: includeHashtags ? String(parsed.hashtags || '#TopTechSolutions') : '',
      platformTags: String(parsed.platformTags || ''),
      callToAction: String(parsed.callToAction || ''),
      provider: result.provider,
      model: result.model,
    });
  } catch (e: any) {
    return res.status(503).json({ error: e.message || 'Free AI generation failed.' });
  }
});

// Multi-platform Campaign Content Generation
app.post('/api/ai/campaign-generate', auth, aiLimiter, async (req, res) => {
  const { campaignId, overwriteExisting = false, provider } = req.body || {};
  const db = await readDb();
  const campaign = db.campaigns.find(c => c.id === campaignId);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

  const platformsToGenerate = campaign.selectedPlatforms.filter(plat => {
    const existing = db.posts.find(p => p.campaignId === campaign.id && p.platform === plat);
    if (!existing) return true;
    if (existing.isManuallyEdited && !overwriteExisting) return false;
    return overwriteExisting;
  });

  if (platformsToGenerate.length === 0) {
    return res.status(400).json({
      error:
        'All selected platforms in this campaign already have manually edited posts. Enable overwrite only if you intentionally want to replace drafts.',
    });
  }

  const platformRequirements = platformsToGenerate
    .map(plat => {
      const spec = PLATFORMS[plat];
      const pType = campaign.platformPostTypes[plat] || spec.defaultPostType;
      return `- platform: "${plat}" (${spec.name}), postType: "${pType}" (${POST_TYPES[pType].name}), maxCaptionLength: ${spec.maxCaptionLength}, recommendedHashtags: ${spec.recommendedHashtagCount.min}-${spec.recommendedHashtagCount.max}, metadataTagsType: "${spec.platformTagsLabel}"`;
    })
    .join('\n');

  const systemInstruction = `You are a multi-platform social media architect for ${campaign.businessName}.
Create distinct, platform-native content for each requested social network.
Do NOT duplicate the exact same caption across LinkedIn, X, Instagram, YouTube, and Facebook.
Respect each platform's character limits, tone, hashtag norms, and separate metadata tags.
Never invent fake offers, guarantees, or statistics.`;

  const prompt = `Generate campaign posts for the following campaign:
Campaign Name: ${campaign.name}
Topic: ${campaign.topic}
Business: ${campaign.businessName}
Target Audience: ${campaign.targetAudience}
Goals: ${campaign.goals}
Tone: ${campaign.tone}

Target Platforms and Formats:
${platformRequirements}

Return ONLY a valid JSON array where each element has:
[
  {
    "platform": "facebook | instagram | linkedin | x | tiktok | youtube | threads",
    "title": "Post or video title",
    "caption": "Platform-specific caption strictly within that platform's maxCaptionLength",
    "articleText": "Extended script or article notes if applicable",
    "hashtags": "Space-separated hashtags appropriate for that platform",
    "platformTags": "Comma-separated platform metadata tags distinct from hashtags",
    "callToAction": "Platform-appropriate call to action"
  }
]`;

  try {
    const result = await generateWithFreeAi(db, prompt, systemInstruction, provider);
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain a valid JSON array of platform posts.');
    }
    const items = JSON.parse(jsonMatch[0]) as Array<Record<string, any>>;
    const createdOrUpdated: SocialPost[] = [];
    const now = new Date().toISOString();

    for (const plat of platformsToGenerate) {
      const spec = PLATFORMS[plat];
      const pType = campaign.platformPostTypes[plat] || spec.defaultPostType;
      const item = items.find(x => normalizePlatform(x.platform) === plat) || items[0] || {};

      const existing = db.posts.find(p => p.campaignId === campaign.id && p.platform === plat);
      if (existing && existing.status !== 'published') {
        existing.title = String(item.title || `${campaign.name} — ${spec.name}`).slice(0, spec.maxTitleLength);
        existing.caption = String(item.caption || campaign.topic).slice(0, spec.maxCaptionLength);
        existing.articleText = String(item.articleText || '');
        existing.hashtags = String(item.hashtags || '#TopTechSolutions');
        existing.platformTags = String(item.platformTags || '');
        existing.callToAction = String(item.callToAction || '');
        existing.postType = pType;
        existing.isManuallyEdited = false;
        existing.updatedAt = now;
        createdOrUpdated.push(existing);
      } else if (!existing) {
        const newPost = normalizePostRecord({
          id: crypto.randomUUID(),
          campaignId: campaign.id,
          title: String(item.title || `${campaign.name} — ${spec.name}`).slice(0, spec.maxTitleLength),
          topic: campaign.topic,
          seriesName: campaign.name,
          episodeNumber: '1',
          platform: plat,
          postType: pType,
          caption: String(item.caption || campaign.topic).slice(0, spec.maxCaptionLength),
          articleText: String(item.articleText || ''),
          hashtags: String(item.hashtags || '#TopTechSolutions'),
          platformTags: String(item.platformTags || ''),
          callToAction: String(item.callToAction || ''),
          destinationUrl: '',
          imageUrl: '',
          mediaUrls: [],
          mediaFilename: '',
          scheduledAt: '',
          status: 'draft',
          isManuallyEdited: false,
          createdAt: now,
          updatedAt: now,
        });
        db.posts.push(newPost);
        createdOrUpdated.push(newPost);
      }
    }

    logEntry(
      db,
      'campaign_ai_generated',
      `Generated ${createdOrUpdated.length} platform-specific posts for campaign "${campaign.name}" via ${result.provider}`
    );
    await writeDb(db);
    res.json({
      posts: createdOrUpdated,
      provider: result.provider,
      model: result.model,
    });
  } catch (e: any) {
    res.status(503).json({ error: e.message || 'Failed to generate campaign posts.' });
  }
});

// ============================================================================
// CSV BULK IMPORT, PREVIEW VALIDATION, AND EXPORT
// ============================================================================
interface CsvRowPreview {
  rowNumber: number;
  title: string;
  platform: PlatformId;
  postType: PostTypeId;
  captionPreview: string;
  hashtags: string;
  platformTags: string;
  mediaFilename: string;
  mediaUrl: string;
  mediaStatus: 'matched_in_library' | 'external_url' | 'missing_upload_separately' | 'none';
  scheduledAt: string;
  status: PostStatus;
  isDuplicateInDb: boolean;
  isDuplicateInBatch: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalizedPost: SocialPost;
}

function inspectCsvRows(
  rawRows: Record<string, any>[],
  db: DatabaseSchema,
  defaultCampaignId = ''
): CsvRowPreview[] {
  const seenKeys = new Set<string>();
  const existingKeys = new Set(
    db.posts.map(p =>
      `${p.campaignId.toLowerCase()}|${p.platform}|${p.title.trim().toLowerCase()}|${p.caption
        .trim()
        .slice(0, 120)
        .toLowerCase()}`
    )
  );

  return rawRows.map((row, idx) => {
    const rowNumber = idx + 1;
    const platform = normalizePlatform(row.platform);
    const postType = normalizePostType(row.post_type || row.postType, platform);
    const campaignId = String(row.campaign_id || row.campaignId || defaultCampaignId || '').trim();
    const title = String(row.post_title || row.title || '').trim().slice(0, 200);
    const caption = String(row.caption || row.content || row.text || row.article_text || '').trim();
    const articleText = String(row.article_text || '').trim();
    const hashtags = String(row.hashtags || '').trim();
    const platformTags = String(row.platform_tags || row.platformTags || '').trim();
    const callToAction = String(row.call_to_action || row.callToAction || '').trim();
    const destinationUrl = String(row.destination_url || row.destinationUrl || '').trim();
    const mediaFilename = String(row.media_filename || row.image_filename || '').trim();
    let mediaUrl = String(row.media_url || row.image_url || '').trim();

    // Check if mediaFilename matches an already uploaded file in db.media
    let mediaStatus: CsvRowPreview['mediaStatus'] = 'none';
    if (mediaUrl && /^https?:\/\/|^\/uploads\//i.test(mediaUrl)) {
      mediaStatus = mediaUrl.startsWith('/uploads/') ? 'matched_in_library' : 'external_url';
    } else if (mediaFilename) {
      const matched = db.media.find(
        m =>
          m.originalName.toLowerCase() === mediaFilename.toLowerCase() ||
          m.filename.toLowerCase() === mediaFilename.toLowerCase()
      );
      if (matched) {
        mediaUrl = matched.url;
        mediaStatus = 'matched_in_library';
      } else {
        mediaStatus = 'missing_upload_separately';
      }
    }

    const rawDate = String(row.scheduled_at || row.scheduled_date || row.publish_at || '').trim();
    let scheduledAt = '';
    const dateInvalid = Boolean(rawDate && Number.isNaN(Date.parse(rawDate)));
    if (rawDate && !dateInvalid) {
      scheduledAt = new Date(rawDate).toISOString();
    }

    // Always import as draft or approved; never silently mark published
    const rawStatus = String(row.status || 'draft').trim().toLowerCase();
    const status: PostStatus = rawStatus === 'approved' ? 'approved' : 'draft';

    const now = new Date().toISOString();
    const normalizedPost = normalizePostRecord({
      id: crypto.randomUUID(),
      campaignId,
      title,
      topic: String(row.topic || row.series_name || 'CSV Bulk Import').slice(0, 160),
      seriesName: String(row.series_name || '').slice(0, 160),
      episodeNumber: String(row.episode_number || '').slice(0, 40),
      platform,
      postType,
      caption,
      articleText,
      hashtags,
      platformTags,
      callToAction,
      destinationUrl,
      imageUrl: mediaUrl,
      mediaUrls: mediaUrl ? [mediaUrl] : [],
      mediaFilename,
      scheduledAt,
      status,
      isManuallyEdited: true,
      createdAt: now,
      updatedAt: now,
    });

    const validation = validatePostInput(normalizedPost, false);
    if (dateInvalid) {
      validation.errors.push(`Invalid date format in scheduled_at: "${rawDate}".`);
      validation.valid = false;
    }

    const dedupeKey = `${campaignId.toLowerCase()}|${platform}|${title.toLowerCase()}|${caption
      .slice(0, 120)
      .toLowerCase()}`;
    const isDuplicateInDb = Boolean(caption && existingKeys.has(dedupeKey));
    const isDuplicateInBatch = Boolean(caption && seenKeys.has(dedupeKey));
    if (caption) seenKeys.add(dedupeKey);

    if (isDuplicateInDb) {
      validation.warnings.push('Identical post (same campaign, platform, title, and caption) already exists in database.');
    }
    if (isDuplicateInBatch) {
      validation.warnings.push('Duplicate row detected within this CSV file.');
    }

    return {
      rowNumber,
      title: title || '(Untitled)',
      platform,
      postType,
      captionPreview: caption.slice(0, 140),
      hashtags,
      platformTags,
      mediaFilename,
      mediaUrl,
      mediaStatus,
      scheduledAt,
      status,
      isDuplicateInDb,
      isDuplicateInBatch,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      normalizedPost,
    };
  });
}

app.post('/api/import/csv/validate', auth, async (req, res) => {
  const { csvText, rows, campaignId = '' } = req.body || {};
  const parsedRows: Record<string, any>[] =
    typeof csvText === 'string' && csvText.trim()
      ? parseCsvText(csvText)
      : Array.isArray(rows)
        ? rows
        : [];

  if (!parsedRows.length) {
    return res.status(400).json({ error: 'No valid CSV rows found. Ensure your file has a header row and at least one data row.' });
  }
  if (parsedRows.length > 500) {
    return res.status(400).json({ error: 'CSV import is limited to 500 rows per batch.' });
  }

  const db = await readDb();
  const previews = inspectCsvRows(parsedRows, db, campaignId);

  res.json({
    totalRows: previews.length,
    validRows: previews.filter(r => r.valid).length,
    invalidRows: previews.filter(r => !r.valid).length,
    duplicateRows: previews.filter(r => r.isDuplicateInDb || r.isDuplicateInBatch).length,
    missingMediaRows: previews.filter(r => r.mediaStatus === 'missing_upload_separately').length,
    rows: previews,
  });
});

app.post('/api/import/csv', auth, async (req, res) => {
  const { csvText, rows, campaignId = '', skipDuplicates = true } = req.body || {};
  const parsedRows: Record<string, any>[] =
    typeof csvText === 'string' && csvText.trim()
      ? parseCsvText(csvText)
      : Array.isArray(rows)
        ? rows
        : [];

  if (!parsedRows.length) return res.status(400).json({ error: 'No CSV rows received.' });
  if (parsedRows.length > 500) return res.status(400).json({ error: 'Import is limited to 500 rows per batch.' });

  const db = await readDb();
  await createBackupSnapshot('before_csv_import');

  const previews = inspectCsvRows(parsedRows, db, campaignId);
  const created: SocialPost[] = [];
  const rejected: Array<{ rowNumber: number; reason: string }> = [];

  for (const item of previews) {
    if (!item.valid) {
      rejected.push({ rowNumber: item.rowNumber, reason: item.errors.join('; ') });
      continue;
    }
    if (skipDuplicates && (item.isDuplicateInDb || item.isDuplicateInBatch)) {
      rejected.push({ rowNumber: item.rowNumber, reason: 'Skipped duplicate post (idempotent import).' });
      continue;
    }
    db.posts.push(item.normalizedPost);
    created.push(item.normalizedPost);
  }

  logEntry(
    db,
    'bulk_import',
    `Imported ${created.length} platform posts as drafts (${rejected.length} skipped/rejected)`,
    null
  );
  await writeDb(db);

  res.json({
    imported: created.length,
    skipped: rejected.length,
    rejectedDetails: rejected,
    importedIds: created.map(p => p.id),
    message: `Imported ${created.length} post(s) as drafts. ${
      rejected.length ? `${rejected.length} row(s) skipped.` : 'All rows validated.'
    }`,
  });
});

app.get('/api/export/csv', auth, async (req, res) => {
  const db = await readDb();
  const campaignId = typeof req.query.campaignId === 'string' ? req.query.campaignId : '';
  const targetPosts = campaignId ? db.posts.filter(p => p.campaignId === campaignId) : db.posts;
  const csv = serializePostsToCsv(targetPosts);
  const filename = campaignId
    ? `toptech-campaign-${campaignId.slice(0, 12)}.csv`
    : 'toptech-social-posts.csv';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
});

// ============================================================================
// BULK SCHEDULING
// ============================================================================
app.post('/api/posts/bulk-schedule', auth, async (req, res) => {
  const {
    ids,
    startAt,
    cadence = 'daily',
    timeGapHours = 24,
    platformStaggerMinutes = 30,
  } = req.body || {};

  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'Select at least one post to schedule.' });
  }
  if (!startAt || Number.isNaN(Date.parse(startAt))) {
    return res.status(400).json({ error: 'Choose a valid schedule start date and time.' });
  }
  if (ids.length > 500) {
    return res.status(400).json({ error: 'Scheduling is limited to 500 posts per batch.' });
  }

  const allowedCadences = ['daily', 'three-weekly', 'weekly', 'custom-hours', 'platform-staggered'];
  if (!allowedCadences.includes(cadence)) {
    return res.status(400).json({ error: 'Invalid scheduling cadence.' });
  }

  const db = await readDb();
  const intervalMs =
    cadence === 'daily'
      ? 24 * 3600_000
      : cadence === 'three-weekly'
        ? 8 * 3600_000
        : cadence === 'weekly'
          ? 168 * 3600_000
          : cadence === 'platform-staggered'
            ? Math.max(5, Math.min(1440, Number(platformStaggerMinutes) || 30)) * 60_000
            : Math.max(1, Math.min(720, Number(timeGapHours) || 24)) * 3600_000;

  let cursor = Date.parse(startAt);
  let updated = 0;
  const skippedReasons: Array<{ id: string; title: string; reason: string }> = [];

  for (const id of ids) {
    const post = db.posts.find(p => p.id === id);
    if (!post) {
      skippedReasons.push({ id, title: id, reason: 'Post not found' });
      continue;
    }
    if (post.status === 'published') {
      skippedReasons.push({ id, title: post.title || post.topic, reason: 'Already published' });
      continue;
    }

    const candidateSchedule = new Date(cursor).toISOString();
    const check = validatePostInput({ ...post, scheduledAt: candidateSchedule, status: 'scheduled' }, true);
    if (!check.valid) {
      skippedReasons.push({
        id,
        title: post.title || post.topic,
        reason: check.errors.join(' '),
      });
      continue;
    }

    post.scheduledAt = candidateSchedule;
    post.status = 'scheduled';
    post.lastError = null;
    post.updatedAt = new Date().toISOString();
    cursor += intervalMs;
    updated++;
  }

  logEntry(
    db,
    'bulk_schedule',
    `Scheduled ${updated} post(s) using ${cadence} cadence (${skippedReasons.length} skipped due to validation)`,
    null
  );
  await writeDb(db);

  res.json({
    scheduled: updated,
    skipped: skippedReasons.length,
    skippedDetails: skippedReasons,
    message: `${updated} post(s) scheduled.${
      skippedReasons.length
        ? ` ${skippedReasons.length} post(s) remained drafts because required media or fields were missing.`
        : ''
    }`,
  });
});

// Master Prompt Builder endpoint (preserved & upgraded for multi-platform CSV)
app.get('/api/prompts/master', auth, (_req, res) => {
  res.json({
    prompt: `TOPTECH SOCIAL STUDIO v2.0 — MULTI-PLATFORM CAMPAIGN & CSV MASTER PROMPT

Act as a senior social media strategist, researcher, and copywriter for [BRAND].
Campaign Name: [CAMPAIGN_NAME]
Series / Topic: [TOPIC]
Target Audience: [AUDIENCE]
Language: [LANGUAGE]
Number of items: [COUNT]
Target Platforms: [FACEBOOK / INSTAGRAM / LINKEDIN / X / TIKTOK / YOUTUBE / THREADS]
Post Types: [IMAGE / VIDEO / TEXT / CAROUSEL / REEL / STORY / LINK / YOUTUBE_VIDEO]
Tone: [TONE]
Schedule Start: [DATE] | Cadence: [DAILY / WEEKLY / CUSTOM]

For every platform-specific row, output a strict UTF-8 CSV table with these exact headers:
campaign_id,post_title,topic,series_name,episode_number,platform,post_type,caption,article_text,hashtags,platform_tags,call_to_action,destination_url,media_filename,media_url,scheduled_at,status

Rules:
1. Use one row per platform-specific post.
2. Respect platform character limits (X <= 280 chars, Threads <= 500 chars, Instagram <= 2,200 chars, LinkedIn <= 3,000 chars, TikTok <= 4,000 chars, YouTube description <= 5,000 chars).
3. Keep hashtags (e.g., #TopTechSolutions) separate from platform_tags (e.g., YouTube comma-separated search tags or Threads topic tag).
4. Set status to "draft" for human review. Never fabricate statistics, client testimonials, or guarantees.`,
  });
});

// ============================================================================
// FACEBOOK PAGE PUBLISHING (META GRAPH API — SERVER-SIDE CREDENTIALS ONLY)
// ============================================================================
app.post('/api/facebook/test', auth, async (_req, res) => {
  const db = await readDb();
  const creds = getEffectiveMetaCredentials(db);
  if (!creds.metaConfigured) {
    return res.status(503).json({
      error:
        'Missing credentials: Configure or auto-discover META_PAGE_ID and META_PAGE_ACCESS_TOKEN in the Login Info tab or server .env first.',
    });
  }
  try {
    const u = new URL(`https://graph.facebook.com/${creds.graphVersion}/${creds.pageId}`);
    u.searchParams.set('fields', 'id,name,category,fan_count');
    u.searchParams.set('access_token', creds.accessToken);
    const r = await fetch(u);
    const d = (await r.json()) as Record<string, any>;
    if (!r.ok) {
      const code = d.error?.code;
      const hint =
        code === 190
          ? ' (Token expired or invalid — generate a fresh Page Access Token in Meta for Developers).'
          : code === 10 || code === 200
            ? ' (Missing Page permissions — ensure pages_read_engagement and pages_manage_posts are granted).'
            : '';
      return res.status(502).json({ error: `${d.error?.message || 'Meta API check failed.'}${hint}` });
    }
    db.settings = db.settings || {};
    db.settings.metaPageId = String(d.id || creds.pageId);
    db.settings.metaPageName = String(d.name || '');
    db.settings.metaPageCategory = String(d.category || 'Facebook Page');
    await writeDb(db);
    res.json({
      ok: true,
      page: {
        id: d.id,
        name: d.name,
        category: d.category || 'Facebook Page',
      },
    });
  } catch (e: any) {
    res.status(502).json({ error: `Meta Graph API connection failed: ${e.message}` });
  }
});

async function publishFacebookPost(
  post: SocialPost,
  db: DatabaseSchema
): Promise<{ id?: string; post_id?: string }> {
  if (post.platform !== 'facebook') {
    throw new Error(
      `Direct API publishing is only implemented for Facebook Pages. "${
        PLATFORMS[post.platform].name
      }" is configured for content planning, scheduling, and CSV export only.`
    );
  }
  const creds = getEffectiveMetaCredentials(db);
  if (!creds.metaConfigured) {
    throw new Error('Meta Page ID or Page Access Token is missing in Login Info / server environment.');
  }

  const validation = validatePostInput(post, true);
  if (!validation.valid) {
    throw new Error(`Post failed pre-publish validation: ${validation.errors.join(' ')}`);
  }

  const base = `https://graph.facebook.com/${creds.graphVersion}/${creds.pageId}`;
  const fullMessage = [
    post.caption.trim(),
    post.callToAction ? `\n\n${post.callToAction}` : '',
    post.destinationUrl && post.postType !== 'link' ? `\n${post.destinationUrl}` : '',
    post.hashtags ? `\n\n${post.hashtags.trim()}` : '',
  ]
    .join('')
    .trim();

  const form = new FormData();
  form.set('access_token', creds.accessToken);

  let endpoint = `${base}/feed`;
  const primaryMedia = post.imageUrl || post.mediaUrls[0] || '';

  if (post.postType === 'link' && post.destinationUrl && !primaryMedia) {
    form.set('message', fullMessage);
    form.set('link', post.destinationUrl);
    endpoint = `${base}/feed`;
  } else if (primaryMedia) {
    const isVideo =
      /\.(mp4|webm|mov)$/i.test(primaryMedia) ||
      post.postType === 'video' ||
      post.postType === 'reel';

    const localFile = primaryMedia.startsWith('/uploads/')
      ? path.join(UPLOAD_DIR, path.basename(primaryMedia))
      : null;

    if (localFile) {
      const buf = await fs.readFile(localFile);
      const ext = path.extname(localFile).toLowerCase();
      if (isVideo) {
        const mime = ext === '.webm' ? 'video/webm' : ext === '.mov' ? 'video/quicktime' : 'video/mp4';
        form.set('description', fullMessage);
        if (post.title) form.set('title', post.title);
        form.set('source', new Blob([buf], { type: mime }), path.basename(localFile));
        endpoint = `${base}/videos`;
      } else {
        const mime =
          ext === '.png'
            ? 'image/png'
            : ext === '.webp'
              ? 'image/webp'
              : ext === '.gif'
                ? 'image/gif'
                : 'image/jpeg';
        form.set('message', fullMessage);
        form.set('source', new Blob([buf], { type: mime }), path.basename(localFile));
        endpoint = `${base}/photos`;
      }
    } else {
      if (isVideo) {
        form.set('description', fullMessage);
        if (post.title) form.set('title', post.title);
        form.set('file_url', primaryMedia);
        endpoint = `${base}/videos`;
      } else {
        form.set('message', fullMessage);
        form.set('url', primaryMedia);
        endpoint = `${base}/photos`;
      }
    }
  } else {
    form.set('message', fullMessage);
    endpoint = `${base}/feed`;
  }

  const r = await fetch(endpoint, { method: 'POST', body: form });
  const data = (await r.json()) as Record<string, any>;
  if (!r.ok) {
    throw new Error(data?.error?.message || `Facebook Graph API error (HTTP ${r.status}).`);
  }
  return data;
}

app.post('/api/posts/:id/publish-now', auth, async (req, res) => {
  const db = await readDb();
  const creds = getEffectiveMetaCredentials(db);
  if (!creds.publishingEnabled) {
    return res.status(403).json({
      error:
        'Facebook publishing is disabled by default for safety. Enable ENABLE_FACEBOOK_PUBLISHING in the Login Info tab or server .env after verifying your Meta Page connection.',
    });
  }

  const p = db.posts.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Post not found.' });
  if (p.platform !== 'facebook') {
    return res.status(400).json({
      error: `Only Facebook Page posts can be published directly via Graph API. This post targets ${
        PLATFORMS[p.platform].name
      }.`,
    });
  }
  if (p.status === 'published' || p.facebookPostId) {
    return res.status(409).json({
      error: `This post was already published (Facebook ID: ${p.facebookPostId || 'recorded'}). Duplicate publication prevented.`,
    });
  }
  if (inFlightPublishIds.has(p.id)) {
    return res.status(409).json({ error: 'Publication is already in progress for this post.' });
  }

  inFlightPublishIds.add(p.id);
  try {
    const result = await publishFacebookPost(p, db);
    p.status = 'published';
    p.publishedAt = new Date().toISOString();
    p.updatedAt = p.publishedAt;
    p.facebookPostId = result.id || result.post_id || `fb-${Date.now()}`;
    p.lastError = null;
    logEntry(db, 'published', `Published to Facebook Page: ${p.title || p.topic}`, p.id);
    await writeDb(db);
    res.json({ ok: true, post: p });
  } catch (e: any) {
    p.status = 'failed';
    p.lastError = e.message;
    p.updatedAt = new Date().toISOString();
    logEntry(db, 'error', `Facebook publish failed: ${e.message}`, p.id);
    await writeDb(db);
    res.status(502).json({ error: e.message, post: p });
  } finally {
    inFlightPublishIds.delete(p.id);
  }
});

// ============================================================================
// DATA BACKUPS & RECOVERY ENDPOINTS
// ============================================================================
app.get('/api/export', auth, async (_req, res) => {
  const db = await readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="toptech-social-backup.json"');
  res.send(JSON.stringify(db, null, 2));
});

app.get('/api/backups', auth, async (_req, res) => {
  try {
    const files = (await fs.readdir(BACKUP_DIR))
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    const items = await Promise.all(
      files.map(async filename => {
        const stat = await fs.stat(path.join(BACKUP_DIR, filename));
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
    );
    res.json({ backups: items });
  } catch {
    res.json({ backups: [] });
  }
});

app.post('/api/backups', auth, async (_req, res) => {
  const filename = await createBackupSnapshot('manual_snapshot');
  const db = await readDb();
  logEntry(db, 'backup_created', `Created manual data snapshot: ${filename}`);
  await writeDb(db);
  res.json({ ok: true, filename });
});

app.post('/api/backups/:filename/restore', auth, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const target = path.join(BACKUP_DIR, filename);
  try {
    const raw = await fs.readFile(target, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.posts)) {
      return res.status(400).json({ error: 'Invalid backup file structure.' });
    }
    await createBackupSnapshot('before_restore');
    await fs.writeFile(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    const db = await readDb();
    logEntry(db, 'backup_restored', `Restored database from backup: ${filename}`);
    await writeDb(db);
    res.json({ ok: true, message: `Restored ${db.posts.length} posts from ${filename}.` });
  } catch (e: any) {
    res.status(404).json({ error: `Could not restore backup: ${e.message}` });
  }
});

// ============================================================================
// BACKGROUND SCHEDULER (WITH DUPLICATE-PUBLISH LOCK PROTECTION)
// ============================================================================
let schedulerBusy = false;
async function schedulerTick() {
  if (schedulerBusy) return;
  schedulerBusy = true;
  try {
    const db = await readDb();
    const creds = getEffectiveMetaCredentials(db);
    if (!creds.autoPublishEnabled || !creds.publishingEnabled || !creds.metaConfigured) {
      return;
    }
    const now = Date.now();
    const due = db.posts
      .filter(
        p =>
          p.platform === 'facebook' &&
          p.status === 'scheduled' &&
          !p.facebookPostId &&
          !inFlightPublishIds.has(p.id) &&
          p.scheduledAt &&
          Date.parse(p.scheduledAt) <= now
      )
      .slice(0, 5);

    for (const p of due) {
      inFlightPublishIds.add(p.id);
      try {
        const result = await publishFacebookPost(p, db);
        p.status = 'published';
        p.publishedAt = new Date().toISOString();
        p.updatedAt = p.publishedAt;
        p.facebookPostId = result.id || result.post_id || `fb-${Date.now()}`;
        p.lastError = null;
        logEntry(db, 'published', `Auto-published to Facebook Page: ${p.title || p.topic}`, p.id);
      } catch (e: any) {
        p.status = 'failed';
        p.lastError = e.message;
        p.updatedAt = new Date().toISOString();
        logEntry(db, 'error', `Auto-publish failed: ${e.message}`, p.id);
      } finally {
        inFlightPublishIds.delete(p.id);
      }
    }
    if (due.length) await writeDb(db);
  } catch (e: any) {
    console.error('Scheduler error:', e.message);
  } finally {
    schedulerBusy = false;
  }
}
setInterval(schedulerTick, 30_000).unref();

// ============================================================================
// FRONTEND SERVING (VITE DEV SERVER OR PRODUCTION DIST/)
// ============================================================================
const hasBuiltDist = fsSync.existsSync(path.join(DIST_DIR, 'index.html'));
const useViteDevServer =
  process.env.VITE_DEV_SERVER === 'true' ||
  (process.env.NODE_ENV !== 'production' && !hasBuiltDist);

if (!useViteDevServer) {
  app.use(express.static(DIST_DIR));
  app.use(express.static(PUBLIC_DIR));
  // Express 4 & Express 5 compatible SPA catch-all middleware (avoids path-to-regexp '*' crash on Express 5)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fsSync.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res
      .status(200)
      .send('TopTech Social Studio server is running. Run npm run build to generate dist/index.html.');
  });
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err?.message || 'Unexpected server error.' });
});

if (useViteDevServer) {
  import('vite')
    .then(async ({ createServer: createViteServer }) => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      app.listen(PORT, () => {
        console.log(`TopTech Social Studio v2.0 (dev) listening on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to start Vite dev server:', err);
    });
} else {
  // Synchronous listen on first tick for Hostinger Node.js 20 Express / LiteSpeed (lsnode.js) & Passenger
  app.listen(PORT, () => {
    console.log(`TopTech Social Studio v2.0 listening on port ${PORT}`);
  });
}

export default app;
