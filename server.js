var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server-app.ts
var server_app_exports = {};
__export(server_app_exports, {
  default: () => server_app_default
});
module.exports = __toCommonJS(server_app_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"));
var import_multer = __toESM(require("multer"));
var import_promises = __toESM(require("node:fs/promises"));
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var import_node_crypto = __toESM(require("node:crypto"));

// src/shared/platforms.ts
var POST_TYPES = {
  image: {
    id: "image",
    name: "Image Post with Caption",
    description: "Single static image (JPG, PNG, WEBP, GIF) paired with platform caption and hashtags.",
    requiresMedia: true,
    allowedMediaCategories: ["image"],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false
  },
  video: {
    id: "video",
    name: "Video Post with Caption",
    description: "Standard feed video (MP4, WEBM, MOV) paired with caption and metadata tags.",
    requiresMedia: true,
    allowedMediaCategories: ["video"],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false
  },
  text: {
    id: "text",
    name: "Text-Only Post",
    description: "Pure text update, thought-leadership post, thread starter, or long-form article.",
    requiresMedia: false,
    allowedMediaCategories: ["image", "video"],
    maxMediaFiles: 0,
    requiresTitle: false,
    requiresDestinationUrl: false
  },
  carousel: {
    id: "carousel",
    name: "Multi-Image Carousel",
    description: "2 to 10 swipeable images with a unified caption and call to action.",
    requiresMedia: true,
    allowedMediaCategories: ["image"],
    maxMediaFiles: 10,
    requiresTitle: false,
    requiresDestinationUrl: false
  },
  reel: {
    id: "reel",
    name: "Reel / Short-Form Video",
    description: "Vertical 9:16 short-form video (Reels, TikTok, YouTube Shorts).",
    requiresMedia: true,
    allowedMediaCategories: ["video"],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false
  },
  story: {
    id: "story",
    name: "24-Hour Story",
    description: "Vertical ephemeral image or short video story asset.",
    requiresMedia: true,
    allowedMediaCategories: ["image", "video"],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false
  },
  link: {
    id: "link",
    name: "Link Preview Post",
    description: "Post sharing an external article or landing page URL with commentary.",
    requiresMedia: false,
    allowedMediaCategories: ["image"],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: true
  },
  youtube_video: {
    id: "youtube_video",
    name: "YouTube Video (Title, Description & Tags)",
    description: "Full YouTube video package requiring video title, structured description, and search tags.",
    requiresMedia: true,
    allowedMediaCategories: ["video"],
    maxMediaFiles: 1,
    requiresTitle: true,
    requiresDestinationUrl: false
  }
};
var PLATFORMS = {
  facebook: {
    id: "facebook",
    name: "Facebook Page",
    handlePrefix: "fb.com/",
    supportedPostTypes: ["image", "video", "text", "carousel", "reel", "story", "link"],
    defaultPostType: "image",
    maxCaptionLength: 63206,
    maxTitleLength: 160,
    recommendedHashtagCount: { min: 2, max: 5 },
    supportsPlatformTags: true,
    platformTagsLabel: "Collaborator / Page Mentions & Topic Tags",
    platformTagsPlaceholder: "@TopTechSolutions, Digital Transformation, SME Growth",
    publishingSupport: "server_graph_api",
    publishingDescription: "Direct publishing supported via Meta Graph API when META_PAGE_ID, META_PAGE_ACCESS_TOKEN, and ENABLE_FACEBOOK_PUBLISHING=true are configured.",
    mediaRequirementsNote: "Images: JPG/PNG/WEBP/GIF up to 12 MB. Videos: MP4/MOV up to 50 MB."
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    handlePrefix: "@",
    supportedPostTypes: ["image", "video", "carousel", "reel", "story"],
    defaultPostType: "image",
    maxCaptionLength: 2200,
    maxTitleLength: 120,
    recommendedHashtagCount: { min: 3, max: 15 },
    supportsPlatformTags: true,
    platformTagsLabel: "Account Tags, Alt Text & Location Metadata",
    platformTagsPlaceholder: "@toptech.pk, Alt: Developer workspace, Location: Karachi",
    publishingSupport: "planning_and_export_only",
    publishingDescription: "Content creation, media staging, campaign scheduling, and CSV export supported. Direct Instagram Graph API publishing is not connected in this build.",
    mediaRequirementsNote: "Requires visual media (image, carousel, reel, or story). Text-only posts are not supported on Instagram."
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    handlePrefix: "in/",
    supportedPostTypes: ["text", "image", "video", "carousel", "link"],
    defaultPostType: "text",
    maxCaptionLength: 3e3,
    maxTitleLength: 150,
    recommendedHashtagCount: { min: 3, max: 5 },
    supportsPlatformTags: true,
    platformTagsLabel: "Company Mentions & Industry Categories",
    platformTagsPlaceholder: "@TopTech Solutions, B2B SaaS, Enterprise AI",
    publishingSupport: "planning_and_export_only",
    publishingDescription: "Content creation, campaign scheduling, and CSV export supported. Direct LinkedIn OAuth API publishing is not connected in this build.",
    mediaRequirementsNote: "Supports professional text posts, single image, video, multi-image carousel, or external article link."
  },
  x: {
    id: "x",
    name: "X (Twitter)",
    handlePrefix: "@",
    supportedPostTypes: ["text", "image", "video", "link"],
    defaultPostType: "text",
    maxCaptionLength: 280,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 1, max: 2 },
    supportsPlatformTags: true,
    platformTagsLabel: "Mentioned Handles & List Context",
    platformTagsPlaceholder: "@TopTechPK",
    publishingSupport: "planning_and_export_only",
    publishingDescription: "Content creation, character validation (280 chars), scheduling, and CSV export supported. Direct X API publishing is not connected in this build.",
    mediaRequirementsNote: "Standard X limit is 280 characters including hashtags. Supports up to 1 image or video attachment."
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    handlePrefix: "@",
    supportedPostTypes: ["reel", "video", "image", "carousel", "story"],
    defaultPostType: "reel",
    maxCaptionLength: 4e3,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 3, max: 6 },
    supportsPlatformTags: true,
    platformTagsLabel: "Sound Reference, Cover Text & Categorization",
    platformTagsPlaceholder: "Cover: 3 AI Tools for SMEs, Category: Tech Education",
    publishingSupport: "planning_and_export_only",
    publishingDescription: "Script/caption creation, video staging, scheduling, and CSV export supported. Direct TikTok Content Posting API is not connected in this build.",
    mediaRequirementsNote: "Requires short-form video (9:16 vertical MP4/MOV) or photo mode image/carousel."
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    handlePrefix: "youtube.com/@",
    supportedPostTypes: ["youtube_video", "reel"],
    defaultPostType: "youtube_video",
    maxCaptionLength: 5e3,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 3, max: 5 },
    supportsPlatformTags: true,
    platformTagsLabel: "YouTube Search Tags (comma-separated metadata tags)",
    platformTagsPlaceholder: "toptech solutions, software tutorial, ai automation, pakistan tech",
    publishingSupport: "planning_and_export_only",
    publishingDescription: "Title, 5,000-char description, search tags, video staging, and CSV export supported. Direct YouTube Data API v3 upload is not connected in this build.",
    mediaRequirementsNote: "Requires a title (max 100 chars), description (max 5,000 chars), comma-separated video search tags, and a video file before scheduling."
  },
  threads: {
    id: "threads",
    name: "Threads",
    handlePrefix: "@",
    supportedPostTypes: ["text", "image", "video", "link"],
    defaultPostType: "text",
    maxCaptionLength: 500,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 1, max: 1 },
    supportsPlatformTags: true,
    platformTagsLabel: "Threads Topic Tag (1 topic tag supported on Threads)",
    platformTagsPlaceholder: "Tech Threads",
    publishingSupport: "planning_and_export_only",
    publishingDescription: "500-character validation, topic tag configuration, scheduling, and CSV export supported. Direct Threads API publishing is not connected in this build.",
    mediaRequirementsNote: "Maximum 500 characters per post. Threads uses a single topic tag rather than long hashtag blocks."
  }
};
var PLATFORM_LIST = Object.values(PLATFORMS);
var POST_TYPE_LIST = Object.values(POST_TYPES);
function normalizePlatform(raw) {
  const clean = String(raw || "facebook").trim().toLowerCase();
  if (clean === "twitter" || clean === "x (twitter)" || clean === "x") return "x";
  if (clean === "fb" || clean === "facebook page") return "facebook";
  if (clean === "ig") return "instagram";
  if (clean === "yt" || clean === "youtube shorts") return "youtube";
  if (clean in PLATFORMS) return clean;
  return "facebook";
}
function normalizePostType(raw, platform) {
  const spec = PLATFORMS[platform] || PLATFORMS.facebook;
  const clean = String(raw || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map = {
    image: "image",
    image_post: "image",
    photo: "image",
    video: "video",
    video_post: "video",
    text: "text",
    text_only: "text",
    article: "text",
    carousel: "carousel",
    multi_image: "carousel",
    reel: "reel",
    short: "reel",
    shorts: "reel",
    short_video: "reel",
    story: "story",
    link: "link",
    link_post: "link",
    youtube_video: "youtube_video",
    youtube: "youtube_video"
  };
  const candidate = map[clean];
  if (candidate && spec.supportedPostTypes.includes(candidate)) {
    return candidate;
  }
  return spec.defaultPostType;
}
function validatePostInput(input, requireReadyForSchedule = false) {
  const errors = [];
  const warnings = [];
  const platform = normalizePlatform(input.platform);
  const platformSpec = PLATFORMS[platform];
  const postType = input.postType && POST_TYPES[input.postType] ? input.postType : platformSpec.defaultPostType;
  const postTypeSpec = POST_TYPES[postType];
  if (!platformSpec.supportedPostTypes.includes(postType)) {
    errors.push(
      `Post type "${postTypeSpec.name}" is not supported on ${platformSpec.name}. Supported types: ${platformSpec.supportedPostTypes.map((t) => POST_TYPES[t].name).join(", ")}.`
    );
  }
  const caption = String(input.caption || "").trim();
  const articleText = String(input.articleText || "").trim();
  if (!caption && !articleText) {
    errors.push("Caption or post text is required.");
  }
  const hashtags = String(input.hashtags || "").trim();
  const combinedLength = caption.length + (hashtags ? hashtags.length + 2 : 0);
  if (caption.length > platformSpec.maxCaptionLength) {
    errors.push(
      `${platformSpec.name} caption exceeds the maximum length of ${platformSpec.maxCaptionLength.toLocaleString()} characters (currently ${caption.length.toLocaleString()} characters). Keep long-form text in the Article field or shorten the platform caption.`
    );
  } else if (combinedLength > platformSpec.maxCaptionLength) {
    warnings.push(
      `Combined caption + hashtags (${combinedLength.toLocaleString()} chars) exceeds ${platformSpec.name}'s ${platformSpec.maxCaptionLength.toLocaleString()}-character limit.`
    );
  }
  const title = String(input.title || "").trim();
  if (postTypeSpec.requiresTitle && !title) {
    errors.push(`${postTypeSpec.name} requires a post/video title.`);
  }
  if (title && title.length > platformSpec.maxTitleLength) {
    warnings.push(
      `Title length (${title.length} chars) exceeds ${platformSpec.name}'s recommended ${platformSpec.maxTitleLength} characters.`
    );
  }
  const destinationUrl = String(input.destinationUrl || "").trim();
  if (postTypeSpec.requiresDestinationUrl && !destinationUrl) {
    errors.push(`${postTypeSpec.name} requires a valid destination link URL.`);
  }
  if (destinationUrl && !/^https?:\/\/.+/i.test(destinationUrl)) {
    errors.push("Destination URL must start with http:// or https://.");
  }
  const primaryMedia = String(input.imageUrl || input.mediaUrls && input.mediaUrls[0] || "").trim();
  const mediaFilename = String(input.mediaFilename || "").trim();
  if (postTypeSpec.requiresMedia) {
    if (!primaryMedia && requireReadyForSchedule) {
      errors.push(
        `${postTypeSpec.name} on ${platformSpec.name} requires an uploaded or linked media file (${postTypeSpec.allowedMediaCategories.join("/")}) before scheduling or publishing.`
      );
    } else if (!primaryMedia) {
      warnings.push(
        mediaFilename ? `Referenced media file "${mediaFilename}" is not yet attached in /uploads/. Upload or assign it before scheduling.` : `No media attached yet for ${postTypeSpec.name}. You can save as a draft and attach media later.`
      );
    }
  }
  if (postType === "carousel") {
    const urls = Array.isArray(input.mediaUrls) && input.mediaUrls.length ? input.mediaUrls : primaryMedia ? [primaryMedia] : [];
    if (requireReadyForSchedule && urls.length < 2) {
      warnings.push("Multi-image carousel posts typically require at least 2 images.");
    }
  }
  if (platform === "youtube" && !String(input.platformTags || "").trim()) {
    warnings.push("YouTube videos perform better with comma-separated search metadata tags.");
  }
  if (input.scheduledAt) {
    const parsed = Date.parse(input.scheduledAt);
    if (Number.isNaN(parsed)) {
      errors.push("Invalid scheduled date/time format.");
    }
  } else if (input.status === "scheduled" || requireReadyForSchedule) {
    errors.push('A valid scheduled date and time is required when status is "scheduled".');
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function parseCsvText(csvText) {
  const cleaned = csvText.replace(/^\uFEFF/, "");
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (ch === "\r" && next === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += ch;
      }
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  if (nonEmptyRows.length < 2) return [];
  const headers = nonEmptyRows[0].map(
    (h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_")
  );
  const result = [];
  for (let r = 1; r < nonEmptyRows.length; r++) {
    const values = nonEmptyRows[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (key) {
        obj[key] = (values[c] ?? "").trim();
      }
    }
    result.push(obj);
  }
  return result;
}
function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
function serializePostsToCsv(posts) {
  const headers = [
    "campaign_id",
    "post_title",
    "topic",
    "series_name",
    "episode_number",
    "platform",
    "post_type",
    "caption",
    "article_text",
    "hashtags",
    "platform_tags",
    "call_to_action",
    "destination_url",
    "media_filename",
    "media_url",
    "scheduled_at",
    "status"
  ];
  const lines = [headers.join(",")];
  for (const p of posts) {
    const row = [
      p.campaignId || "",
      p.title || "",
      p.topic || "",
      p.seriesName || "",
      p.episodeNumber || "",
      p.platform || "facebook",
      p.postType || "image",
      p.caption || "",
      p.articleText || "",
      p.hashtags || "",
      p.platformTags || "",
      p.callToAction || "",
      p.destinationUrl || "",
      p.mediaFilename || "",
      p.imageUrl || p.mediaUrls && p.mediaUrls[0] || "",
      p.scheduledAt || "",
      p.status || "draft"
    ].map(escapeCsvCell);
    lines.push(row.join(","));
  }
  return lines.join("\r\n");
}

// src/server-app.ts
var ROOT_DIR = typeof __dirname !== "undefined" && import_node_fs.default.existsSync(import_node_path.default.join(__dirname, "package.json")) ? __dirname : process.cwd();
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
var DATA_DIR = import_node_path.default.join(ROOT_DIR, "data");
var BACKUP_DIR = import_node_path.default.join(DATA_DIR, "backups");
var DB_FILE = import_node_path.default.join(DATA_DIR, "posts.json");
var UPLOAD_DIR = import_node_path.default.join(ROOT_DIR, "uploads");
var DIST_DIR = import_node_path.default.join(ROOT_DIR, "dist");
var PUBLIC_DIR = import_node_path.default.join(ROOT_DIR, "public");
var SESSION_MS = 12 * 60 * 60 * 1e3;
var GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
var DEFAULT_TIMEZONE = "Asia/Karachi";
var FREE_ELIGIBLE_GEMINI_MODELS = /* @__PURE__ */ new Set([
  "gemini-2.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite"
]);
var sessions = /* @__PURE__ */ new Map();
var inFlightPublishIds = /* @__PURE__ */ new Set();
try {
  import_node_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  import_node_fs.default.mkdirSync(BACKUP_DIR, { recursive: true });
  import_node_fs.default.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!import_node_fs.default.existsSync(import_node_path.default.join(UPLOAD_DIR, ".gitkeep"))) {
    import_node_fs.default.writeFileSync(import_node_path.default.join(UPLOAD_DIR, ".gitkeep"), "");
  }
} catch (initErr) {
  console.warn("Storage directory init warning:", initErr);
}
function createInitialSeedData() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
  const twoDays = new Date(Date.now() + 48 * 60 * 60 * 1e3).toISOString();
  const campId = "camp-toptech-q4-ai";
  const initialCampaign = {
    id: campId,
    name: "TopTech SME Workflow Automation Series",
    topic: "Practical Free AI & Process Automation for Growing Businesses",
    targetAudience: "SME Founders, Operations Managers, and Tech Learners in South Asia & MENA",
    businessName: "TopTech Solutions",
    goals: "Educate business owners on cost-effective workflow automation and generate consultation inquiries",
    tone: "Professional, practical, and authoritative",
    startDate: tomorrow.slice(0, 10),
    durationDays: 14,
    selectedPlatforms: ["facebook", "linkedin", "x", "instagram", "youtube", "threads"],
    platformPostTypes: {
      facebook: "link",
      linkedin: "text",
      x: "text",
      instagram: "carousel",
      youtube: "youtube_video",
      threads: "text"
    },
    notes: "Multi-platform educational series showcasing how each platform receives tailored copy, tags, and post types.",
    createdAt: now,
    updatedAt: now
  };
  const initialPosts = [
    {
      id: "post-seed-fb-1",
      campaignId: campId,
      title: "3 Manual Workflows Every SME Should Automate First",
      topic: "Practical Free AI & Process Automation",
      seriesName: "SME Automation Blueprint",
      episodeNumber: "1",
      platform: "facebook",
      postType: "link",
      caption: "Most growing teams lose 8\u201312 hours every week copying invoice rows, triaging repetitive support messages, and formatting weekly status reports.\n\nBefore investing in expensive enterprise suites, audit these three workflows:\n1. Standardized CSV data intake & validation\n2. Automated ticket categorization with local open-weights models\n3. Scheduled multi-channel content queues with human review gates\n\nRead our complete breakdown and checklist for operations teams.",
      articleText: "# 3 Manual Workflows Every SME Should Automate First\n\n## 1. Structured Data Intake\nStandardizing spreadsheets and CSV imports eliminates 70% of downstream entry errors.\n\n## 2. Local Free AI Triage\nRunning open-weights models via Ollama on office hardware keeps client data private with zero per-token API bills.\n\n## 3. Reviewed Publishing Queues\nBatch your communication weekly while keeping human approval mandatory before publication.",
      hashtags: "#TopTechSolutions #WorkflowAutomation #SMEGrowth #DigitalTransformation",
      platformTags: "@TopTechSolutions, Business Operations, Software Engineering",
      callToAction: "Read the Engineering Checklist",
      destinationUrl: "https://toptechsolutions.example.com/guides/sme-automation",
      imageUrl: "",
      mediaUrls: [],
      mediaFilename: "",
      mediaMimeType: "",
      scheduledAt: tomorrow,
      status: "approved",
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null
    },
    {
      id: "post-seed-li-1",
      campaignId: campId,
      title: "Why Operations Architecture Beats Expensive AI Subscriptions",
      topic: "Practical Free AI & Process Automation",
      seriesName: "SME Automation Blueprint",
      episodeNumber: "1",
      platform: "linkedin",
      postType: "text",
      caption: "We frequently audit teams spending thousands of dollars a year on overlapping SaaS subscriptions when their core bottleneck is actually unstructured data handoffs.\n\nAt TopTech Solutions, our rule for engineering sustainable internal tools is straightforward:\n\u2022 Standardize the schema first (clean CSV/JSON contracts)\n\u2022 Keep human review gates between draft generation and client-facing output\n\u2022 Use local inference (Ollama) or eligible free-tier models instead of uncapped per-seat API billing\n\nWhich internal workflow is currently taking your team the most manual effort each week?",
      articleText: "",
      hashtags: "#TopTechSolutions #SoftwareArchitecture #OperationsManagement #B2BTech",
      platformTags: "@TopTech Solutions, Information Technology, Business Strategy",
      callToAction: "Share your workflow challenge in the comments",
      destinationUrl: "https://toptechsolutions.example.com/guides/sme-automation",
      imageUrl: "",
      mediaUrls: [],
      mediaFilename: "",
      mediaMimeType: "",
      scheduledAt: twoDays,
      status: "scheduled",
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null
    },
    {
      id: "post-seed-x-1",
      campaignId: campId,
      title: "X Thread Opener: Clean Schemas Before AI",
      topic: "Practical Free AI & Process Automation",
      seriesName: "SME Automation Blueprint",
      episodeNumber: "1",
      platform: "x",
      postType: "text",
      caption: "Unpopular engineering truth: Clean CSV schemas + deterministic validation rules solve 80% of business automation problems before you even touch an LLM. Keep AI local & free, and keep humans in the approval loop.",
      articleText: "",
      hashtags: "#TopTechSolutions #BuildInPublic",
      platformTags: "@TopTechPK",
      callToAction: "Bookmark for your next sprint",
      destinationUrl: "",
      imageUrl: "",
      mediaUrls: [],
      mediaFilename: "",
      mediaMimeType: "",
      scheduledAt: "",
      status: "draft",
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null
    },
    {
      id: "post-seed-yt-1",
      campaignId: campId,
      title: "How to Run Local AI (Ollama) for Business Content & Operations \u2014 Zero API Cost",
      topic: "Practical Free AI & Process Automation",
      seriesName: "SME Automation Blueprint",
      episodeNumber: "1",
      platform: "youtube",
      postType: "youtube_video",
      caption: "In this full walkthrough from TopTech Solutions, we demonstrate how to configure local open-weights models with Ollama (Llama 3.2) alongside TopTech Social Studio so your team can plan multi-platform campaigns, validate CSV imports, and schedule content without paying recurring API token fees.\n\nChapters:\n00:00 Why Free & Local AI Matters for SMEs\n02:15 Installing Ollama & Pulling llama3.2\n05:40 Generating Multi-Platform Campaigns\n09:10 Bulk CSV Import & Human Approval Workflow",
      articleText: "",
      hashtags: "#TopTechSolutions #Ollama #LocalAI",
      platformTags: "toptech solutions, ollama tutorial, free ai for business, social media scheduler, llama 3.2",
      callToAction: "Subscribe & download our free CSV campaign template",
      destinationUrl: "https://toptechsolutions.example.com/templates",
      imageUrl: "",
      mediaUrls: [],
      mediaFilename: "ollama-walkthrough-ep1.mp4",
      mediaMimeType: "video/mp4",
      scheduledAt: "",
      status: "draft",
      isManuallyEdited: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      facebookPostId: null,
      lastError: null
    }
  ];
  return {
    schemaVersion: 2,
    posts: initialPosts,
    campaigns: [initialCampaign],
    media: [],
    logs: [
      {
        id: import_node_crypto.default.randomUUID(),
        at: now,
        type: "system",
        message: "Initialized TopTech Social Studio v2.0 database with multi-platform campaign schema.",
        postId: null
      }
    ],
    settings: {
      preferredAiProvider: "auto",
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      ollamaModel: process.env.OLLAMA_MODEL || "llama3.2",
      geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      timezone: DEFAULT_TIMEZONE
    }
  };
}
try {
  if (!import_node_fs.default.existsSync(DB_FILE)) {
    import_node_fs.default.writeFileSync(DB_FILE, JSON.stringify(createInitialSeedData(), null, 2), "utf8");
  }
} catch (seedErr) {
  console.warn("Database seed init warning:", seedErr);
}
function normalizePostRecord(raw) {
  const platform = normalizePlatform(raw.platform);
  const postType = normalizePostType(raw.postType || raw.post_type, platform);
  const imageUrl = String(raw.imageUrl || raw.image_url || raw.media_url || "").slice(0, 1e3);
  const mediaUrls = Array.isArray(raw.mediaUrls) ? raw.mediaUrls.map((u) => String(u)) : imageUrl ? [imageUrl] : [];
  const validStatuses = ["draft", "approved", "scheduled", "published", "failed"];
  const status = validStatuses.includes(raw.status) ? raw.status : "draft";
  return {
    id: String(raw.id || import_node_crypto.default.randomUUID()),
    campaignId: String(raw.campaignId || raw.campaign_id || ""),
    title: String(raw.title || raw.post_title || "").slice(0, 200),
    topic: String(raw.topic || "General").slice(0, 160),
    seriesName: String(raw.seriesName || raw.series_name || "").slice(0, 160),
    episodeNumber: String(raw.episodeNumber || raw.episode_number || "").slice(0, 40),
    platform,
    postType,
    caption: String(raw.caption || "").slice(0, 1e5),
    articleText: String(raw.articleText || raw.article_text || "").slice(0, 1e5),
    hashtags: String(raw.hashtags || "").slice(0, 2e3),
    platformTags: String(raw.platformTags || raw.platform_tags || "").slice(0, 2e3),
    callToAction: String(raw.callToAction || raw.call_to_action || "").slice(0, 300),
    destinationUrl: String(raw.destinationUrl || raw.destination_url || "").slice(0, 1e3),
    imageUrl: imageUrl || (mediaUrls[0] ?? ""),
    mediaUrls,
    mediaFilename: String(raw.mediaFilename || raw.media_filename || raw.image_filename || "").slice(0, 260),
    mediaMimeType: String(raw.mediaMimeType || ""),
    scheduledAt: String(raw.scheduledAt || ""),
    status,
    isManuallyEdited: Boolean(raw.isManuallyEdited),
    createdAt: String(raw.createdAt || (/* @__PURE__ */ new Date()).toISOString()),
    updatedAt: String(raw.updatedAt || raw.createdAt || (/* @__PURE__ */ new Date()).toISOString()),
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    facebookPostId: raw.facebookPostId ? String(raw.facebookPostId) : null,
    lastError: raw.lastError ? String(raw.lastError) : null
  };
}
async function readDb() {
  const rawText = await import_promises.default.readFile(DB_FILE, "utf8");
  const parsed = JSON.parse(rawText);
  const posts = Array.isArray(parsed.posts) ? parsed.posts.map(normalizePostRecord) : [];
  const campaigns = Array.isArray(parsed.campaigns) ? parsed.campaigns : [];
  const media = Array.isArray(parsed.media) ? parsed.media : [];
  const logs = Array.isArray(parsed.logs) ? parsed.logs : [];
  return {
    schemaVersion: 2,
    posts,
    campaigns,
    media,
    logs,
    settings: {
      preferredAiProvider: parsed.settings?.preferredAiProvider || "auto",
      ollamaBaseUrl: parsed.settings?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      ollamaModel: parsed.settings?.ollamaModel || process.env.OLLAMA_MODEL || "llama3.2",
      geminiModel: parsed.settings?.geminiModel || process.env.GEMINI_MODEL || "gemini-2.5-flash",
      timezone: parsed.settings?.timezone || DEFAULT_TIMEZONE,
      adminUsername: parsed.settings?.adminUsername || process.env.ADMIN_USERNAME || "admin",
      metaPageId: parsed.settings?.metaPageId || process.env.META_PAGE_ID || "",
      metaPageName: parsed.settings?.metaPageName || "",
      metaPageCategory: parsed.settings?.metaPageCategory || "",
      metaGraphVersion: parsed.settings?.metaGraphVersion || process.env.META_GRAPH_VERSION || GRAPH_VERSION,
      facebookAppId: parsed.settings?.facebookAppId || "",
      enableFacebookPublishing: parsed.settings?.enableFacebookPublishing !== void 0 ? Boolean(parsed.settings.enableFacebookPublishing) : process.env.ENABLE_FACEBOOK_PUBLISHING === "true",
      enableAutoPublish: parsed.settings?.enableAutoPublish !== void 0 ? Boolean(parsed.settings.enableAutoPublish) : process.env.ENABLE_AUTO_PUBLISH === "true",
      discoveredPages: Array.isArray(parsed.settings?.discoveredPages) ? parsed.settings.discoveredPages : [],
      runtimeMetaAccessToken: parsed.settings?.runtimeMetaAccessToken || ""
    }
  };
}
async function writeDb(db) {
  const tmp = `${DB_FILE}.tmp.${process.pid}.${Date.now()}`;
  await import_promises.default.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await import_promises.default.rename(tmp, DB_FILE);
}
async function createBackupSnapshot(reason) {
  try {
    const raw = await import_promises.default.readFile(DB_FILE, "utf8");
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const safeReason = reason.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
    const filename = `posts-backup-${stamp}-${safeReason}.json`;
    await import_promises.default.writeFile(import_node_path.default.join(BACKUP_DIR, filename), raw, "utf8");
    const files = (await import_promises.default.readdir(BACKUP_DIR)).filter((f) => f.endsWith(".json")).sort().reverse();
    for (const old of files.slice(25)) {
      await import_promises.default.unlink(import_node_path.default.join(BACKUP_DIR, old)).catch(() => {
      });
    }
    return filename;
  } catch {
    return "";
  }
}
function logEntry(db, type, message, postId = null) {
  db.logs.unshift({
    id: import_node_crypto.default.randomUUID(),
    at: (/* @__PURE__ */ new Date()).toISOString(),
    type,
    message,
    postId
  });
  db.logs = db.logs.slice(0, 400);
}
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(import_express.default.json({ limit: "5mb" }));
app.use(import_express.default.urlencoded({ extended: false }));
app.use("/uploads", import_express.default.static(UPLOAD_DIR, { maxAge: "1h" }));
function createMemoryRateLimiter(windowMs, maxRequests, errorMessage) {
  const hits = /* @__PURE__ */ new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = String(req.ip || req.socket?.remoteAddress || "global");
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
var loginLimiter = createMemoryRateLimiter(
  15 * 60 * 1e3,
  20,
  "Too many login attempts. Please wait 15 minutes before retrying."
);
var aiLimiter = createMemoryRateLimiter(
  60 * 1e3,
  25,
  "AI generation rate limit reached (max 25 requests/minute). Please wait a moment."
);
var ALLOWED_MIMES = {
  "image/jpeg": { ext: ".jpg", category: "image" },
  "image/png": { ext: ".png", category: "image" },
  "image/webp": { ext: ".webp", category: "image" },
  "image/gif": { ext: ".gif", category: "image" },
  "video/mp4": { ext: ".mp4", category: "video" },
  "video/webm": { ext: ".webm", category: "video" },
  "video/quicktime": { ext: ".mov", category: "video" }
};
var upload = (0, import_multer.default)({
  dest: UPLOAD_DIR,
  limits: { fileSize: 50 * 1024 * 1024 },
  // 50 MB max for video, 12 MB checked for images
  fileFilter: (_req, file, cb) => {
    cb(null, Boolean(ALLOWED_MIMES[file.mimetype]));
  }
});
function isPlaceholderSecret(val) {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return lower === "" || lower.includes("change-this") || lower.includes("change_this") || lower.includes("replace-with") || lower === "my_gemini_api_key" || lower === "your_api_key";
}
function verifyPasswordHash(inputPassword, configuredPassword) {
  const salt = process.env.SESSION_SECRET || "toptech-studio-default-salt";
  const hashA = import_node_crypto.default.scryptSync(String(inputPassword || ""), salt, 64);
  const hashB = import_node_crypto.default.scryptSync(String(configuredPassword || ""), salt, 64);
  return import_node_crypto.default.timingSafeEqual(hashA, hashB);
}
function getCookie(req, name) {
  const raw = req.headers.cookie || "";
  const item = raw.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}
function isProductionStrictAuth() {
  return process.env.NODE_ENV === "production" && !isPlaceholderSecret(process.env.ADMIN_PASSWORD);
}
function auth(req, res, next) {
  const token = getCookie(req, "tts_session");
  const session = sessions.get(token);
  if (session && session.expires > Date.now()) {
    session.expires = Date.now() + SESSION_MS;
    return next();
  }
  if (token) sessions.delete(token);
  if (isPlaceholderSecret(process.env.ADMIN_PASSWORD) && process.env.NODE_ENV !== "production") {
    return next();
  }
  return res.status(401).json({ error: "Authentication required. Please log in." });
}
function hasValidGeminiKey() {
  return !isPlaceholderSecret(process.env.GEMINI_API_KEY);
}
async function probeOllama(baseUrl) {
  const cleanBase = String(baseUrl || "http://localhost:11434").replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const r = await fetch(`${cleanBase}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) {
      return { reachable: false, models: [], error: `HTTP ${r.status} from Ollama server` };
    }
    const data = await r.json();
    const models = Array.isArray(data.models) ? data.models.map((m) => String(m.name || "")).filter(Boolean) : [];
    return { reachable: true, models, error: null };
  } catch (e) {
    clearTimeout(timer);
    return {
      reachable: false,
      models: [],
      error: cleanBase.includes("localhost") || cleanBase.includes("127.0.0.1") ? "Local Ollama server not detected at " + cleanBase + ". Ensure Ollama is installed and running (`ollama serve`) on the same machine running this Node.js server." : `Could not connect to Ollama at ${cleanBase}: ${e?.message || "Connection refused"}`
    };
  }
}
function getEffectiveMetaCredentials(db) {
  const pageId = String(db.settings?.metaPageId || process.env.META_PAGE_ID || "").trim();
  const envToken = !isPlaceholderSecret(process.env.META_PAGE_ACCESS_TOKEN) ? String(process.env.META_PAGE_ACCESS_TOKEN || "").trim() : "";
  const runtimeToken = !isPlaceholderSecret(db.settings?.runtimeMetaAccessToken) ? String(db.settings?.runtimeMetaAccessToken || "").trim() : "";
  const accessToken = runtimeToken || envToken;
  const graphVersion = String(
    db.settings?.metaGraphVersion || process.env.META_GRAPH_VERSION || GRAPH_VERSION
  ).trim() || "v23.0";
  const publishingEnabled = db.settings?.enableFacebookPublishing !== void 0 ? Boolean(db.settings.enableFacebookPublishing) : process.env.ENABLE_FACEBOOK_PUBLISHING === "true";
  const autoPublishEnabled = db.settings?.enableAutoPublish !== void 0 ? Boolean(db.settings.enableAutoPublish) : process.env.ENABLE_AUTO_PUBLISH === "true";
  return {
    pageId,
    accessToken,
    graphVersion,
    publishingEnabled,
    autoPublishEnabled,
    metaConfigured: Boolean(pageId && accessToken)
  };
}
async function discoverFacebookPagesFromToken(db, overrideToken) {
  const creds = getEffectiveMetaCredentials(db);
  const token = String(overrideToken || creds.accessToken || "").trim();
  const graphVer = creds.graphVersion || "v23.0";
  if (!token) {
    return {
      ok: false,
      pages: db.settings?.discoveredPages || [],
      selectedPage: null,
      error: "No Meta Access Token available yet. Connect via Facebook Login or provide a Page/User token in Login Info."
    };
  }
  db.settings = db.settings || {};
  const discovered = [];
  let pageSpecificToken = token;
  try {
    const accountsUrl = new URL(`https://graph.facebook.com/${graphVer}/me/accounts`);
    accountsUrl.searchParams.set("fields", "id,name,category,link,access_token");
    accountsUrl.searchParams.set("access_token", token);
    const rAcc = await fetch(accountsUrl);
    if (rAcc.ok) {
      const dAcc = await rAcc.json();
      if (Array.isArray(dAcc.data) && dAcc.data.length > 0) {
        for (const item of dAcc.data) {
          discovered.push({
            id: String(item.id),
            name: String(item.name || "Facebook Page"),
            category: String(item.category || "Facebook Page"),
            link: item.link ? String(item.link) : `https://www.facebook.com/${item.id}`
          });
        }
        const target = dAcc.data.find((x) => x.id === db.settings?.metaPageId) || dAcc.data[0];
        if (target) {
          db.settings.metaPageId = String(target.id);
          db.settings.metaPageName = String(target.name || "");
          db.settings.metaPageCategory = String(target.category || "Facebook Page");
          if (target.access_token) {
            pageSpecificToken = String(target.access_token);
          }
        }
      }
    }
    if (discovered.length === 0) {
      const meUrl = new URL(`https://graph.facebook.com/${graphVer}/me`);
      meUrl.searchParams.set("fields", "id,name,category,link");
      meUrl.searchParams.set("access_token", token);
      const rMe = await fetch(meUrl);
      const dMe = await rMe.json();
      if (!rMe.ok) {
        return {
          ok: false,
          pages: db.settings.discoveredPages || [],
          selectedPage: null,
          error: dMe?.error?.message || "Meta Graph API rejected the token during auto-discovery."
        };
      }
      if (dMe.id) {
        const pageObj = {
          id: String(dMe.id),
          name: String(dMe.name || "Connected Facebook Page"),
          category: String(dMe.category || "Facebook Page"),
          link: dMe.link ? String(dMe.link) : `https://www.facebook.com/${dMe.id}`
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
    const selectedPage = discovered.find((p) => p.id === db.settings?.metaPageId) || discovered[0] || null;
    logEntry(
      db,
      "facebook_autodiscover",
      selectedPage ? `Auto-picked Facebook Page "${selectedPage.name}" (ID: ${selectedPage.id})` : "Completed Facebook Page discovery check"
    );
    await writeDb(db);
    return {
      ok: true,
      pages: discovered,
      selectedPage
    };
  } catch (e) {
    return {
      ok: false,
      pages: db.settings.discoveredPages || [],
      selectedPage: null,
      error: `Facebook Page auto-discovery failed: ${e.message}`
    };
  }
}
async function getSystemStatus(db) {
  const ollamaUrl = db.settings?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = db.settings?.ollamaModel || process.env.OLLAMA_MODEL || "llama3.2";
  const geminiModel = db.settings?.geminiModel || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const geminiKeyPresent = hasValidGeminiKey();
  const geminiModelEligible = FREE_ELIGIBLE_GEMINI_MODELS.has(geminiModel);
  const ollamaProbe = await probeOllama(ollamaUrl);
  const adminPasswordConfigured = !isPlaceholderSecret(process.env.ADMIN_PASSWORD);
  const sessionSecretConfigured = !isPlaceholderSecret(process.env.SESSION_SECRET);
  const metaCreds = getEffectiveMetaCredentials(db);
  let activeAiSummary = "Manual Mode (No Free AI Active)";
  if (ollamaProbe.reachable) {
    activeAiSummary = `Ollama Local (${ollamaModel})`;
  } else if (geminiKeyPresent && geminiModelEligible) {
    activeAiSummary = `Google Gemini Free-Tier Eligible (${geminiModel})`;
  }
  return {
    adminUsername: db.settings?.adminUsername || process.env.ADMIN_USERNAME || "admin",
    adminPasswordConfigured,
    sessionSecretConfigured,
    strictAuthEnforced: isProductionStrictAuth(),
    aiConfigured: ollamaProbe.reachable || geminiKeyPresent && geminiModelEligible,
    aiProvider: activeAiSummary,
    preferredAiProvider: db.settings?.preferredAiProvider || "auto",
    ollama: {
      baseUrl: ollamaUrl,
      configuredModel: ollamaModel,
      reachable: ollamaProbe.reachable,
      installedModels: ollamaProbe.models,
      error: ollamaProbe.error,
      isLocalhost: ollamaUrl.includes("localhost") || ollamaUrl.includes("127.0.0.1")
    },
    gemini: {
      keyConfigured: geminiKeyPresent,
      configuredModel: geminiModel,
      isFreeTierEligibleModel: geminiModelEligible,
      allowedFreeModels: Array.from(FREE_ELIGIBLE_GEMINI_MODELS),
      notice: geminiKeyPresent ? geminiModelEligible ? "Server-side GEMINI_API_KEY detected with eligible Flash model. Subject to Google AI Studio free-tier rate and regional limits." : `Configured model "${geminiModel}" is not on the Free-AI allowlist. Select gemini-2.5-flash or gemini-3.8-flash.` : "GEMINI_API_KEY is not set in server environment."
    },
    metaConfigured: metaCreds.metaConfigured,
    metaPageId: metaCreds.pageId,
    metaPageName: db.settings?.metaPageName || "",
    metaPageCategory: db.settings?.metaPageCategory || "",
    metaTokenConfigured: Boolean(metaCreds.accessToken),
    metaPageIdPreview: metaCreds.pageId ? `${String(metaCreds.pageId).slice(0, 8)}...` : null,
    facebookAppId: db.settings?.facebookAppId || "",
    discoveredPages: db.settings?.discoveredPages || [],
    publishingEnabled: metaCreds.publishingEnabled,
    autoPublishEnabled: metaCreds.autoPublishEnabled,
    graphVersion: metaCreds.graphVersion,
    timezone: db.settings?.timezone || DEFAULT_TIMEZONE,
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 3e3
  };
}
app.get(
  "/api/health",
  (_req, res) => res.json({
    ok: true,
    app: "TopTech Social Studio",
    version: "2.0.0",
    time: (/* @__PURE__ */ new Date()).toISOString()
  })
);
app.get("/api/session", async (req, res) => {
  const token = getCookie(req, "tts_session");
  const s = sessions.get(token);
  const adminPasswordConfigured = !isPlaceholderSecret(process.env.ADMIN_PASSWORD);
  const authenticated = Boolean(s && s.expires > Date.now()) || !adminPasswordConfigured && process.env.NODE_ENV !== "production";
  const db = await readDb();
  res.json({
    authenticated,
    username: s?.username || db.settings?.adminUsername || process.env.ADMIN_USERNAME || "admin",
    adminPasswordConfigured,
    requiresSetupInProduction: !adminPasswordConfigured && process.env.NODE_ENV === "production"
  });
});
app.post("/api/login", loginLimiter, async (req, res) => {
  const db = await readDb();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const configuredUsername = db.settings?.adminUsername || process.env.ADMIN_USERNAME || "admin";
  const { username = "admin", password = "", facebookAccessToken = "" } = req.body || {};
  if (isPlaceholderSecret(configuredPassword)) {
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        error: "Set a strong ADMIN_PASSWORD and SESSION_SECRET in .env before logging in on production."
      });
    }
    const token2 = import_node_crypto.default.randomBytes(32).toString("hex");
    sessions.set(token2, { username: configuredUsername, expires: Date.now() + SESSION_MS });
    res.setHeader(
      "Set-Cookie",
      `tts_session=${encodeURIComponent(token2)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MS / 1e3)}`
    );
    const autoPick2 = await discoverFacebookPagesFromToken(
      db,
      facebookAccessToken ? String(facebookAccessToken) : void 0
    );
    return res.json({
      ok: true,
      mode: "development-preview",
      facebookAutoPicked: autoPick2.selectedPage
    });
  }
  if (String(username).trim() !== configuredUsername || !verifyPasswordHash(password, configuredPassword)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const token = import_node_crypto.default.randomBytes(32).toString("hex");
  sessions.set(token, { username: configuredUsername, expires: Date.now() + SESSION_MS });
  res.setHeader(
    "Set-Cookie",
    `tts_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(
      SESSION_MS / 1e3
    )}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
  const autoPick = await discoverFacebookPagesFromToken(
    db,
    facebookAccessToken ? String(facebookAccessToken) : void 0
  );
  res.json({ ok: true, facebookAutoPicked: autoPick.selectedPage });
});
app.post("/api/logout", (req, res) => {
  sessions.delete(getCookie(req, "tts_session"));
  res.setHeader("Set-Cookie", "tts_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  res.json({ ok: true });
});
app.get("/api/status", auth, async (_req, res) => {
  const db = await readDb();
  res.json(await getSystemStatus(db));
});
app.patch("/api/settings", auth, async (req, res) => {
  const db = await readDb();
  db.settings = db.settings || {};
  const { preferredAiProvider, ollamaBaseUrl, ollamaModel, geminiModel, timezone } = req.body || {};
  if (preferredAiProvider && ["auto", "ollama", "gemini", "manual"].includes(preferredAiProvider)) {
    db.settings.preferredAiProvider = preferredAiProvider;
  }
  if (typeof ollamaBaseUrl === "string" && ollamaBaseUrl.trim()) {
    const cleanUrl = ollamaBaseUrl.trim().slice(0, 200);
    if (!/^https?:\/\/.+/i.test(cleanUrl)) {
      return res.status(400).json({ error: "Ollama Base URL must start with http:// or https://." });
    }
    db.settings.ollamaBaseUrl = cleanUrl;
  }
  if (typeof ollamaModel === "string" && ollamaModel.trim()) {
    db.settings.ollamaModel = ollamaModel.trim().slice(0, 80);
  }
  if (typeof geminiModel === "string" && geminiModel.trim()) {
    if (!FREE_ELIGIBLE_GEMINI_MODELS.has(geminiModel.trim())) {
      return res.status(400).json({
        error: `Model "${geminiModel}" is not allowed under the Free-AI-Only policy. Choose one of: ${Array.from(
          FREE_ELIGIBLE_GEMINI_MODELS
        ).join(", ")}.`
      });
    }
    db.settings.geminiModel = geminiModel.trim();
  }
  if (typeof timezone === "string" && timezone.trim()) {
    db.settings.timezone = timezone.trim().slice(0, 60);
  }
  logEntry(db, "settings", `Updated studio settings (AI preference: ${db.settings.preferredAiProvider})`);
  await writeDb(db);
  res.json(await getSystemStatus(db));
});
app.post("/api/login-info", auth, async (req, res) => {
  const db = await readDb();
  db.settings = db.settings || {};
  const body = req.body || {};
  if (typeof body.adminUsername === "string" && body.adminUsername.trim()) {
    db.settings.adminUsername = body.adminUsername.trim().slice(0, 80);
  }
  if (typeof body.ollamaBaseUrl === "string" && body.ollamaBaseUrl.trim()) {
    const cleanUrl = body.ollamaBaseUrl.trim().slice(0, 200);
    if (!/^https?:\/\/.+/i.test(cleanUrl)) {
      return res.status(400).json({ error: "OLLAMA_BASE_URL must start with http:// or https://." });
    }
    db.settings.ollamaBaseUrl = cleanUrl;
  }
  if (typeof body.ollamaModel === "string" && body.ollamaModel.trim()) {
    db.settings.ollamaModel = body.ollamaModel.trim().slice(0, 80);
  }
  if (typeof body.geminiModel === "string" && body.geminiModel.trim()) {
    if (!FREE_ELIGIBLE_GEMINI_MODELS.has(body.geminiModel.trim())) {
      return res.status(400).json({
        error: `GEMINI_MODEL "${body.geminiModel}" is not on the Free-AI allowlist.`
      });
    }
    db.settings.geminiModel = body.geminiModel.trim();
  }
  if (body.enableFacebookPublishing !== void 0) {
    db.settings.enableFacebookPublishing = Boolean(body.enableFacebookPublishing);
  }
  if (body.enableAutoPublish !== void 0) {
    db.settings.enableAutoPublish = Boolean(body.enableAutoPublish);
  }
  if (typeof body.metaPageId === "string") {
    db.settings.metaPageId = body.metaPageId.trim().slice(0, 120);
  }
  if (typeof body.metaPageName === "string") {
    db.settings.metaPageName = body.metaPageName.trim().slice(0, 160);
  }
  if (typeof body.metaGraphVersion === "string" && body.metaGraphVersion.trim()) {
    db.settings.metaGraphVersion = body.metaGraphVersion.trim().slice(0, 30);
  }
  if (typeof body.facebookAppId === "string") {
    db.settings.facebookAppId = body.facebookAppId.trim().slice(0, 80);
  }
  if (typeof body.metaPageAccessToken === "string" && body.metaPageAccessToken.trim()) {
    db.settings.runtimeMetaAccessToken = body.metaPageAccessToken.trim();
  }
  logEntry(db, "login_info_updated", "Updated runtime configuration variables via Login Info tab");
  await writeDb(db);
  if (body.autoDiscoverFacebook || body.metaPageAccessToken) {
    await discoverFacebookPagesFromToken(db);
  }
  res.json({
    ok: true,
    status: await getSystemStatus(db)
  });
});
app.post("/api/facebook/auto-discover", auth, async (req, res) => {
  const db = await readDb();
  const { accessToken, browserPages, selectedPageId } = req.body || {};
  if (Array.isArray(browserPages) && browserPages.length > 0) {
    db.settings = db.settings || {};
    const mapped = browserPages.map((p) => ({
      id: String(p.id || ""),
      name: String(p.name || "Facebook Page"),
      category: String(p.category || "Facebook Page"),
      link: p.link ? String(p.link) : `https://www.facebook.com/${p.id}`
    })).filter((p) => p.id);
    db.settings.discoveredPages = mapped;
    const chosen = browserPages.find((p) => p.id === selectedPageId) || browserPages[0];
    if (chosen) {
      db.settings.metaPageId = String(chosen.id);
      db.settings.metaPageName = String(chosen.name || "");
      db.settings.metaPageCategory = String(chosen.category || "Facebook Page");
      if (chosen.access_token) {
        db.settings.runtimeMetaAccessToken = String(chosen.access_token);
      }
    }
    logEntry(
      db,
      "facebook_autodiscover",
      `Auto-populated Facebook Page "${db.settings.metaPageName}" (${db.settings.metaPageId}) from browser Facebook session`
    );
    await writeDb(db);
    return res.json({
      ok: true,
      pages: mapped,
      selectedPage: chosen,
      status: await getSystemStatus(db)
    });
  }
  if (selectedPageId && (!accessToken || !String(accessToken).trim())) {
    db.settings = db.settings || {};
    const found = (db.settings.discoveredPages || []).find((p) => p.id === selectedPageId);
    if (found) {
      db.settings.metaPageId = found.id;
      db.settings.metaPageName = found.name;
      db.settings.metaPageCategory = found.category;
      await writeDb(db);
      return res.json({
        ok: true,
        pages: db.settings.discoveredPages,
        selectedPage: found,
        status: await getSystemStatus(db)
      });
    }
  }
  const discovery = await discoverFacebookPagesFromToken(
    db,
    typeof accessToken === "string" && accessToken.trim() ? accessToken.trim() : void 0
  );
  if (!discovery.ok) {
    return res.status(400).json({
      error: discovery.error || "Could not auto-discover Facebook Pages.",
      status: await getSystemStatus(db)
    });
  }
  res.json({
    ok: true,
    pages: discovery.pages,
    selectedPage: discovery.selectedPage,
    status: await getSystemStatus(db)
  });
});
app.get("/api/posts", auth, async (_req, res) => {
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
    logs: db.logs.slice(0, 100)
  });
});
app.post("/api/posts", auth, async (req, res) => {
  const body = req.body || {};
  const platform = normalizePlatform(body.platform);
  const postType = normalizePostType(body.postType, platform);
  const status = ["draft", "approved", "scheduled"].includes(body.status) ? body.status : "draft";
  const candidate = {
    campaignId: String(body.campaignId || ""),
    title: String(body.title || "").slice(0, 200),
    topic: String(body.topic || "General").slice(0, 160),
    seriesName: String(body.seriesName || "").slice(0, 160),
    episodeNumber: String(body.episodeNumber || "").slice(0, 40),
    platform,
    postType,
    caption: String(body.caption || "").slice(0, 1e5),
    articleText: String(body.articleText || "").slice(0, 1e5),
    hashtags: String(body.hashtags || "").slice(0, 2e3),
    platformTags: String(body.platformTags || "").slice(0, 2e3),
    callToAction: String(body.callToAction || "").slice(0, 300),
    destinationUrl: String(body.destinationUrl || "").slice(0, 1e3),
    imageUrl: String(body.imageUrl || Array.isArray(body.mediaUrls) && body.mediaUrls[0] || "").slice(0, 1e3),
    mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls.map((u) => String(u).slice(0, 1e3)) : body.imageUrl ? [String(body.imageUrl).slice(0, 1e3)] : [],
    mediaFilename: String(body.mediaFilename || "").slice(0, 260),
    mediaMimeType: String(body.mediaMimeType || ""),
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt).toISOString() : "",
    status
  };
  const validation = validatePostInput(candidate, status === "scheduled");
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors.join(" "), warnings: validation.warnings });
  }
  const db = await readDb();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const post = normalizePostRecord({
    ...candidate,
    id: import_node_crypto.default.randomUUID(),
    isManuallyEdited: Boolean(body.isManuallyEdited ?? true),
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    facebookPostId: null,
    lastError: null
  });
  db.posts.push(post);
  logEntry(
    db,
    "created",
    `Created ${PLATFORMS[post.platform].name} (${POST_TYPES[post.postType].name}): ${post.title || post.topic}`,
    post.id
  );
  await writeDb(db);
  res.status(201).json({ post, warnings: validation.warnings });
});
app.patch("/api/posts/:id", auth, async (req, res) => {
  const db = await readDb();
  const p = db.posts.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Post not found." });
  if (p.status === "published") {
    return res.status(409).json({ error: "Published posts are locked for audit history and cannot be edited." });
  }
  const body = req.body || {};
  if (body.platform !== void 0) p.platform = normalizePlatform(body.platform);
  if (body.postType !== void 0) p.postType = normalizePostType(body.postType, p.platform);
  const stringFields = [
    { key: "campaignId", max: 120 },
    { key: "title", max: 200 },
    { key: "topic", max: 160 },
    { key: "seriesName", max: 160 },
    { key: "episodeNumber", max: 40 },
    { key: "caption", max: 1e5 },
    { key: "articleText", max: 1e5 },
    { key: "hashtags", max: 2e3 },
    { key: "platformTags", max: 2e3 },
    { key: "callToAction", max: 300 },
    { key: "destinationUrl", max: 1e3 },
    { key: "imageUrl", max: 1e3 },
    { key: "mediaFilename", max: 260 },
    { key: "mediaMimeType", max: 100 }
  ];
  for (const { key, max } of stringFields) {
    if (body[key] !== void 0) {
      p[key] = String(body[key]).slice(0, max);
    }
  }
  if (Array.isArray(body.mediaUrls)) {
    p.mediaUrls = body.mediaUrls.map((u) => String(u).slice(0, 1e3));
    if (p.mediaUrls.length > 0 && !body.imageUrl) {
      p.imageUrl = p.mediaUrls[0];
    } else if (p.mediaUrls.length === 0 && body.imageUrl === "") {
      p.imageUrl = "";
    }
  } else if (body.imageUrl !== void 0) {
    p.mediaUrls = p.imageUrl ? [p.imageUrl] : [];
  }
  if (body.scheduledAt !== void 0) {
    if (body.scheduledAt && Number.isNaN(Date.parse(body.scheduledAt))) {
      return res.status(400).json({ error: "Invalid scheduled date/time." });
    }
    p.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt).toISOString() : "";
  }
  if (body.status && ["draft", "approved", "scheduled", "failed"].includes(body.status)) {
    p.status = body.status;
  }
  const validation = validatePostInput(p, p.status === "scheduled");
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors.join(" "), warnings: validation.warnings });
  }
  p.isManuallyEdited = body.isManuallyEdited !== void 0 ? Boolean(body.isManuallyEdited) : true;
  p.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  p.lastError = null;
  logEntry(
    db,
    "updated",
    `Updated ${PLATFORMS[p.platform].name} post: ${p.title || p.topic}`,
    p.id
  );
  await writeDb(db);
  res.json({ post: p, warnings: validation.warnings });
});
app.delete("/api/posts/:id", auth, async (req, res) => {
  const db = await readDb();
  const old = db.posts.find((p) => p.id === req.params.id);
  if (!old) return res.status(404).json({ error: "Post not found." });
  if (old.status === "published") {
    return res.status(409).json({ error: "Published records are retained for audit history." });
  }
  db.posts = db.posts.filter((p) => p.id !== req.params.id);
  logEntry(db, "deleted", `Deleted post: ${old.title || old.topic} (${PLATFORMS[old.platform].name})`, old.id);
  await writeDb(db);
  res.json({ ok: true });
});
app.post("/api/posts/:id/approve", auth, async (req, res) => {
  const db = await readDb();
  const p = db.posts.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Post not found." });
  if (p.status === "draft" || p.status === "failed") {
    p.status = "approved";
    p.lastError = null;
    p.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  logEntry(db, "approved", `Approved post: ${p.title || p.topic} (${PLATFORMS[p.platform].name})`, p.id);
  await writeDb(db);
  res.json({ post: p });
});
app.get("/api/campaigns", auth, async (_req, res) => {
  const db = await readDb();
  res.json({ campaigns: db.campaigns });
});
app.post("/api/campaigns", auth, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "").trim().slice(0, 160);
  const topic = String(body.topic || "").trim().slice(0, 240);
  if (!name || !topic) {
    return res.status(400).json({ error: "Campaign name and topic are required." });
  }
  const selectedPlatforms = Array.isArray(body.selectedPlatforms) && body.selectedPlatforms.length ? body.selectedPlatforms.map((p) => normalizePlatform(p)) : ["facebook", "linkedin"];
  const platformPostTypes = {};
  for (const plat of selectedPlatforms) {
    const requestedType = body.platformPostTypes?.[plat];
    platformPostTypes[plat] = normalizePostType(requestedType, plat);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const campaign = {
    id: import_node_crypto.default.randomUUID(),
    name,
    topic,
    targetAudience: String(body.targetAudience || "Small businesses and professionals").slice(0, 240),
    businessName: String(body.businessName || "TopTech Solutions").slice(0, 160),
    goals: String(body.goals || "Brand awareness and qualified engagement").slice(0, 240),
    tone: String(body.tone || "Professional, insightful, and motivating").slice(0, 160),
    startDate: String(body.startDate || now.slice(0, 10)),
    durationDays: Math.max(1, Math.min(365, Number(body.durationDays) || 7)),
    selectedPlatforms,
    platformPostTypes,
    notes: String(body.notes || "").slice(0, 2e3),
    createdAt: now,
    updatedAt: now
  };
  const db = await readDb();
  db.campaigns.unshift(campaign);
  logEntry(db, "campaign_created", `Created campaign: ${campaign.name} (${selectedPlatforms.length} platforms)`);
  await writeDb(db);
  res.status(201).json({ campaign });
});
app.patch("/api/campaigns/:id", auth, async (req, res) => {
  const db = await readDb();
  const c = db.campaigns.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Campaign not found." });
  const body = req.body || {};
  if (body.name !== void 0) c.name = String(body.name).slice(0, 160);
  if (body.topic !== void 0) c.topic = String(body.topic).slice(0, 240);
  if (body.targetAudience !== void 0) c.targetAudience = String(body.targetAudience).slice(0, 240);
  if (body.businessName !== void 0) c.businessName = String(body.businessName).slice(0, 160);
  if (body.goals !== void 0) c.goals = String(body.goals).slice(0, 240);
  if (body.tone !== void 0) c.tone = String(body.tone).slice(0, 160);
  if (body.startDate !== void 0) c.startDate = String(body.startDate).slice(0, 30);
  if (body.durationDays !== void 0) c.durationDays = Math.max(1, Math.min(365, Number(body.durationDays) || 7));
  if (body.notes !== void 0) c.notes = String(body.notes).slice(0, 2e3);
  if (Array.isArray(body.selectedPlatforms) && body.selectedPlatforms.length) {
    c.selectedPlatforms = body.selectedPlatforms.map((p) => normalizePlatform(p));
  }
  if (body.platformPostTypes && typeof body.platformPostTypes === "object") {
    for (const plat of c.selectedPlatforms) {
      c.platformPostTypes[plat] = normalizePostType(body.platformPostTypes[plat], plat);
    }
  }
  c.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  logEntry(db, "campaign_updated", `Updated campaign: ${c.name}`);
  await writeDb(db);
  res.json({ campaign: c });
});
app.delete("/api/campaigns/:id", auth, async (req, res) => {
  const db = await readDb();
  const c = db.campaigns.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Campaign not found." });
  await createBackupSnapshot("before_campaign_delete");
  db.campaigns = db.campaigns.filter((x) => x.id !== req.params.id);
  for (const p of db.posts) {
    if (p.campaignId === req.params.id) {
      p.campaignId = "";
    }
  }
  logEntry(db, "campaign_deleted", `Deleted campaign "${c.name}" (linked posts preserved safely)`);
  await writeDb(db);
  res.json({ ok: true });
});
app.post("/api/upload", auth, upload.single("media"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({
      error: "Upload a valid image (JPG, PNG, WEBP, GIF up to 12 MB) or video (MP4, WEBM, MOV up to 50 MB)."
    });
  }
  const spec = ALLOWED_MIMES[file.mimetype];
  if (!spec) {
    await import_promises.default.unlink(file.path).catch(() => {
    });
    return res.status(400).json({ error: `Unsupported media MIME type: ${file.mimetype}` });
  }
  if (spec.category === "image" && file.size > 12 * 1024 * 1024) {
    await import_promises.default.unlink(file.path).catch(() => {
    });
    return res.status(400).json({ error: "Image file size exceeds the 12 MB limit." });
  }
  const targetFilename = `${file.filename}${spec.ext}`;
  const targetPath = import_node_path.default.join(UPLOAD_DIR, targetFilename);
  await import_promises.default.rename(file.path, targetPath);
  const db = await readDb();
  const asset = {
    id: import_node_crypto.default.randomUUID(),
    filename: targetFilename,
    originalName: String(file.originalname || targetFilename).slice(0, 200),
    url: `/uploads/${targetFilename}`,
    mimeType: file.mimetype,
    category: spec.category,
    sizeBytes: file.size,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.media.unshift(asset);
  logEntry(db, "media_uploaded", `Uploaded ${spec.category}: ${asset.originalName} (${Math.round(file.size / 1024)} KB)`);
  await writeDb(db);
  res.json({
    imageUrl: asset.url,
    // Backward compatible key
    media: asset
  });
});
app.get("/api/media", auth, async (_req, res) => {
  const db = await readDb();
  res.json({ media: db.media });
});
app.delete("/api/media/:id", auth, async (req, res) => {
  const db = await readDb();
  const asset = db.media.find((m) => m.id === req.params.id);
  if (!asset) return res.status(404).json({ error: "Media asset not found." });
  const linkedPosts = db.posts.filter(
    (p) => p.imageUrl === asset.url || p.mediaUrls.includes(asset.url)
  );
  if (linkedPosts.length > 0 && req.query.force !== "true") {
    return res.status(409).json({
      error: `This file is currently used by ${linkedPosts.length} post(s). Pass ?force=true to remove it and unlink those references.`,
      linkedPostCount: linkedPosts.length
    });
  }
  const filePath = import_node_path.default.join(UPLOAD_DIR, import_node_path.default.basename(asset.url));
  await import_promises.default.unlink(filePath).catch(() => {
  });
  db.media = db.media.filter((m) => m.id !== req.params.id);
  for (const p of linkedPosts) {
    if (p.imageUrl === asset.url) p.imageUrl = "";
    p.mediaUrls = p.mediaUrls.filter((u) => u !== asset.url);
  }
  logEntry(db, "media_deleted", `Deleted media file: ${asset.originalName}`);
  await writeDb(db);
  res.json({ ok: true });
});
async function generateWithFreeAi(db, prompt, systemInstruction, requestedProvider) {
  const pref = requestedProvider || db.settings?.preferredAiProvider || "auto";
  if (pref === "manual") {
    throw new Error("AI generation is set to Manual Mode in AI Provider Settings.");
  }
  const ollamaUrl = (db.settings?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(
    /\/$/,
    ""
  );
  const ollamaModel = db.settings?.ollamaModel || process.env.OLLAMA_MODEL || "llama3.2";
  const geminiModel = db.settings?.geminiModel || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const errors = [];
  if (pref === "ollama" || pref === "auto") {
    const probe = await probeOllama(ollamaUrl);
    if (probe.reachable) {
      const modelToUse = probe.models.includes(ollamaModel) || probe.models.some((m) => m.startsWith(ollamaModel)) ? ollamaModel : probe.models[0] || ollamaModel;
      const r = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelToUse,
          system: systemInstruction,
          prompt,
          stream: false
        })
      });
      if (r.ok) {
        const d = await r.json();
        const text = String(d.response || "").trim();
        if (text) {
          return { text, provider: "Ollama (Local Free AI)", model: modelToUse };
        }
      } else {
        const errBody = await r.text().catch(() => "");
        errors.push(`Ollama (${modelToUse}) returned HTTP ${r.status}: ${errBody.slice(0, 160)}`);
      }
    } else if (pref === "ollama") {
      throw new Error(
        probe.error || `Ollama is not reachable at ${ollamaUrl}. Start Ollama locally or switch to Manual / Gemini Free-Tier.`
      );
    } else if (probe.error) {
      errors.push(probe.error);
    }
  }
  if (pref === "gemini" || pref === "auto") {
    if (!hasValidGeminiKey()) {
      errors.push("GEMINI_API_KEY is not configured in server environment variables.");
    } else if (!FREE_ELIGIBLE_GEMINI_MODELS.has(geminiModel)) {
      errors.push(
        `Configured Gemini model "${geminiModel}" is blocked because only Free-Tier eligible Flash models are permitted.`
      );
    } else {
      try {
        let text = "";
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build"
              }
            }
          });
          const response = await ai.models.generateContent({
            model: geminiModel,
            contents: prompt,
            config: {
              systemInstruction
            }
          });
          text = String(response.text || "").trim();
        } catch (sdkErr) {
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(String(process.env.GEMINI_API_KEY || ""))}`;
          const restRes = await fetch(restUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "aistudio-build"
            },
            body: JSON.stringify({
              systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : void 0,
              contents: [{ role: "user", parts: [{ text: prompt }] }]
            })
          });
          const restJson = await restRes.json();
          if (!restRes.ok) {
            throw new Error(restJson?.error?.message || sdkErr?.message || `Gemini HTTP ${restRes.status}`);
          }
          text = String(
            restJson?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || ""
          ).trim();
        }
        if (!text) {
          throw new Error("Gemini returned an empty response.");
        }
        return {
          text,
          provider: "Google Gemini (Free-Tier Eligible)",
          model: geminiModel
        };
      } catch (e) {
        const msg = String(e?.message || e || "Unknown Gemini error");
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
          throw new Error(
            "Gemini Free-Tier quota exhausted (HTTP 429 RESOURCE_EXHAUSTED). Wait for your free quota window to reset, use local Ollama, or create content manually."
          );
        }
        if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_INVALID")) {
          throw new Error(
            "Gemini API key is invalid or lacks permission. Check GEMINI_API_KEY in server configuration or switch to Ollama / Manual editing."
          );
        }
        errors.push(`Gemini (${geminiModel}) error: ${msg}`);
      }
    }
  }
  throw new Error(
    `No Free AI provider is currently available. ${errors.join(" | ")} \u2014 You can continue creating, editing, and importing all posts manually without any paid API.`
  );
}
app.post("/api/ai/caption", auth, aiLimiter, async (req, res) => {
  const {
    topic = "Practical workflow automation",
    audience = "Small businesses and professionals",
    tone = "Professional and motivating",
    goal = "Engagement and education",
    includeHashtags = true,
    language = "English",
    platform = "facebook",
    postType = "image",
    length = "medium",
    seriesName = "",
    businessName = "TopTech Solutions",
    provider
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
Series: ${seriesName || "Standalone"}
Target Audience: ${audience}
Language: ${language}
Tone: ${tone}
Goal: ${goal}
Desired Length: ${length}
Include Hashtags: ${includeHashtags ? "Yes (include #TopTechSolutions)" : "No"}

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
    let parsed = {};
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { caption: result.text };
    } catch {
      parsed = { caption: result.text };
    }
    const caption = String(parsed.caption || result.text).slice(0, platformSpec.maxCaptionLength);
    logEntry(db, "ai_generated", `Generated ${platformSpec.name} ${postTypeSpec.name} via ${result.provider}`);
    await writeDb(db);
    return res.json({
      title: String(parsed.title || topic).slice(0, platformSpec.maxTitleLength),
      caption,
      articleText: String(parsed.articleText || ""),
      hashtags: includeHashtags ? String(parsed.hashtags || "#TopTechSolutions") : "",
      platformTags: String(parsed.platformTags || ""),
      callToAction: String(parsed.callToAction || ""),
      provider: result.provider,
      model: result.model
    });
  } catch (e) {
    return res.status(503).json({ error: e.message || "Free AI generation failed." });
  }
});
app.post("/api/ai/campaign-generate", auth, aiLimiter, async (req, res) => {
  const { campaignId, overwriteExisting = false, provider } = req.body || {};
  const db = await readDb();
  const campaign = db.campaigns.find((c) => c.id === campaignId);
  if (!campaign) return res.status(404).json({ error: "Campaign not found." });
  const platformsToGenerate = campaign.selectedPlatforms.filter((plat) => {
    const existing = db.posts.find((p) => p.campaignId === campaign.id && p.platform === plat);
    if (!existing) return true;
    if (existing.isManuallyEdited && !overwriteExisting) return false;
    return overwriteExisting;
  });
  if (platformsToGenerate.length === 0) {
    return res.status(400).json({
      error: "All selected platforms in this campaign already have manually edited posts. Enable overwrite only if you intentionally want to replace drafts."
    });
  }
  const platformRequirements = platformsToGenerate.map((plat) => {
    const spec = PLATFORMS[plat];
    const pType = campaign.platformPostTypes[plat] || spec.defaultPostType;
    return `- platform: "${plat}" (${spec.name}), postType: "${pType}" (${POST_TYPES[pType].name}), maxCaptionLength: ${spec.maxCaptionLength}, recommendedHashtags: ${spec.recommendedHashtagCount.min}-${spec.recommendedHashtagCount.max}, metadataTagsType: "${spec.platformTagsLabel}"`;
  }).join("\n");
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
      throw new Error("AI response did not contain a valid JSON array of platform posts.");
    }
    const items = JSON.parse(jsonMatch[0]);
    const createdOrUpdated = [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const plat of platformsToGenerate) {
      const spec = PLATFORMS[plat];
      const pType = campaign.platformPostTypes[plat] || spec.defaultPostType;
      const item = items.find((x) => normalizePlatform(x.platform) === plat) || items[0] || {};
      const existing = db.posts.find((p) => p.campaignId === campaign.id && p.platform === plat);
      if (existing && existing.status !== "published") {
        existing.title = String(item.title || `${campaign.name} \u2014 ${spec.name}`).slice(0, spec.maxTitleLength);
        existing.caption = String(item.caption || campaign.topic).slice(0, spec.maxCaptionLength);
        existing.articleText = String(item.articleText || "");
        existing.hashtags = String(item.hashtags || "#TopTechSolutions");
        existing.platformTags = String(item.platformTags || "");
        existing.callToAction = String(item.callToAction || "");
        existing.postType = pType;
        existing.isManuallyEdited = false;
        existing.updatedAt = now;
        createdOrUpdated.push(existing);
      } else if (!existing) {
        const newPost = normalizePostRecord({
          id: import_node_crypto.default.randomUUID(),
          campaignId: campaign.id,
          title: String(item.title || `${campaign.name} \u2014 ${spec.name}`).slice(0, spec.maxTitleLength),
          topic: campaign.topic,
          seriesName: campaign.name,
          episodeNumber: "1",
          platform: plat,
          postType: pType,
          caption: String(item.caption || campaign.topic).slice(0, spec.maxCaptionLength),
          articleText: String(item.articleText || ""),
          hashtags: String(item.hashtags || "#TopTechSolutions"),
          platformTags: String(item.platformTags || ""),
          callToAction: String(item.callToAction || ""),
          destinationUrl: "",
          imageUrl: "",
          mediaUrls: [],
          mediaFilename: "",
          scheduledAt: "",
          status: "draft",
          isManuallyEdited: false,
          createdAt: now,
          updatedAt: now
        });
        db.posts.push(newPost);
        createdOrUpdated.push(newPost);
      }
    }
    logEntry(
      db,
      "campaign_ai_generated",
      `Generated ${createdOrUpdated.length} platform-specific posts for campaign "${campaign.name}" via ${result.provider}`
    );
    await writeDb(db);
    res.json({
      posts: createdOrUpdated,
      provider: result.provider,
      model: result.model
    });
  } catch (e) {
    res.status(503).json({ error: e.message || "Failed to generate campaign posts." });
  }
});
function inspectCsvRows(rawRows, db, defaultCampaignId = "") {
  const seenKeys = /* @__PURE__ */ new Set();
  const existingKeys = new Set(
    db.posts.map(
      (p) => `${p.campaignId.toLowerCase()}|${p.platform}|${p.title.trim().toLowerCase()}|${p.caption.trim().slice(0, 120).toLowerCase()}`
    )
  );
  return rawRows.map((row, idx) => {
    const rowNumber = idx + 1;
    const platform = normalizePlatform(row.platform);
    const postType = normalizePostType(row.post_type || row.postType, platform);
    const campaignId = String(row.campaign_id || row.campaignId || defaultCampaignId || "").trim();
    const title = String(row.post_title || row.title || "").trim().slice(0, 200);
    const caption = String(row.caption || row.content || row.text || row.article_text || "").trim();
    const articleText = String(row.article_text || "").trim();
    const hashtags = String(row.hashtags || "").trim();
    const platformTags = String(row.platform_tags || row.platformTags || "").trim();
    const callToAction = String(row.call_to_action || row.callToAction || "").trim();
    const destinationUrl = String(row.destination_url || row.destinationUrl || "").trim();
    const mediaFilename = String(row.media_filename || row.image_filename || "").trim();
    let mediaUrl = String(row.media_url || row.image_url || "").trim();
    let mediaStatus = "none";
    if (mediaUrl && /^https?:\/\/|^\/uploads\//i.test(mediaUrl)) {
      mediaStatus = mediaUrl.startsWith("/uploads/") ? "matched_in_library" : "external_url";
    } else if (mediaFilename) {
      const matched = db.media.find(
        (m) => m.originalName.toLowerCase() === mediaFilename.toLowerCase() || m.filename.toLowerCase() === mediaFilename.toLowerCase()
      );
      if (matched) {
        mediaUrl = matched.url;
        mediaStatus = "matched_in_library";
      } else {
        mediaStatus = "missing_upload_separately";
      }
    }
    const rawDate = String(row.scheduled_at || row.scheduled_date || row.publish_at || "").trim();
    let scheduledAt = "";
    const dateInvalid = Boolean(rawDate && Number.isNaN(Date.parse(rawDate)));
    if (rawDate && !dateInvalid) {
      scheduledAt = new Date(rawDate).toISOString();
    }
    const rawStatus = String(row.status || "draft").trim().toLowerCase();
    const status = rawStatus === "approved" ? "approved" : "draft";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const normalizedPost = normalizePostRecord({
      id: import_node_crypto.default.randomUUID(),
      campaignId,
      title,
      topic: String(row.topic || row.series_name || "CSV Bulk Import").slice(0, 160),
      seriesName: String(row.series_name || "").slice(0, 160),
      episodeNumber: String(row.episode_number || "").slice(0, 40),
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
      updatedAt: now
    });
    const validation = validatePostInput(normalizedPost, false);
    if (dateInvalid) {
      validation.errors.push(`Invalid date format in scheduled_at: "${rawDate}".`);
      validation.valid = false;
    }
    const dedupeKey = `${campaignId.toLowerCase()}|${platform}|${title.toLowerCase()}|${caption.slice(0, 120).toLowerCase()}`;
    const isDuplicateInDb = Boolean(caption && existingKeys.has(dedupeKey));
    const isDuplicateInBatch = Boolean(caption && seenKeys.has(dedupeKey));
    if (caption) seenKeys.add(dedupeKey);
    if (isDuplicateInDb) {
      validation.warnings.push("Identical post (same campaign, platform, title, and caption) already exists in database.");
    }
    if (isDuplicateInBatch) {
      validation.warnings.push("Duplicate row detected within this CSV file.");
    }
    return {
      rowNumber,
      title: title || "(Untitled)",
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
      normalizedPost
    };
  });
}
app.post("/api/import/csv/validate", auth, async (req, res) => {
  const { csvText, rows, campaignId = "" } = req.body || {};
  const parsedRows = typeof csvText === "string" && csvText.trim() ? parseCsvText(csvText) : Array.isArray(rows) ? rows : [];
  if (!parsedRows.length) {
    return res.status(400).json({ error: "No valid CSV rows found. Ensure your file has a header row and at least one data row." });
  }
  if (parsedRows.length > 500) {
    return res.status(400).json({ error: "CSV import is limited to 500 rows per batch." });
  }
  const db = await readDb();
  const previews = inspectCsvRows(parsedRows, db, campaignId);
  res.json({
    totalRows: previews.length,
    validRows: previews.filter((r) => r.valid).length,
    invalidRows: previews.filter((r) => !r.valid).length,
    duplicateRows: previews.filter((r) => r.isDuplicateInDb || r.isDuplicateInBatch).length,
    missingMediaRows: previews.filter((r) => r.mediaStatus === "missing_upload_separately").length,
    rows: previews
  });
});
app.post("/api/import/csv", auth, async (req, res) => {
  const { csvText, rows, campaignId = "", skipDuplicates = true } = req.body || {};
  const parsedRows = typeof csvText === "string" && csvText.trim() ? parseCsvText(csvText) : Array.isArray(rows) ? rows : [];
  if (!parsedRows.length) return res.status(400).json({ error: "No CSV rows received." });
  if (parsedRows.length > 500) return res.status(400).json({ error: "Import is limited to 500 rows per batch." });
  const db = await readDb();
  await createBackupSnapshot("before_csv_import");
  const previews = inspectCsvRows(parsedRows, db, campaignId);
  const created = [];
  const rejected = [];
  for (const item of previews) {
    if (!item.valid) {
      rejected.push({ rowNumber: item.rowNumber, reason: item.errors.join("; ") });
      continue;
    }
    if (skipDuplicates && (item.isDuplicateInDb || item.isDuplicateInBatch)) {
      rejected.push({ rowNumber: item.rowNumber, reason: "Skipped duplicate post (idempotent import)." });
      continue;
    }
    db.posts.push(item.normalizedPost);
    created.push(item.normalizedPost);
  }
  logEntry(
    db,
    "bulk_import",
    `Imported ${created.length} platform posts as drafts (${rejected.length} skipped/rejected)`,
    null
  );
  await writeDb(db);
  res.json({
    imported: created.length,
    skipped: rejected.length,
    rejectedDetails: rejected,
    importedIds: created.map((p) => p.id),
    message: `Imported ${created.length} post(s) as drafts. ${rejected.length ? `${rejected.length} row(s) skipped.` : "All rows validated."}`
  });
});
app.get("/api/export/csv", auth, async (req, res) => {
  const db = await readDb();
  const campaignId = typeof req.query.campaignId === "string" ? req.query.campaignId : "";
  const targetPosts = campaignId ? db.posts.filter((p) => p.campaignId === campaignId) : db.posts;
  const csv = serializePostsToCsv(targetPosts);
  const filename = campaignId ? `toptech-campaign-${campaignId.slice(0, 12)}.csv` : "toptech-social-posts.csv";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + csv);
});
app.post("/api/posts/bulk-schedule", auth, async (req, res) => {
  const {
    ids,
    startAt,
    cadence = "daily",
    timeGapHours = 24,
    platformStaggerMinutes = 30
  } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: "Select at least one post to schedule." });
  }
  if (!startAt || Number.isNaN(Date.parse(startAt))) {
    return res.status(400).json({ error: "Choose a valid schedule start date and time." });
  }
  if (ids.length > 500) {
    return res.status(400).json({ error: "Scheduling is limited to 500 posts per batch." });
  }
  const allowedCadences = ["daily", "three-weekly", "weekly", "custom-hours", "platform-staggered"];
  if (!allowedCadences.includes(cadence)) {
    return res.status(400).json({ error: "Invalid scheduling cadence." });
  }
  const db = await readDb();
  const intervalMs = cadence === "daily" ? 24 * 36e5 : cadence === "three-weekly" ? 8 * 36e5 : cadence === "weekly" ? 168 * 36e5 : cadence === "platform-staggered" ? Math.max(5, Math.min(1440, Number(platformStaggerMinutes) || 30)) * 6e4 : Math.max(1, Math.min(720, Number(timeGapHours) || 24)) * 36e5;
  let cursor = Date.parse(startAt);
  let updated = 0;
  const skippedReasons = [];
  for (const id of ids) {
    const post = db.posts.find((p) => p.id === id);
    if (!post) {
      skippedReasons.push({ id, title: id, reason: "Post not found" });
      continue;
    }
    if (post.status === "published") {
      skippedReasons.push({ id, title: post.title || post.topic, reason: "Already published" });
      continue;
    }
    const candidateSchedule = new Date(cursor).toISOString();
    const check = validatePostInput({ ...post, scheduledAt: candidateSchedule, status: "scheduled" }, true);
    if (!check.valid) {
      skippedReasons.push({
        id,
        title: post.title || post.topic,
        reason: check.errors.join(" ")
      });
      continue;
    }
    post.scheduledAt = candidateSchedule;
    post.status = "scheduled";
    post.lastError = null;
    post.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    cursor += intervalMs;
    updated++;
  }
  logEntry(
    db,
    "bulk_schedule",
    `Scheduled ${updated} post(s) using ${cadence} cadence (${skippedReasons.length} skipped due to validation)`,
    null
  );
  await writeDb(db);
  res.json({
    scheduled: updated,
    skipped: skippedReasons.length,
    skippedDetails: skippedReasons,
    message: `${updated} post(s) scheduled.${skippedReasons.length ? ` ${skippedReasons.length} post(s) remained drafts because required media or fields were missing.` : ""}`
  });
});
app.get("/api/prompts/master", auth, (_req, res) => {
  res.json({
    prompt: `TOPTECH SOCIAL STUDIO v2.0 \u2014 MULTI-PLATFORM CAMPAIGN & CSV MASTER PROMPT

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
4. Set status to "draft" for human review. Never fabricate statistics, client testimonials, or guarantees.`
  });
});
app.post("/api/facebook/test", auth, async (_req, res) => {
  const db = await readDb();
  const creds = getEffectiveMetaCredentials(db);
  if (!creds.metaConfigured) {
    return res.status(503).json({
      error: "Missing credentials: Configure or auto-discover META_PAGE_ID and META_PAGE_ACCESS_TOKEN in the Login Info tab or server .env first."
    });
  }
  try {
    const u = new URL(`https://graph.facebook.com/${creds.graphVersion}/${creds.pageId}`);
    u.searchParams.set("fields", "id,name,category,fan_count");
    u.searchParams.set("access_token", creds.accessToken);
    const r = await fetch(u);
    const d = await r.json();
    if (!r.ok) {
      const code = d.error?.code;
      const hint = code === 190 ? " (Token expired or invalid \u2014 generate a fresh Page Access Token in Meta for Developers)." : code === 10 || code === 200 ? " (Missing Page permissions \u2014 ensure pages_read_engagement and pages_manage_posts are granted)." : "";
      return res.status(502).json({ error: `${d.error?.message || "Meta API check failed."}${hint}` });
    }
    db.settings = db.settings || {};
    db.settings.metaPageId = String(d.id || creds.pageId);
    db.settings.metaPageName = String(d.name || "");
    db.settings.metaPageCategory = String(d.category || "Facebook Page");
    await writeDb(db);
    res.json({
      ok: true,
      page: {
        id: d.id,
        name: d.name,
        category: d.category || "Facebook Page"
      }
    });
  } catch (e) {
    res.status(502).json({ error: `Meta Graph API connection failed: ${e.message}` });
  }
});
async function publishFacebookPost(post, db) {
  if (post.platform !== "facebook") {
    throw new Error(
      `Direct API publishing is only implemented for Facebook Pages. "${PLATFORMS[post.platform].name}" is configured for content planning, scheduling, and CSV export only.`
    );
  }
  const creds = getEffectiveMetaCredentials(db);
  if (!creds.metaConfigured) {
    throw new Error("Meta Page ID or Page Access Token is missing in Login Info / server environment.");
  }
  const validation = validatePostInput(post, true);
  if (!validation.valid) {
    throw new Error(`Post failed pre-publish validation: ${validation.errors.join(" ")}`);
  }
  const base = `https://graph.facebook.com/${creds.graphVersion}/${creds.pageId}`;
  const fullMessage = [
    post.caption.trim(),
    post.callToAction ? `

${post.callToAction}` : "",
    post.destinationUrl && post.postType !== "link" ? `
${post.destinationUrl}` : "",
    post.hashtags ? `

${post.hashtags.trim()}` : ""
  ].join("").trim();
  const form = new FormData();
  form.set("access_token", creds.accessToken);
  let endpoint = `${base}/feed`;
  const primaryMedia = post.imageUrl || post.mediaUrls[0] || "";
  if (post.postType === "link" && post.destinationUrl && !primaryMedia) {
    form.set("message", fullMessage);
    form.set("link", post.destinationUrl);
    endpoint = `${base}/feed`;
  } else if (primaryMedia) {
    const isVideo = /\.(mp4|webm|mov)$/i.test(primaryMedia) || post.postType === "video" || post.postType === "reel";
    const localFile = primaryMedia.startsWith("/uploads/") ? import_node_path.default.join(UPLOAD_DIR, import_node_path.default.basename(primaryMedia)) : null;
    if (localFile) {
      const buf = await import_promises.default.readFile(localFile);
      const ext = import_node_path.default.extname(localFile).toLowerCase();
      if (isVideo) {
        const mime = ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : "video/mp4";
        form.set("description", fullMessage);
        if (post.title) form.set("title", post.title);
        form.set("source", new Blob([buf], { type: mime }), import_node_path.default.basename(localFile));
        endpoint = `${base}/videos`;
      } else {
        const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
        form.set("message", fullMessage);
        form.set("source", new Blob([buf], { type: mime }), import_node_path.default.basename(localFile));
        endpoint = `${base}/photos`;
      }
    } else {
      if (isVideo) {
        form.set("description", fullMessage);
        if (post.title) form.set("title", post.title);
        form.set("file_url", primaryMedia);
        endpoint = `${base}/videos`;
      } else {
        form.set("message", fullMessage);
        form.set("url", primaryMedia);
        endpoint = `${base}/photos`;
      }
    }
  } else {
    form.set("message", fullMessage);
    endpoint = `${base}/feed`;
  }
  const r = await fetch(endpoint, { method: "POST", body: form });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data?.error?.message || `Facebook Graph API error (HTTP ${r.status}).`);
  }
  return data;
}
app.post("/api/posts/:id/publish-now", auth, async (req, res) => {
  const db = await readDb();
  const creds = getEffectiveMetaCredentials(db);
  if (!creds.publishingEnabled) {
    return res.status(403).json({
      error: "Facebook publishing is disabled by default for safety. Enable ENABLE_FACEBOOK_PUBLISHING in the Login Info tab or server .env after verifying your Meta Page connection."
    });
  }
  const p = db.posts.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Post not found." });
  if (p.platform !== "facebook") {
    return res.status(400).json({
      error: `Only Facebook Page posts can be published directly via Graph API. This post targets ${PLATFORMS[p.platform].name}.`
    });
  }
  if (p.status === "published" || p.facebookPostId) {
    return res.status(409).json({
      error: `This post was already published (Facebook ID: ${p.facebookPostId || "recorded"}). Duplicate publication prevented.`
    });
  }
  if (inFlightPublishIds.has(p.id)) {
    return res.status(409).json({ error: "Publication is already in progress for this post." });
  }
  inFlightPublishIds.add(p.id);
  try {
    const result = await publishFacebookPost(p, db);
    p.status = "published";
    p.publishedAt = (/* @__PURE__ */ new Date()).toISOString();
    p.updatedAt = p.publishedAt;
    p.facebookPostId = result.id || result.post_id || `fb-${Date.now()}`;
    p.lastError = null;
    logEntry(db, "published", `Published to Facebook Page: ${p.title || p.topic}`, p.id);
    await writeDb(db);
    res.json({ ok: true, post: p });
  } catch (e) {
    p.status = "failed";
    p.lastError = e.message;
    p.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    logEntry(db, "error", `Facebook publish failed: ${e.message}`, p.id);
    await writeDb(db);
    res.status(502).json({ error: e.message, post: p });
  } finally {
    inFlightPublishIds.delete(p.id);
  }
});
app.get("/api/export", auth, async (_req, res) => {
  const db = await readDb();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="toptech-social-backup.json"');
  res.send(JSON.stringify(db, null, 2));
});
app.get("/api/backups", auth, async (_req, res) => {
  try {
    const files = (await import_promises.default.readdir(BACKUP_DIR)).filter((f) => f.endsWith(".json")).sort().reverse();
    const items = await Promise.all(
      files.map(async (filename) => {
        const stat = await import_promises.default.stat(import_node_path.default.join(BACKUP_DIR, filename));
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString()
        };
      })
    );
    res.json({ backups: items });
  } catch {
    res.json({ backups: [] });
  }
});
app.post("/api/backups", auth, async (_req, res) => {
  const filename = await createBackupSnapshot("manual_snapshot");
  const db = await readDb();
  logEntry(db, "backup_created", `Created manual data snapshot: ${filename}`);
  await writeDb(db);
  res.json({ ok: true, filename });
});
app.post("/api/backups/:filename/restore", auth, async (req, res) => {
  const filename = import_node_path.default.basename(req.params.filename);
  const target = import_node_path.default.join(BACKUP_DIR, filename);
  try {
    const raw = await import_promises.default.readFile(target, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.posts)) {
      return res.status(400).json({ error: "Invalid backup file structure." });
    }
    await createBackupSnapshot("before_restore");
    await import_promises.default.writeFile(DB_FILE, JSON.stringify(parsed, null, 2), "utf8");
    const db = await readDb();
    logEntry(db, "backup_restored", `Restored database from backup: ${filename}`);
    await writeDb(db);
    res.json({ ok: true, message: `Restored ${db.posts.length} posts from ${filename}.` });
  } catch (e) {
    res.status(404).json({ error: `Could not restore backup: ${e.message}` });
  }
});
var schedulerBusy = false;
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
    const due = db.posts.filter(
      (p) => p.platform === "facebook" && p.status === "scheduled" && !p.facebookPostId && !inFlightPublishIds.has(p.id) && p.scheduledAt && Date.parse(p.scheduledAt) <= now
    ).slice(0, 5);
    for (const p of due) {
      inFlightPublishIds.add(p.id);
      try {
        const result = await publishFacebookPost(p, db);
        p.status = "published";
        p.publishedAt = (/* @__PURE__ */ new Date()).toISOString();
        p.updatedAt = p.publishedAt;
        p.facebookPostId = result.id || result.post_id || `fb-${Date.now()}`;
        p.lastError = null;
        logEntry(db, "published", `Auto-published to Facebook Page: ${p.title || p.topic}`, p.id);
      } catch (e) {
        p.status = "failed";
        p.lastError = e.message;
        p.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        logEntry(db, "error", `Auto-publish failed: ${e.message}`, p.id);
      } finally {
        inFlightPublishIds.delete(p.id);
      }
    }
    if (due.length) await writeDb(db);
  } catch (e) {
    console.error("Scheduler error:", e.message);
  } finally {
    schedulerBusy = false;
  }
}
setInterval(schedulerTick, 3e4).unref();
var hasBuiltDist = import_node_fs.default.existsSync(import_node_path.default.join(DIST_DIR, "index.html"));
var useViteDevServer = process.env.VITE_DEV_SERVER === "true" || process.env.NODE_ENV !== "production" && !hasBuiltDist;
if (!useViteDevServer) {
  app.use(import_express.default.static(DIST_DIR));
  app.use(import_express.default.static(PUBLIC_DIR));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      return next();
    }
    const indexPath = import_node_path.default.join(DIST_DIR, "index.html");
    if (import_node_fs.default.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(200).send("TopTech Social Studio server is running. Run npm run build to generate dist/index.html.");
  });
}
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err?.message || "Unexpected server error." });
});
if (useViteDevServer) {
  import("vite").then(async ({ createServer: createViteServer }) => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.listen(PORT, () => {
      console.log(`TopTech Social Studio v2.0 (dev) listening on port ${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to start Vite dev server:", err);
  });
} else {
  app.listen(PORT, () => {
    console.log(`TopTech Social Studio v2.0 listening on port ${PORT}`);
  });
}
var server_app_default = app;
