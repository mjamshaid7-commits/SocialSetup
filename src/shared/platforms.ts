export type PlatformId =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'threads';

export type PostTypeId =
  | 'image'
  | 'video'
  | 'text'
  | 'carousel'
  | 'reel'
  | 'story'
  | 'link'
  | 'youtube_video';

export type PostStatus =
  | 'draft'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed';

export interface PostTypeSpec {
  id: PostTypeId;
  name: string;
  description: string;
  requiresMedia: boolean;
  allowedMediaCategories: ('image' | 'video')[];
  maxMediaFiles: number;
  requiresTitle: boolean;
  requiresDestinationUrl: boolean;
}

export interface PlatformSpec {
  id: PlatformId;
  name: string;
  handlePrefix: string;
  supportedPostTypes: PostTypeId[];
  defaultPostType: PostTypeId;
  maxCaptionLength: number;
  maxTitleLength: number;
  recommendedHashtagCount: { min: number; max: number };
  supportsPlatformTags: boolean;
  platformTagsLabel: string;
  platformTagsPlaceholder: string;
  publishingSupport: 'server_graph_api' | 'planning_and_export_only';
  publishingDescription: string;
  mediaRequirementsNote: string;
}

export const POST_TYPES: Record<PostTypeId, PostTypeSpec> = {
  image: {
    id: 'image',
    name: 'Image Post with Caption',
    description: 'Single static image (JPG, PNG, WEBP, GIF) paired with platform caption and hashtags.',
    requiresMedia: true,
    allowedMediaCategories: ['image'],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false,
  },
  video: {
    id: 'video',
    name: 'Video Post with Caption',
    description: 'Standard feed video (MP4, WEBM, MOV) paired with caption and metadata tags.',
    requiresMedia: true,
    allowedMediaCategories: ['video'],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false,
  },
  text: {
    id: 'text',
    name: 'Text-Only Post',
    description: 'Pure text update, thought-leadership post, thread starter, or long-form article.',
    requiresMedia: false,
    allowedMediaCategories: ['image', 'video'],
    maxMediaFiles: 0,
    requiresTitle: false,
    requiresDestinationUrl: false,
  },
  carousel: {
    id: 'carousel',
    name: 'Multi-Image Carousel',
    description: '2 to 10 swipeable images with a unified caption and call to action.',
    requiresMedia: true,
    allowedMediaCategories: ['image'],
    maxMediaFiles: 10,
    requiresTitle: false,
    requiresDestinationUrl: false,
  },
  reel: {
    id: 'reel',
    name: 'Reel / Short-Form Video',
    description: 'Vertical 9:16 short-form video (Reels, TikTok, YouTube Shorts).',
    requiresMedia: true,
    allowedMediaCategories: ['video'],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false,
  },
  story: {
    id: 'story',
    name: '24-Hour Story',
    description: 'Vertical ephemeral image or short video story asset.',
    requiresMedia: true,
    allowedMediaCategories: ['image', 'video'],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: false,
  },
  link: {
    id: 'link',
    name: 'Link Preview Post',
    description: 'Post sharing an external article or landing page URL with commentary.',
    requiresMedia: false,
    allowedMediaCategories: ['image'],
    maxMediaFiles: 1,
    requiresTitle: false,
    requiresDestinationUrl: true,
  },
  youtube_video: {
    id: 'youtube_video',
    name: 'YouTube Video (Title, Description & Tags)',
    description: 'Full YouTube video package requiring video title, structured description, and search tags.',
    requiresMedia: true,
    allowedMediaCategories: ['video'],
    maxMediaFiles: 1,
    requiresTitle: true,
    requiresDestinationUrl: false,
  },
};

export const PLATFORMS: Record<PlatformId, PlatformSpec> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook Page',
    handlePrefix: 'fb.com/',
    supportedPostTypes: ['image', 'video', 'text', 'carousel', 'reel', 'story', 'link'],
    defaultPostType: 'image',
    maxCaptionLength: 63206,
    maxTitleLength: 160,
    recommendedHashtagCount: { min: 2, max: 5 },
    supportsPlatformTags: true,
    platformTagsLabel: 'Collaborator / Page Mentions & Topic Tags',
    platformTagsPlaceholder: '@TopTechSolutions, Digital Transformation, SME Growth',
    publishingSupport: 'server_graph_api',
    publishingDescription: 'Direct publishing supported via Meta Graph API when META_PAGE_ID, META_PAGE_ACCESS_TOKEN, and ENABLE_FACEBOOK_PUBLISHING=true are configured.',
    mediaRequirementsNote: 'Images: JPG/PNG/WEBP/GIF up to 12 MB. Videos: MP4/MOV up to 50 MB.',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    handlePrefix: '@',
    supportedPostTypes: ['image', 'video', 'carousel', 'reel', 'story'],
    defaultPostType: 'image',
    maxCaptionLength: 2200,
    maxTitleLength: 120,
    recommendedHashtagCount: { min: 3, max: 15 },
    supportsPlatformTags: true,
    platformTagsLabel: 'Account Tags, Alt Text & Location Metadata',
    platformTagsPlaceholder: '@toptech.pk, Alt: Developer workspace, Location: Karachi',
    publishingSupport: 'planning_and_export_only',
    publishingDescription: 'Content creation, media staging, campaign scheduling, and CSV export supported. Direct Instagram Graph API publishing is not connected in this build.',
    mediaRequirementsNote: 'Requires visual media (image, carousel, reel, or story). Text-only posts are not supported on Instagram.',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    handlePrefix: 'in/',
    supportedPostTypes: ['text', 'image', 'video', 'carousel', 'link'],
    defaultPostType: 'text',
    maxCaptionLength: 3000,
    maxTitleLength: 150,
    recommendedHashtagCount: { min: 3, max: 5 },
    supportsPlatformTags: true,
    platformTagsLabel: 'Company Mentions & Industry Categories',
    platformTagsPlaceholder: '@TopTech Solutions, B2B SaaS, Enterprise AI',
    publishingSupport: 'planning_and_export_only',
    publishingDescription: 'Content creation, campaign scheduling, and CSV export supported. Direct LinkedIn OAuth API publishing is not connected in this build.',
    mediaRequirementsNote: 'Supports professional text posts, single image, video, multi-image carousel, or external article link.',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    handlePrefix: '@',
    supportedPostTypes: ['text', 'image', 'video', 'link'],
    defaultPostType: 'text',
    maxCaptionLength: 280,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 1, max: 2 },
    supportsPlatformTags: true,
    platformTagsLabel: 'Mentioned Handles & List Context',
    platformTagsPlaceholder: '@TopTechPK',
    publishingSupport: 'planning_and_export_only',
    publishingDescription: 'Content creation, character validation (280 chars), scheduling, and CSV export supported. Direct X API publishing is not connected in this build.',
    mediaRequirementsNote: 'Standard X limit is 280 characters including hashtags. Supports up to 1 image or video attachment.',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    handlePrefix: '@',
    supportedPostTypes: ['reel', 'video', 'image', 'carousel', 'story'],
    defaultPostType: 'reel',
    maxCaptionLength: 4000,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 3, max: 6 },
    supportsPlatformTags: true,
    platformTagsLabel: 'Sound Reference, Cover Text & Categorization',
    platformTagsPlaceholder: 'Cover: 3 AI Tools for SMEs, Category: Tech Education',
    publishingSupport: 'planning_and_export_only',
    publishingDescription: 'Script/caption creation, video staging, scheduling, and CSV export supported. Direct TikTok Content Posting API is not connected in this build.',
    mediaRequirementsNote: 'Requires short-form video (9:16 vertical MP4/MOV) or photo mode image/carousel.',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    handlePrefix: 'youtube.com/@',
    supportedPostTypes: ['youtube_video', 'reel'],
    defaultPostType: 'youtube_video',
    maxCaptionLength: 5000,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 3, max: 5 },
    supportsPlatformTags: true,
    platformTagsLabel: 'YouTube Search Tags (comma-separated metadata tags)',
    platformTagsPlaceholder: 'toptech solutions, software tutorial, ai automation, pakistan tech',
    publishingSupport: 'planning_and_export_only',
    publishingDescription: 'Title, 5,000-char description, search tags, video staging, and CSV export supported. Direct YouTube Data API v3 upload is not connected in this build.',
    mediaRequirementsNote: 'Requires a title (max 100 chars), description (max 5,000 chars), comma-separated video search tags, and a video file before scheduling.',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    handlePrefix: '@',
    supportedPostTypes: ['text', 'image', 'video', 'link'],
    defaultPostType: 'text',
    maxCaptionLength: 500,
    maxTitleLength: 100,
    recommendedHashtagCount: { min: 1, max: 1 },
    supportsPlatformTags: true,
    platformTagsLabel: 'Threads Topic Tag (1 topic tag supported on Threads)',
    platformTagsPlaceholder: 'Tech Threads',
    publishingSupport: 'planning_and_export_only',
    publishingDescription: '500-character validation, topic tag configuration, scheduling, and CSV export supported. Direct Threads API publishing is not connected in this build.',
    mediaRequirementsNote: 'Maximum 500 characters per post. Threads uses a single topic tag rather than long hashtag blocks.',
  },
};

export const PLATFORM_LIST: PlatformSpec[] = Object.values(PLATFORMS);
export const POST_TYPE_LIST: PostTypeSpec[] = Object.values(POST_TYPES);

export interface SocialPost {
  id: string;
  campaignId: string;
  title: string;
  topic: string;
  seriesName: string;
  episodeNumber: string;
  platform: PlatformId;
  postType: PostTypeId;
  caption: string;
  articleText: string;
  hashtags: string;
  platformTags: string;
  callToAction: string;
  destinationUrl: string;
  imageUrl: string; // Preserved for backward compatibility with v1.2
  mediaUrls: string[];
  mediaFilename: string;
  mediaMimeType: string;
  scheduledAt: string;
  status: PostStatus;
  isManuallyEdited: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  facebookPostId: string | null;
  lastError: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  topic: string;
  targetAudience: string;
  businessName: string;
  goals: string;
  tone: string;
  startDate: string;
  durationDays: number;
  selectedPlatforms: PlatformId[];
  platformPostTypes: Partial<Record<PlatformId, PostTypeId>>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  category: 'image' | 'video';
  sizeBytes: number;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  at: string;
  type: string;
  message: string;
  postId: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function normalizePlatform(raw?: string): PlatformId {
  const clean = String(raw || 'facebook').trim().toLowerCase();
  if (clean === 'twitter' || clean === 'x (twitter)' || clean === 'x') return 'x';
  if (clean === 'fb' || clean === 'facebook page') return 'facebook';
  if (clean === 'ig') return 'instagram';
  if (clean === 'yt' || clean === 'youtube shorts') return 'youtube';
  if (clean in PLATFORMS) return clean as PlatformId;
  return 'facebook';
}

export function normalizePostType(raw: string | undefined, platform: PlatformId): PostTypeId {
  const spec = PLATFORMS[platform] || PLATFORMS.facebook;
  const clean = String(raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const map: Record<string, PostTypeId> = {
    image: 'image',
    image_post: 'image',
    photo: 'image',
    video: 'video',
    video_post: 'video',
    text: 'text',
    text_only: 'text',
    article: 'text',
    carousel: 'carousel',
    multi_image: 'carousel',
    reel: 'reel',
    short: 'reel',
    shorts: 'reel',
    short_video: 'reel',
    story: 'story',
    link: 'link',
    link_post: 'link',
    youtube_video: 'youtube_video',
    youtube: 'youtube_video',
  };
  const candidate = map[clean];
  if (candidate && spec.supportedPostTypes.includes(candidate)) {
    return candidate;
  }
  return spec.defaultPostType;
}

export function validatePostInput(
  input: Partial<SocialPost>,
  requireReadyForSchedule = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const platform = normalizePlatform(input.platform);
  const platformSpec = PLATFORMS[platform];
  const postType = input.postType && POST_TYPES[input.postType]
    ? input.postType
    : platformSpec.defaultPostType;
  const postTypeSpec = POST_TYPES[postType];

  if (!platformSpec.supportedPostTypes.includes(postType)) {
    errors.push(
      `Post type "${postTypeSpec.name}" is not supported on ${platformSpec.name}. Supported types: ${platformSpec.supportedPostTypes.map(t => POST_TYPES[t].name).join(', ')}.`
    );
  }

  const caption = String(input.caption || '').trim();
  const articleText = String(input.articleText || '').trim();
  if (!caption && !articleText) {
    errors.push('Caption or post text is required.');
  }

  const hashtags = String(input.hashtags || '').trim();
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

  const title = String(input.title || '').trim();
  if (postTypeSpec.requiresTitle && !title) {
    errors.push(`${postTypeSpec.name} requires a post/video title.`);
  }
  if (title && title.length > platformSpec.maxTitleLength) {
    warnings.push(
      `Title length (${title.length} chars) exceeds ${platformSpec.name}'s recommended ${platformSpec.maxTitleLength} characters.`
    );
  }

  const destinationUrl = String(input.destinationUrl || '').trim();
  if (postTypeSpec.requiresDestinationUrl && !destinationUrl) {
    errors.push(`${postTypeSpec.name} requires a valid destination link URL.`);
  }
  if (destinationUrl && !/^https?:\/\/.+/i.test(destinationUrl)) {
    errors.push('Destination URL must start with http:// or https://.');
  }

  const primaryMedia = String(input.imageUrl || (input.mediaUrls && input.mediaUrls[0]) || '').trim();
  const mediaFilename = String(input.mediaFilename || '').trim();

  if (postTypeSpec.requiresMedia) {
    if (!primaryMedia && requireReadyForSchedule) {
      errors.push(
        `${postTypeSpec.name} on ${platformSpec.name} requires an uploaded or linked media file (${postTypeSpec.allowedMediaCategories.join('/')}) before scheduling or publishing.`
      );
    } else if (!primaryMedia) {
      warnings.push(
        mediaFilename
          ? `Referenced media file "${mediaFilename}" is not yet attached in /uploads/. Upload or assign it before scheduling.`
          : `No media attached yet for ${postTypeSpec.name}. You can save as a draft and attach media later.`
      );
    }
  }

  if (postType === 'carousel') {
    const urls = Array.isArray(input.mediaUrls) && input.mediaUrls.length
      ? input.mediaUrls
      : primaryMedia ? [primaryMedia] : [];
    if (requireReadyForSchedule && urls.length < 2) {
      warnings.push('Multi-image carousel posts typically require at least 2 images.');
    }
  }

  if (platform === 'youtube' && !String(input.platformTags || '').trim()) {
    warnings.push('YouTube videos perform better with comma-separated search metadata tags.');
  }

  if (input.scheduledAt) {
    const parsed = Date.parse(input.scheduledAt);
    if (Number.isNaN(parsed)) {
      errors.push('Invalid scheduled date/time format.');
    }
  } else if (input.status === 'scheduled' || requireReadyForSchedule) {
    errors.push('A valid scheduled date and time is required when status is "scheduled".');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * RFC 4180 compliant UTF-8 CSV parser supporting quoted fields, escaped quotes, and multiline captions/articles.
 */
export function parseCsvText(csvText: string): Record<string, string>[] {
  const cleaned = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
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
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const nonEmptyRows = rows.filter(r => r.some(cell => cell.trim().length > 0));
  if (nonEmptyRows.length < 2) return [];

  const headers = nonEmptyRows[0].map(h =>
    h.trim().toLowerCase().replace(/[\s-]+/g, '_')
  );

  const result: Record<string, string>[] = [];
  for (let r = 1; r < nonEmptyRows.length; r++) {
    const values = nonEmptyRows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (key) {
        obj[key] = (values[c] ?? '').trim();
      }
    }
    result.push(obj);
  }
  return result;
}

export function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializePostsToCsv(posts: SocialPost[]): string {
  const headers = [
    'campaign_id',
    'post_title',
    'topic',
    'series_name',
    'episode_number',
    'platform',
    'post_type',
    'caption',
    'article_text',
    'hashtags',
    'platform_tags',
    'call_to_action',
    'destination_url',
    'media_filename',
    'media_url',
    'scheduled_at',
    'status',
  ];

  const lines = [headers.join(',')];
  for (const p of posts) {
    const row = [
      p.campaignId || '',
      p.title || '',
      p.topic || '',
      p.seriesName || '',
      p.episodeNumber || '',
      p.platform || 'facebook',
      p.postType || 'image',
      p.caption || '',
      p.articleText || '',
      p.hashtags || '',
      p.platformTags || '',
      p.callToAction || '',
      p.destinationUrl || '',
      p.mediaFilename || '',
      p.imageUrl || (p.mediaUrls && p.mediaUrls[0]) || '',
      p.scheduledAt || '',
      p.status || 'draft',
    ].map(escapeCsvCell);
    lines.push(row.join(','));
  }
  return lines.join('\r\n');
}
