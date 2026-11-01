import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar as CalendarIcon,
  PenTool,
  Image as ImageIcon,
  FileSpreadsheet,
  Clock,
  History,
  Cpu,
  Share2,
  Settings,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Edit3,
  Send,
  Copy,
  Printer,
  FileText,
  Lock,
  LogOut,
  ExternalLink,
  Search,
  Database,
  ShieldCheck,
  Sparkles,
  Film,
} from 'lucide-react';
import {
  PLATFORMS,
  PLATFORM_LIST,
  POST_TYPES,
  PlatformId,
  PostTypeId,
  PostStatus,
  SocialPost,
  Campaign,
  MediaAsset,
  ActivityLog,
  validatePostInput,
} from './shared/platforms';
import {
  formatDateTimeKarachi,
  toLocalInputDateTime,
  formatBytes,
  getPlatformLabel,
  getPostTypeLabel,
  generateSampleMultiPlatformCsv,
} from './utils/formatters';

type NavSection =
  | 'dashboard'
  | 'campaigns'
  | 'calendar'
  | 'composer'
  | 'media'
  | 'csv'
  | 'queue'
  | 'history'
  | 'ai-settings'
  | 'platforms'
  | 'login-info'
  | 'settings';

interface DiscoveredFacebookPage {
  id: string;
  name: string;
  category: string;
  link?: string;
  hasAccessToken?: boolean;
}

interface SystemStatus {
  adminUsername: string;
  adminPasswordConfigured: boolean;
  sessionSecretConfigured: boolean;
  strictAuthEnforced: boolean;
  aiConfigured: boolean;
  aiProvider: string;
  preferredAiProvider: 'auto' | 'ollama' | 'gemini' | 'manual';
  ollama: {
    baseUrl: string;
    configuredModel: string;
    reachable: boolean;
    installedModels: string[];
    error: string | null;
    isLocalhost: boolean;
  };
  gemini: {
    keyConfigured: boolean;
    configuredModel: string;
    isFreeTierEligibleModel: boolean;
    allowedFreeModels: string[];
    notice: string;
  };
  metaConfigured: boolean;
  metaPageId?: string;
  metaPageName?: string;
  metaPageCategory?: string;
  metaTokenConfigured?: boolean;
  metaPageIdPreview: string | null;
  facebookAppId?: string;
  discoveredPages?: DiscoveredFacebookPage[];
  publishingEnabled: boolean;
  autoPublishEnabled: boolean;
  graphVersion: string;
  timezone: string;
  nodeEnv: string;
  port?: number;
}

interface BackupItem {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export default function App() {
  // Authentication state
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [requiresProdSetup, setRequiresProdSetup] = useState(false);

  // Navigation & Global state
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Notification banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  // Post Composer State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [compCampaignId, setCompCampaignId] = useState<string>('');
  const [compPlatform, setCompPlatform] = useState<PlatformId>('facebook');
  const [compPostType, setCompPostType] = useState<PostTypeId>('image');
  const [compTitle, setCompTitle] = useState('');
  const [compTopic, setCompTopic] = useState('Workflow Automation');
  const [compSeriesName, setCompSeriesName] = useState('');
  const [compEpisodeNumber, setCompEpisodeNumber] = useState('');
  const [compCaption, setCompCaption] = useState('');
  const [compArticleText, setCompArticleText] = useState('');
  const [compHashtags, setCompHashtags] = useState('#TopTechSolutions');
  const [compPlatformTags, setCompPlatformTags] = useState('');
  const [compCallToAction, setCompCallToAction] = useState('');
  const [compDestinationUrl, setCompDestinationUrl] = useState('');
  const [compMediaUrls, setCompMediaUrls] = useState<string[]>([]);
  const [compMediaFilename, setCompMediaFilename] = useState('');
  const [compScheduledAt, setCompScheduledAt] = useState('');
  const [compStatus, setCompStatus] = useState<PostStatus>('draft');

  // Composer Free AI Assistant state
  const [aiAudience, setAiAudience] = useState('Small businesses, founders, and learners');
  const [aiTone, setAiTone] = useState('Professional, practical, and motivating');
  const [aiGoal, setAiGoal] = useState('Educate audience and drive engagement');
  const [aiLength, setAiLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [aiIncludeHashtags, setAiIncludeHashtags] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Campaign Builder State
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campName, setCampName] = useState('');
  const [campTopic, setCampTopic] = useState('');
  const [campAudience, setCampAudience] = useState('SME Founders, Operations Managers, and Tech Learners');
  const [campBusiness, setCampBusiness] = useState('TopTech Solutions');
  const [campGoals, setCampGoals] = useState('Build authority and generate consultation inquiries');
  const [campTone, setCampTone] = useState('Professional, practical, and clear');
  const [campStartDate, setCampStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [campDurationDays, setCampDurationDays] = useState(14);
  const [campPlatforms, setCampPlatforms] = useState<PlatformId[]>(['facebook', 'linkedin', 'x', 'instagram']);
  const [campPlatformTypes, setCampPlatformTypes] = useState<Partial<Record<PlatformId, PostTypeId>>>({
    facebook: 'image',
    linkedin: 'text',
    x: 'text',
    instagram: 'carousel',
    tiktok: 'reel',
    youtube: 'youtube_video',
    threads: 'text',
  });
  const [campNotes, setCampNotes] = useState('');
  const [campOverwriteManual, setCampOverwriteManual] = useState(false);
  const [campGeneratingId, setCampGeneratingId] = useState<string | null>(null);

  // CSV Bulk Import & Preview State
  const [csvRawText, setCsvRawText] = useState('');
  const [csvTargetCampaignId, setCsvTargetCampaignId] = useState('');
  const [csvSkipDuplicates, setCsvSkipDuplicates] = useState(true);
  const [csvPreviewReport, setCsvPreviewReport] = useState<any | null>(null);
  const [csvValidating, setCsvValidating] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [lastImportedIds, setLastImportedIds] = useState<string[]>([]);

  // Bulk Scheduling State
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [scheduleStartAt, setScheduleStartAt] = useState(() => {
    const t = new Date(Date.now() + 3600_000);
    return toLocalInputDateTime(t.toISOString());
  });
  const [scheduleCadence, setScheduleCadence] = useState<
    'daily' | 'three-weekly' | 'weekly' | 'custom-hours' | 'platform-staggered'
  >('daily');
  const [scheduleGapHours, setScheduleGapHours] = useState(24);
  const [scheduleStaggerMinutes, setScheduleStaggerMinutes] = useState(30);
  const [schedulingBusy, setSchedulingBusy] = useState(false);

  // Media Upload State
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // AI Settings & Master Prompt Builder State
  const [prefAiProvider, setPrefAiProvider] = useState<'auto' | 'ollama' | 'gemini' | 'manual'>('auto');
  const [ollamaUrlInput, setOllamaUrlInput] = useState('http://localhost:11434');
  const [ollamaModelInput, setOllamaModelInput] = useState('llama3.2');
  const [geminiModelInput, setGeminiModelInput] = useState('gemini-2.5-flash');
  const [timezoneInput, setTimezoneInput] = useState('Asia/Karachi');
  const [masterPromptBrand, setMasterPromptBrand] = useState('TopTech Solutions');
  const [masterPromptTopic, setMasterPromptTopic] = useState('Practical AI & Business Workflow Automation');
  const [masterPromptCount, setMasterPromptCount] = useState(10);
  const [fbTesting, setFbTesting] = useState(false);
  const [fbTestResult, setFbTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Login Info Tab State (Variables & Facebook Page Auto-Picker)
  const [liAdminUsername, setLiAdminUsername] = useState('admin');
  const [liMetaPageId, setLiMetaPageId] = useState('');
  const [liMetaPageName, setLiMetaPageName] = useState('');
  const [liMetaGraphVersion, setLiMetaGraphVersion] = useState('v23.0');
  const [liFacebookAppId, setLiFacebookAppId] = useState('');
  const [liEnableFbPublishing, setLiEnableFbPublishing] = useState(false);
  const [liEnableAutoPublish, setLiEnableAutoPublish] = useState(false);
  const [liSaving, setLiSaving] = useState(false);
  const [liAutoDiscoverBusy, setLiAutoDiscoverBusy] = useState(false);

  // Calendar month navigation
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    setBanner({ type, message });
  }

  async function checkSession() {
    try {
      const r = await fetch('/api/session');
      const d = await r.json();
      setAuthenticated(Boolean(d.authenticated));
      setRequiresProdSetup(Boolean(d.requiresSetupInProduction));
      if (d.username) setLoginUsername(d.username);
    } catch {
      setAuthenticated(false);
    } finally {
      setSessionChecked(true);
    }
  }

  function syncStatusToLocalForms(s: SystemStatus) {
    setStatus(s);
    setPrefAiProvider(s.preferredAiProvider || 'auto');
    setOllamaUrlInput(s.ollama.baseUrl);
    setOllamaModelInput(s.ollama.configuredModel);
    setGeminiModelInput(s.gemini.configuredModel);
    setTimezoneInput(s.timezone || 'Asia/Karachi');
    setLiAdminUsername(s.adminUsername || 'admin');
    setLiMetaPageId(s.metaPageId || '');
    setLiMetaPageName(s.metaPageName || '');
    setLiMetaGraphVersion(s.graphVersion || 'v23.0');
    setLiFacebookAppId(s.facebookAppId || '');
    setLiEnableFbPublishing(Boolean(s.publishingEnabled));
    setLiEnableAutoPublish(Boolean(s.autoPublishEnabled));
  }

  async function loadAllStudioData() {
    setLoadingData(true);
    try {
      const [statusRes, postsRes, backupsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/posts'),
        fetch('/api/backups'),
      ]);

      if (statusRes.status === 401 || postsRes.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (statusRes.ok) {
        const s: SystemStatus = await statusRes.json();
        syncStatusToLocalForms(s);
        if (s.metaTokenConfigured && !s.metaPageId) {
          fetch('/api/facebook/auto-discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
            .then(r => r.json())
            .then(d => {
              if (d.status) syncStatusToLocalForms(d.status);
            })
            .catch(() => {});
        }
      }
      if (postsRes.ok) {
        const pData = await postsRes.json();
        setPosts(pData.posts || []);
        setCampaigns(pData.campaigns || []);
        setMediaList(pData.media || []);
        setLogs(pData.logs || []);
      }
      if (backupsRes.ok) {
        const bData = await backupsRes.json();
        setBackups(bData.backups || []);
      }
    } catch (e: any) {
      showNotification('error', `Failed to load studio data: ${e.message}`);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadAllStudioData();
    }
  }, [authenticated]);

  // Keep composer postType valid whenever platform changes
  useEffect(() => {
    const spec = PLATFORMS[compPlatform];
    if (!spec.supportedPostTypes.includes(compPostType)) {
      setCompPostType(spec.defaultPostType);
    }
  }, [compPlatform, compPostType]);

  // Live composer validation
  const composerValidation = useMemo(() => {
    return validatePostInput(
      {
        platform: compPlatform,
        postType: compPostType,
        title: compTitle,
        caption: compCaption,
        articleText: compArticleText,
        hashtags: compHashtags,
        platformTags: compPlatformTags,
        callToAction: compCallToAction,
        destinationUrl: compDestinationUrl,
        imageUrl: compMediaUrls[0] || '',
        mediaUrls: compMediaUrls,
        mediaFilename: compMediaFilename,
        scheduledAt: compScheduledAt ? new Date(compScheduledAt).toISOString() : '',
        status: compStatus,
      },
      compStatus === 'scheduled'
    );
  }, [
    compPlatform,
    compPostType,
    compTitle,
    compCaption,
    compArticleText,
    compHashtags,
    compPlatformTags,
    compCallToAction,
    compDestinationUrl,
    compMediaUrls,
    compMediaFilename,
    compScheduledAt,
    compStatus,
  ]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (campaignFilter !== 'all' && p.campaignId !== campaignFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${p.title} ${p.topic} ${p.caption} ${p.hashtags} ${p.platformTags} ${p.seriesName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, platformFilter, statusFilter, campaignFilter, searchQuery]);

  // Reset Composer to blank
  function resetComposer(defaultPlat: PlatformId = 'facebook', prefillDate = '') {
    const spec = PLATFORMS[defaultPlat];
    setEditingPostId(null);
    setCompCampaignId('');
    setCompPlatform(defaultPlat);
    setCompPostType(spec.defaultPostType);
    setCompTitle('');
    setCompTopic('Workflow Automation');
    setCompSeriesName('');
    setCompEpisodeNumber('');
    setCompCaption('');
    setCompArticleText('');
    setCompHashtags('#TopTechSolutions');
    setCompPlatformTags('');
    setCompCallToAction('');
    setCompDestinationUrl('');
    setCompMediaUrls([]);
    setCompMediaFilename('');
    setCompScheduledAt(prefillDate);
    setCompStatus(prefillDate ? 'scheduled' : 'draft');
  }

  // Load an existing post into Composer for editing
  function openPostInComposer(post: SocialPost) {
    setEditingPostId(post.id);
    setCompCampaignId(post.campaignId || '');
    setCompPlatform(post.platform);
    setCompPostType(post.postType);
    setCompTitle(post.title || '');
    setCompTopic(post.topic || 'General');
    setCompSeriesName(post.seriesName || '');
    setCompEpisodeNumber(post.episodeNumber || '');
    setCompCaption(post.caption || '');
    setCompArticleText(post.articleText || '');
    setCompHashtags(post.hashtags || '');
    setCompPlatformTags(post.platformTags || '');
    setCompCallToAction(post.callToAction || '');
    setCompDestinationUrl(post.destinationUrl || '');
    const urls =
      Array.isArray(post.mediaUrls) && post.mediaUrls.length
        ? post.mediaUrls
        : post.imageUrl
          ? [post.imageUrl]
          : [];
    setCompMediaUrls(urls);
    setCompMediaFilename(post.mediaFilename || '');
    setCompScheduledAt(toLocalInputDateTime(post.scheduledAt));
    setCompStatus(post.status === 'published' ? 'published' : post.status);
    setActiveSection('composer');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const d = await r.json();
      if (!r.ok) {
        setLoginError(d.error || 'Login failed.');
        return;
      }
      setLoginPassword('');
      setAuthenticated(true);
      if (d.autoPickedFacebookPage?.id) {
        showNotification(
          'success',
          `Signed in and automatically picked Facebook Page "${d.autoPickedFacebookPage.name}" (META_PAGE_ID: ${d.autoPickedFacebookPage.id}).`
        );
      }
    } catch (err: any) {
      setLoginError(err.message || 'Network error.');
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    setAuthenticated(false);
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      campaignId: compCampaignId,
      platform: compPlatform,
      postType: compPostType,
      title: compTitle,
      topic: compTopic,
      seriesName: compSeriesName,
      episodeNumber: compEpisodeNumber,
      caption: compCaption,
      articleText: compArticleText,
      hashtags: compHashtags,
      platformTags: compPlatformTags,
      callToAction: compCallToAction,
      destinationUrl: compDestinationUrl,
      imageUrl: compMediaUrls[0] || '',
      mediaUrls: compMediaUrls,
      mediaFilename: compMediaFilename,
      scheduledAt: compScheduledAt ? new Date(compScheduledAt).toISOString() : '',
      status: compStatus,
      isManuallyEdited: true,
    };

    try {
      const url = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';
      const method = editingPostId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'Could not save post.');
        return;
      }
      await loadAllStudioData();
      if (!editingPostId && d.post?.id) {
        setEditingPostId(d.post.id);
      }
      showNotification(
        'success',
        editingPostId
          ? `Updated ${getPlatformLabel(compPlatform)} post.`
          : `Saved new ${getPlatformLabel(compPlatform)} (${getPostTypeLabel(compPostType)}) post.`
      );
    } catch (err: any) {
      showNotification('error', err.message);
    }
  }

  async function handleGenerateAiInComposer() {
    if (
      (compCaption.trim().length > 20 || compArticleText.trim().length > 20) &&
      !window.confirm(
        'Replace your current caption/article draft in the composer with newly generated Free AI content?'
      )
    ) {
      return;
    }
    setAiGenerating(true);
    try {
      const r = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: compTopic || compTitle || 'Business technology and automation',
          audience: aiAudience,
          tone: aiTone,
          goal: aiGoal,
          includeHashtags: aiIncludeHashtags,
          language: aiLanguage,
          platform: compPlatform,
          postType: compPostType,
          length: aiLength,
          seriesName: compSeriesName,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'Free AI generation unavailable.');
        return;
      }
      if (d.title) setCompTitle(d.title);
      if (d.caption) setCompCaption(d.caption);
      if (d.articleText) setCompArticleText(d.articleText);
      if (d.hashtags !== undefined) setCompHashtags(d.hashtags);
      if (d.platformTags) setCompPlatformTags(d.platformTags);
      if (d.callToAction) setCompCallToAction(d.callToAction);
      showNotification('success', `Generated platform content using ${d.provider} (${d.model}). Review and edit before saving.`);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleMediaUpload(fileList: FileList | null, assignToComposer = false) {
    if (!fileList || fileList.length === 0) return;
    setUploadingMedia(true);
    try {
      const uploadedUrls: string[] = [];
      let lastFilename = '';
      for (let i = 0; i < fileList.length; i++) {
        const form = new FormData();
        form.append('media', fileList[i]);
        const r = await fetch('/api/upload', { method: 'POST', body: form });
        const d = await r.json();
        if (!r.ok) {
          showNotification('error', d.error || `Upload failed for ${fileList[i].name}`);
          continue;
        }
        if (d.media?.url) {
          uploadedUrls.push(d.media.url);
          lastFilename = d.media.originalName || d.media.filename;
        }
      }
      await loadAllStudioData();
      if (assignToComposer && uploadedUrls.length > 0) {
        const maxFiles = POST_TYPES[compPostType].maxMediaFiles;
        if (maxFiles > 1) {
          setCompMediaUrls(prev => [...prev, ...uploadedUrls].slice(0, maxFiles));
        } else {
          setCompMediaUrls([uploadedUrls[0]]);
        }
        if (lastFilename) setCompMediaFilename(lastFilename);
      }
      if (uploadedUrls.length > 0) {
        showNotification('success', `Uploaded ${uploadedUrls.length} media file(s) to Media Library.`);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleSaveCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!campName.trim() || !campTopic.trim()) {
      showNotification('error', 'Enter both a campaign name and topic.');
      return;
    }
    if (campPlatforms.length === 0) {
      showNotification('error', 'Select at least one target platform for the campaign.');
      return;
    }

    try {
      const url = editingCampaignId ? `/api/campaigns/${editingCampaignId}` : '/api/campaigns';
      const method = editingCampaignId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campName,
          topic: campTopic,
          targetAudience: campAudience,
          businessName: campBusiness,
          goals: campGoals,
          tone: campTone,
          startDate: campStartDate,
          durationDays: campDurationDays,
          selectedPlatforms: campPlatforms,
          platformPostTypes: campPlatformTypes,
          notes: campNotes,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'Could not save campaign.');
        return;
      }
      await loadAllStudioData();
      setEditingCampaignId(null);
      setCampName('');
      setCampTopic('');
      setCampNotes('');
      showNotification('success', `Saved campaign "${d.campaign.name}". You can now generate or create platform-specific posts.`);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  }

  async function handleGenerateCampaignPosts(campaign: Campaign) {
    setCampGeneratingId(campaign.id);
    try {
      const r = await fetch('/api/ai/campaign-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          overwriteExisting: campOverwriteManual,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'Failed to generate campaign posts.');
        return;
      }
      await loadAllStudioData();
      showNotification(
        'success',
        `Generated ${d.posts?.length || 0} platform-tailored post(s) for "${campaign.name}" via ${d.provider}.`
      );
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setCampGeneratingId(null);
    }
  }

  function handleCreateManualCampaignPosts(campaign: Campaign) {
    // Create blank platform-specific drafts for platforms in this campaign that don't have a post yet
    Promise.all(
      campaign.selectedPlatforms.map(async plat => {
        const exists = posts.some(p => p.campaignId === campaign.id && p.platform === plat);
        if (exists) return;
        const pType = campaign.platformPostTypes[plat] || PLATFORMS[plat].defaultPostType;
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaign.id,
            title: `${campaign.name} — ${PLATFORMS[plat].name}`,
            topic: campaign.topic,
            seriesName: campaign.name,
            platform: plat,
            postType: pType,
            caption: `[Draft for ${PLATFORMS[plat].name}] Topic: ${campaign.topic}. Target audience: ${campaign.targetAudience}.`,
            hashtags: '#TopTechSolutions',
            status: 'draft',
            isManuallyEdited: false,
          }),
        });
      })
    ).then(() => {
      loadAllStudioData();
      showNotification('success', `Initialized platform draft slots for "${campaign.name}". Click any platform version to edit.`);
    });
  }

  async function handleValidateCsv() {
    if (!csvRawText.trim()) {
      showNotification('error', 'Upload a CSV file or paste CSV rows first.');
      return;
    }
    setCsvValidating(true);
    try {
      const r = await fetch('/api/import/csv/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText: csvRawText,
          campaignId: csvTargetCampaignId,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'CSV validation failed.');
        return;
      }
      setCsvPreviewReport(d);
      showNotification(
        'info',
        `Validated ${d.totalRows} row(s): ${d.validRows} valid, ${d.invalidRows} invalid, ${d.duplicateRows} duplicate(s).`
      );
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setCsvValidating(false);
    }
  }

  async function handleCommitCsvImport() {
    if (!csvRawText.trim()) return;
    setCsvImporting(true);
    try {
      const r = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText: csvRawText,
          campaignId: csvTargetCampaignId,
          skipDuplicates: csvSkipDuplicates,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'CSV import failed.');
        return;
      }
      setLastImportedIds(d.importedIds || []);
      setSelectedPostIds(d.importedIds || []);
      await loadAllStudioData();
      showNotification('success', d.message || `Imported ${d.imported} posts as drafts.`);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setCsvImporting(false);
    }
  }

  async function handleBulkSchedule(targetIds: string[]) {
    if (!targetIds.length) {
      showNotification('error', 'Select at least one post to schedule.');
      return;
    }
    if (!scheduleStartAt) {
      showNotification('error', 'Choose a valid start date and time.');
      return;
    }
    setSchedulingBusy(true);
    try {
      const r = await fetch('/api/posts/bulk-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: targetIds,
          startAt: new Date(scheduleStartAt).toISOString(),
          cadence: scheduleCadence,
          timeGapHours: scheduleGapHours,
          platformStaggerMinutes: scheduleStaggerMinutes,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'Bulk scheduling failed.');
        return;
      }
      await loadAllStudioData();
      showNotification('success', d.message);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSchedulingBusy(false);
    }
  }

  async function handleApprovePost(id: string) {
    const r = await fetch(`/api/posts/${id}/approve`, { method: 'POST' });
    const d = await r.json();
    if (!r.ok) {
      showNotification('error', d.error || 'Could not approve post.');
      return;
    }
    await loadAllStudioData();
    showNotification('success', 'Post marked as Approved.');
  }

  async function handlePublishNow(post: SocialPost) {
    if (post.platform !== 'facebook') {
      showNotification(
        'error',
        `Direct API publishing is only supported for Facebook Pages. "${getPlatformLabel(
          post.platform
        )}" is configured for content planning and CSV export.`
      );
      return;
    }
    if (
      !window.confirm(
        `Publish "${post.title || post.topic}" immediately to your connected Facebook Page?`
      )
    ) {
      return;
    }
    const r = await fetch(`/api/posts/${post.id}/publish-now`, { method: 'POST' });
    const d = await r.json();
    await loadAllStudioData();
    if (!r.ok) {
      showNotification('error', d.error || 'Facebook publication failed.');
      return;
    }
    showNotification('success', `Published to Facebook Page (Post ID: ${d.post?.facebookPostId}).`);
  }

  async function handleDeletePost(post: SocialPost) {
    if (post.status === 'published') {
      showNotification('error', 'Published posts are retained for audit history and cannot be deleted.');
      return;
    }
    if (
      !window.confirm(
        `Permanently delete the ${getPlatformLabel(post.platform)} post "${
          post.title || post.topic
        }"? This action cannot be undone.`
      )
    ) {
      return;
    }
    const r = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    if (r.ok) {
      await loadAllStudioData();
      showNotification('info', 'Deleted post.');
    } else {
      const d = await r.json();
      showNotification('error', d.error || 'Delete failed.');
    }
  }

  async function handleSaveStudioSettings(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferredAiProvider: prefAiProvider,
        ollamaBaseUrl: ollamaUrlInput,
        ollamaModel: ollamaModelInput,
        geminiModel: geminiModelInput,
        timezone: timezoneInput,
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      showNotification('error', d.error || 'Could not update settings.');
      return;
    }
    setStatus(d);
    showNotification('success', 'Saved studio AI & timezone settings.');
  }

  async function handleTestFacebook() {
    setFbTesting(true);
    setFbTestResult(null);
    try {
      const r = await fetch('/api/facebook/test', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) {
        setFbTestResult({ ok: false, message: d.error || 'Connection check failed.' });
      } else {
        setFbTestResult({
          ok: true,
          message: `Connected to Facebook Page: "${d.page?.name}" (ID: ${d.page?.id})`,
        });
      }
    } catch (err: any) {
      setFbTestResult({ ok: false, message: err.message });
    } finally {
      setFbTesting(false);
    }
  }

  async function handleCreateBackup() {
    const r = await fetch('/api/backups', { method: 'POST' });
    const d = await r.json();
    if (r.ok) {
      await loadAllStudioData();
      showNotification('success', `Created timestamped backup snapshot: ${d.filename}`);
    }
  }

  async function handleRestoreBackup(filename: string) {
    if (
      !window.confirm(
        `Restore database from "${filename}"? An automatic safety backup of your current state will be saved first before restoring.`
      )
    ) {
      return;
    }
    const r = await fetch(`/api/backups/${encodeURIComponent(filename)}/restore`, {
      method: 'POST',
    });
    const d = await r.json();
    if (!r.ok) {
      showNotification('error', d.error || 'Restore failed.');
      return;
    }
    await loadAllStudioData();
    showNotification('success', d.message);
  }

  function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveLoginInfo(e: React.FormEvent) {
    e.preventDefault();
    setLiSaving(true);
    try {
      const r = await fetch('/api/login-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername: liAdminUsername,
          timezone: timezoneInput,
          preferredAiProvider: prefAiProvider,
          ollamaBaseUrl: ollamaUrlInput,
          ollamaModel: ollamaModelInput,
          geminiModel: geminiModelInput,
          enableFacebookPublishing: liEnableFbPublishing,
          enableAutoPublish: liEnableAutoPublish,
          metaPageId: liMetaPageId,
          metaPageName: liMetaPageName,
          metaGraphVersion: liMetaGraphVersion,
          facebookAppId: liFacebookAppId,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        showNotification('error', d.error || 'Failed to save Login Info variables.');
        return;
      }
      if (d.status) {
        syncStatusToLocalForms(d.status);
      }
      showNotification('success', 'Login Info variables and runtime overrides saved.');
    } catch (err: any) {
      showNotification('error', err.message || 'Network error while saving Login Info.');
    } finally {
      setLiSaving(false);
    }
  }

  async function handleAutoDiscoverFacebook(overrideToken?: string) {
    setLiAutoDiscoverBusy(true);
    try {
      const r = await fetch('/api/facebook/auto-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideToken ? { accessToken: overrideToken } : {}),
      });
      const d = await r.json();
      if (d.status) {
        syncStatusToLocalForms(d.status);
      }
      if (!r.ok || !d.ok) {
        showNotification(
          'error',
          d.error || 'Could not auto-pick Facebook Page. Verify your Facebook login or Page token.'
        );
        return;
      }
      if (d.selectedPage?.id) {
        showNotification(
          'success',
          `Auto-picked Facebook Page "${d.selectedPage.name}" (META_PAGE_ID: ${d.selectedPage.id}).`
        );
      } else {
        showNotification('info', 'Connected to Facebook Graph API, but no managed Pages were returned.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to auto-discover Facebook Page.');
    } finally {
      setLiAutoDiscoverBusy(false);
    }
  }

  async function handleSelectDiscoveredPage(page: DiscoveredFacebookPage) {
    setLiMetaPageId(page.id);
    setLiMetaPageName(page.name);
    try {
      const r = await fetch('/api/login-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaPageId: page.id,
          metaPageName: page.name,
          metaPageCategory: page.category || '',
        }),
      });
      const d = await r.json();
      if (d.status) {
        syncStatusToLocalForms(d.status);
      }
      showNotification('success', `Selected Facebook Page "${page.name}" (${page.id}) as active META_PAGE_ID.`);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  }

  async function handleBrowserFacebookSessionPick() {
    const appId = liFacebookAppId.trim();
    if (!appId) {
      // Fall back to server-side token discovery if no browser Facebook App ID is entered
      await handleAutoDiscoverFacebook();
      return;
    }

    setLiAutoDiscoverBusy(true);
    try {
      const win = window as any;
      if (!win.FB) {
        await new Promise<void>((resolve, reject) => {
          win.fbAsyncInit = function () {
            win.FB.init({
              appId,
              cookie: true,
              xfbml: false,
              version: liMetaGraphVersion || 'v23.0',
            });
            resolve();
          };
          const existing = document.getElementById('facebook-jssdk');
          if (existing) {
            resolve();
            return;
          }
          const js = document.createElement('script');
          js.id = 'facebook-jssdk';
          js.src = 'https://connect.facebook.net/en_US/sdk.js';
          js.async = true;
          js.defer = true;
          js.onerror = () => reject(new Error('Could not load Facebook JS SDK in browser.'));
          document.body.appendChild(js);
        });
      } else {
        win.FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version: liMetaGraphVersion || 'v23.0',
        });
      }

      win.FB.getLoginStatus((statusResp: any) => {
        if (statusResp?.status === 'connected' && statusResp?.authResponse?.accessToken) {
          handleAutoDiscoverFacebook(statusResp.authResponse.accessToken);
        } else {
          win.FB.login(
            (loginResp: any) => {
              if (loginResp?.authResponse?.accessToken) {
                handleAutoDiscoverFacebook(loginResp.authResponse.accessToken);
              } else {
                setLiAutoDiscoverBusy(false);
                showNotification(
                  'info',
                  'Browser Facebook session was not authorized. Checking server-side token instead...'
                );
                handleAutoDiscoverFacebook();
              }
            },
            { scope: 'pages_show_list,pages_read_engagement,pages_manage_posts' }
          );
        }
      });
    } catch (err: any) {
      setLiAutoDiscoverBusy(false);
      showNotification('error', err.message || 'Facebook browser session detection failed.');
    }
  }

  // Login Gate when strict authentication is required
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        Loading TopTech Social Studio...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              TopTech Social Studio
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Single-Admin Content Planning, Free-AI Campaign Studio & Scheduler
            </p>
          </div>

          {requiresProdSetup && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Production Security Notice:</strong> Set a strong{' '}
              <code className="font-mono">ADMIN_PASSWORD</code> and{' '}
              <code className="font-mono">SESSION_SECRET</code> in your server{' '}
              <code className="font-mono">.env</code> file before signing in.
            </div>
          )}

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter ADMIN_PASSWORD from .env"
                className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Sign In to Studio
            </button>
            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              Upon signing in, TopTech Social Studio automatically inspects your connected Facebook Page session to populate <code className="font-mono">META_PAGE_ID</code>, Page Name, and Graph API parameters in the <strong>Login Info</strong> tab.
            </div>
          </form>
        </div>
      </div>
    );
  }

  const sidebarItems: Array<{ id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: FolderKanban },
    { id: 'calendar', label: 'Content Calendar', icon: CalendarIcon },
    { id: 'composer', label: 'Post Composer', icon: PenTool },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'csv', label: 'Bulk CSV Import', icon: FileSpreadsheet },
    { id: 'queue', label: 'Publishing Queue', icon: Clock },
    { id: 'history', label: 'Post History', icon: History },
    { id: 'ai-settings', label: 'AI Provider Settings', icon: Cpu },
    { id: 'platforms', label: 'Connected Platforms', icon: Share2 },
    { id: 'login-info', label: 'Login Info', icon: Lock },
    { id: 'settings', label: 'Application Settings', icon: Settings },
  ];

  const currentPlatformSpec = PLATFORMS[compPlatform];
  const currentPostTypeSpec = POST_TYPES[compPostType];
  const tz = status?.timezone || 'Asia/Karachi';

  // KPI counts
  const countDrafts = posts.filter(p => p.status === 'draft').length;
  const countApproved = posts.filter(p => p.status === 'approved').length;
  const countScheduled = posts.filter(p => p.status === 'scheduled').length;
  const countPublished = posts.filter(p => p.status === 'published').length;
  const countFailed = posts.filter(p => p.status === 'failed').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="no-print flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={e => {
            e.preventDefault();
            setActiveSection('dashboard');
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          TopTech Social Studio
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'dashboard' ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('campaigns')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'campaigns' ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            Campaigns
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('calendar')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'calendar' ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('csv')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'csv' ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            CSV Import
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('queue')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'queue' ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            Queue
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              resetComposer('facebook');
              setActiveSection('composer');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Create Post
          </button>
        </div>
      </header>

      {/* Main Workspace Container: Sidebar + Content Viewport */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar Navigation (256px desktop) */}
        <aside className="no-print w-64 shrink-0 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4">
          <div className="space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-500">
            <div>
              <div className="font-medium text-slate-800">Free AI Engine</div>
              <div className="truncate mt-0.5">{status?.aiProvider || 'Checking...'}</div>
            </div>
            <div>
              <div className="font-medium text-slate-800">Display Timezone</div>
              <div className="font-mono mt-0.5">{tz}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 pt-2 text-xs font-medium text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Section Switcher */}
        <div className="no-print md:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex items-center gap-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                activeSection === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-[1440px]">
          {/* Notification Banner */}
          {banner && (
            <div
              className={`no-print mb-6 p-4 border flex items-center justify-between gap-4 text-xs ${
                banner.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : banner.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <span>{banner.message}</span>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="font-semibold underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ================================================================
              1. DASHBOARD
             ================================================================ */}
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Operations Dashboard
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Multi-platform campaign planning, Free-AI content studio, CSV batch management, and Facebook Page scheduler.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAllStudioData}
                    className="px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Refresh Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('campaigns')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    New Campaign
                  </button>
                </div>
              </div>

              {/* KPI Strip (Tabular Numerals) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Total Posts</div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900">
                    {posts.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Across {campaigns.length} campaign(s)
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Drafts & Review</div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900">
                    {countDrafts + countApproved}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {countDrafts} draft · {countApproved} approved
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Scheduled Queue</div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-blue-700">
                    {countScheduled}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Timezone: {tz}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Published / Failed</div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-emerald-700">
                    {countPublished}{' '}
                    <span className="text-sm font-normal text-slate-400">/</span>{' '}
                    <span className="text-red-600">{countFailed}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Retained for audit
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Free AI Status</div>
                  <div className="text-sm font-semibold mt-1.5 text-slate-900 truncate">
                    {status?.ollama.reachable
                      ? 'Ollama Connected'
                      : status?.gemini.keyConfigured && status?.gemini.isFreeTierEligibleModel
                        ? 'Gemini Free-Tier'
                        : 'Manual Mode'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Zero paid OpenAI keys
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Facebook Publishing</div>
                  <div className="text-sm font-semibold mt-1.5 text-slate-900">
                    {status?.publishingEnabled ? 'Enabled' : 'Disabled (Safe Mode)'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Auto-publish: {status?.autoPublishEnabled ? 'On' : 'Off'}
                  </div>
                </div>
              </div>

              {/* Platform Architecture & Publishing Capability Matrix */}
              <div className="bg-white border border-slate-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Platform Support & Integration Transparency Matrix
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Distinguishes between platform-tailored content creation/export (supported for all 7 platforms) and live direct API publishing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('platforms')}
                    className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Configure Connected Platforms
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 pr-4 font-medium">Platform</th>
                        <th className="py-2.5 px-4 font-medium">Supported Post Formats</th>
                        <th className="py-2.5 px-4 font-medium text-right">Caption Limit</th>
                        <th className="py-2.5 px-4 font-medium text-right">Posts in Studio</th>
                        <th className="py-2.5 pl-4 font-medium">Publishing Integration Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {PLATFORM_LIST.map(plat => {
                        const platPosts = posts.filter(p => p.platform === plat.id);
                        return (
                          <tr key={plat.id} className="hover:bg-slate-50">
                            <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                              {plat.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {plat.supportedPostTypes.map(t => POST_TYPES[t].name).join(' · ')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                              {plat.maxCaptionLength.toLocaleString()} chars
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                              {platPosts.length}
                            </td>
                            <td className="py-3 pl-4">
                              {plat.publishingSupport === 'server_graph_api' ? (
                                <span className="text-slate-800">
                                  Direct Graph API Publishing{' '}
                                  <span className="text-slate-400">·</span>{' '}
                                  <span
                                    className={
                                      status?.metaConfigured && status?.publishingEnabled
                                        ? 'text-emerald-700 font-medium'
                                        : 'text-amber-700 font-medium'
                                    }
                                  >
                                    {status?.metaConfigured
                                      ? status.publishingEnabled
                                        ? 'Active'
                                        : 'Credentials Set (Publishing Disabled)'
                                      : 'Awaiting Meta Credentials'}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-600">
                                  Content Design, Scheduling & CSV Export Only{' '}
                                  <span className="text-slate-400">·</span>{' '}
                                  <span className="text-slate-500">Direct API Not Connected</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Posts & Activity Audit Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      Recent & Upcoming Multi-Platform Posts
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('queue')}
                      className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                    >
                      Open Full Queue ({posts.length})
                    </button>
                  </div>

                  {posts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No posts saved yet. Create a campaign or compose a new post to get started.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {posts.slice(0, 6).map(post => (
                        <div
                          key={post.id}
                          className="py-3.5 flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <div className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-800">
                                {getPlatformLabel(post.platform)}
                              </span>
                              <span className="mx-1.5">·</span>
                              <span>{getPostTypeLabel(post.postType)}</span>
                              <span className="mx-1.5">·</span>
                              <span className="uppercase tracking-wide font-mono">
                                {post.status}
                              </span>
                              {post.scheduledAt && (
                                <>
                                  <span className="mx-1.5">·</span>
                                  <span className="font-mono tabular-nums">
                                    {formatDateTimeKarachi(post.scheduledAt, tz)}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-slate-900 mt-1 truncate">
                              {post.title || post.topic}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                              {post.caption}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openPostInComposer(post)}
                              className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activity Log */}
                <div className="bg-white border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      Recent Studio Activity
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('history')}
                      className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                    >
                      All Logs
                    </button>
                  </div>
                  <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                    {logs.slice(0, 10).map(log => (
                      <div key={log.id} className="py-2.5 text-xs">
                        <div className="text-slate-800 font-medium">{log.message}</div>
                        <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                          {formatDateTimeKarachi(log.at, tz)} · {log.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              2. CAMPAIGNS (10-STEP CAMPAIGN WORKFLOW)
             ================================================================ */}
          {activeSection === 'campaigns' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Campaign-Based Content Management
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Create multi-platform campaigns, assign platform-specific post formats, generate tailored copy via Free AI, and export or schedule batches safely.
                </p>
              </div>

              {/* Create / Edit Campaign Form */}
              <form
                onSubmit={handleSaveCampaign}
                className="bg-white border border-slate-200 p-6 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-base font-semibold text-slate-900">
                    {editingCampaignId ? 'Edit Campaign Configuration' : '1. Create a New Multi-Platform Campaign'}
                  </h2>
                  {editingCampaignId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCampaignId(null);
                        setCampName('');
                        setCampTopic('');
                      }}
                      className="text-xs text-slate-600 underline cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={campName}
                      onChange={e => setCampName(e.target.value)}
                      placeholder="e.g., Q4 SME Cloud & AI Readiness"
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Business / Brand Name
                    </label>
                    <input
                      type="text"
                      value={campBusiness}
                      onChange={e => setCampBusiness(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Core Topic / Theme *
                    </label>
                    <input
                      type="text"
                      value={campTopic}
                      onChange={e => setCampTopic(e.target.value)}
                      placeholder="e.g., Reducing manual spreadsheet errors with automation"
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={campAudience}
                      onChange={e => setCampAudience(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Campaign Goals
                    </label>
                    <input
                      type="text"
                      value={campGoals}
                      onChange={e => setCampGoals(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tone & Voice
                    </label>
                    <input
                      type="text"
                      value={campTone}
                      onChange={e => setCampTone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={campStartDate}
                      onChange={e => setCampStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Campaign Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={campDurationDays}
                      onChange={e => setCampDurationDays(Number(e.target.value) || 7)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Campaign Notes
                    </label>
                    <input
                      type="text"
                      value={campNotes}
                      onChange={e => setCampNotes(e.target.value)}
                      placeholder="Optional internal instructions"
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Step 3 & 4: Select Platforms & Choose Post Type for each Platform */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-800 mb-2">
                    Select Target Platforms & Assign Platform-Specific Post Formats:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PLATFORM_LIST.map(plat => {
                      const checked = campPlatforms.includes(plat.id);
                      const selectedType = campPlatformTypes[plat.id] || plat.defaultPostType;
                      return (
                        <div
                          key={plat.id}
                          className={`p-3 border transition-colors ${
                            checked ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-900 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setCampPlatforms(prev => [...prev, plat.id]);
                                } else {
                                  setCampPlatforms(prev => prev.filter(x => x !== plat.id));
                                }
                              }}
                            />
                            <span>{plat.name}</span>
                          </label>
                          {checked && (
                            <div className="mt-2">
                              <label className="block text-[11px] text-slate-500 mb-1">
                                Post Format ({plat.maxCaptionLength.toLocaleString()} chars max)
                              </label>
                              <select
                                value={selectedType}
                                onChange={e =>
                                  setCampPlatformTypes(prev => ({
                                    ...prev,
                                    [plat.id]: e.target.value as PostTypeId,
                                  }))
                                }
                                className="w-full px-2 py-1.5 text-xs border border-slate-300 bg-white"
                              >
                                {plat.supportedPostTypes.map(tId => (
                                  <option key={tId} value={tId}>
                                    {POST_TYPES[tId].name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {editingCampaignId ? 'Update Campaign' : 'Save Campaign'}
                  </button>
                </div>
              </form>

              {/* Saved Campaigns & Their Platform-Specific Posts */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Active Campaigns ({campaigns.length})
                  </h2>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={campOverwriteManual}
                      onChange={e => setCampOverwriteManual(e.target.checked)}
                    />
                    <span>
                      Allow Free AI generation to overwrite manually edited drafts (unchecked by default for data safety)
                    </span>
                  </label>
                </div>

                {campaigns.map(camp => {
                  const campPosts = posts.filter(p => p.campaignId === camp.id);
                  const isGenerating = campGeneratingId === camp.id;
                  return (
                    <div key={camp.id} className="bg-white border border-slate-200 p-6 space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <div className="text-xs text-slate-500">
                            <span>{camp.businessName}</span>
                            <span className="mx-1.5">·</span>
                            <span className="font-mono">Start: {camp.startDate}</span>
                            <span className="mx-1.5">·</span>
                            <span className="font-mono">{camp.durationDays} days</span>
                            <span className="mx-1.5">·</span>
                            <span>{camp.selectedPlatforms.length} platforms</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">
                            {camp.name}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            <strong>Topic:</strong> {camp.topic} · <strong>Audience:</strong> {camp.targetAudience} · <strong>Tone:</strong> {camp.tone}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => handleGenerateCampaignPosts(camp)}
                            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                          >
                            {isGenerating ? 'Generating via Free AI...' : 'Generate Platform Posts (Free AI)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreateManualCampaignPosts(camp)}
                            className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                          >
                            Create Manual Slots
                          </button>
                          <a
                            href={`/api/export/csv?campaignId=${encodeURIComponent(camp.id)}`}
                            className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const ids = campPosts
                                .filter(p => p.status !== 'published')
                                .map(p => p.id);
                              setSelectedPostIds(ids);
                              setActiveSection('queue');
                              showNotification(
                                'info',
                                `Selected ${ids.length} post(s) from "${camp.name}" for bulk scheduling.`
                              );
                            }}
                            className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                          >
                            Schedule Campaign ({campPosts.length})
                          </button>
                        </div>
                      </div>

                      {/* Platform Post Versions Table */}
                      {campPosts.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          No platform posts created for this campaign yet. Click "Generate Platform Posts (Free AI)" or "Create Manual Slots".
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-2 pr-3 font-medium">Platform</th>
                                <th className="py-2 px-3 font-medium">Post Format</th>
                                <th className="py-2 px-3 font-medium">Title & Tailored Caption</th>
                                <th className="py-2 px-3 font-medium">Hashtags & Metadata Tags</th>
                                <th className="py-2 px-3 font-medium">Media</th>
                                <th className="py-2 px-3 font-medium">Schedule & Status</th>
                                <th className="py-2 pl-3 font-medium text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {campPosts.map(post => (
                                <tr key={post.id} className="hover:bg-slate-50 align-top">
                                  <td className="py-3 pr-3 font-semibold text-slate-900 whitespace-nowrap">
                                    {getPlatformLabel(post.platform)}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                    {getPostTypeLabel(post.postType)}
                                  </td>
                                  <td className="py-3 px-3 max-w-md">
                                    <div className="font-semibold text-slate-900">
                                      {post.title || post.topic}
                                    </div>
                                    <p className="text-slate-600 line-clamp-2 mt-0.5">
                                      {post.caption}
                                    </p>
                                    <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-1">
                                      {post.caption.length.toLocaleString()} /{' '}
                                      {PLATFORMS[post.platform].maxCaptionLength.toLocaleString()} chars
                                      {post.isManuallyEdited ? ' · Manually Edited' : ''}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 max-w-xs text-slate-600">
                                    {post.hashtags && (
                                      <div className="truncate">
                                        <span className="text-slate-400">Hashtags:</span> {post.hashtags}
                                      </div>
                                    )}
                                    {post.platformTags && (
                                      <div className="truncate mt-0.5">
                                        <span className="text-slate-400">Tags:</span> {post.platformTags}
                                      </div>
                                    )}
                                    {post.callToAction && (
                                      <div className="truncate mt-0.5">
                                        <span className="text-slate-400">CTA:</span> {post.callToAction}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    {post.imageUrl || post.mediaUrls.length > 0 ? (
                                      <span className="text-emerald-700 font-medium">
                                        Attached ({post.mediaUrls.length || 1})
                                      </span>
                                    ) : post.mediaFilename ? (
                                      <span className="text-amber-700">
                                        Ref: {post.mediaFilename}
                                      </span>
                                    ) : POST_TYPES[post.postType].requiresMedia ? (
                                      <span className="text-amber-700">Needs Media</span>
                                    ) : (
                                      <span className="text-slate-400">Optional</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums">
                                    <div className="uppercase text-slate-800 font-semibold">
                                      {post.status}
                                    </div>
                                    <div className="text-slate-500 text-[11px]">
                                      {formatDateTimeKarachi(post.scheduledAt, tz)}
                                    </div>
                                  </td>
                                  <td className="py-3 pl-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => openPostInComposer(post)}
                                      className="px-2.5 py-1 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
                                    >
                                      Edit / Media
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================
              3. CONTENT CALENDAR
             ================================================================ */}
          {activeSection === 'calendar' && (() => {
            const baseDate = new Date();
            const targetMonth = new Date(
              baseDate.getFullYear(),
              baseDate.getMonth() + calendarMonthOffset,
              1
            );
            const year = targetMonth.getFullYear();
            const month = targetMonth.getMonth();
            const firstDayOfWeek = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthLabel = targetMonth.toLocaleString('en-US', {
              month: 'long',
              year: 'numeric',
            });

            const cells: Array<{ day: number | null; dateStr: string }> = [];
            for (let i = 0; i < firstDayOfWeek; i++) {
              cells.push({ day: null, dateStr: '' });
            }
            for (let d = 1; d <= daysInMonth; d++) {
              const pad = (n: number) => String(n).padStart(2, '0');
              cells.push({
                day: d,
                dateStr: `${year}-${pad(month + 1)}-${pad(d)}`,
              });
            }

            return (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                      Content Calendar ({tz})
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                      Visual schedule across all 7 platforms. Click any date to compose a post or click any scheduled entry to edit.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonthOffset(prev => prev - 1)}
                      className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      Previous Month
                    </button>
                    <span className="px-3 py-1.5 text-xs font-semibold text-slate-900 font-mono">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarMonthOffset(prev => prev + 1)}
                      className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      Next Month
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white border border-slate-200">
                  <div className="grid grid-cols-7 border-b border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2.5 border-r border-slate-200 last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {cells.map((cell, idx) => {
                      const dayPosts = cell.dateStr
                        ? posts.filter(
                            p => p.scheduledAt && p.scheduledAt.slice(0, 10) === cell.dateStr
                          )
                        : [];
                      return (
                        <div
                          key={idx}
                          className="min-h-[120px] p-2.5 border-r border-b border-slate-200 flex flex-col justify-between hover:bg-slate-50/60"
                        >
                          {cell.day ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                                  {cell.day}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    resetComposer('facebook', `${cell.dateStr}T10:00`);
                                    setActiveSection('composer');
                                  }}
                                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="mt-2 space-y-1">
                                {dayPosts.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => openPostInComposer(p)}
                                    className="w-full text-left p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] truncate cursor-pointer"
                                  >
                                    <span className="font-semibold text-slate-900">
                                      {PLATFORMS[p.platform].name}:
                                    </span>{' '}
                                    <span className="text-slate-700">
                                      {p.title || p.caption.slice(0, 30)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              4. POST COMPOSER (MULTI-PLATFORM & MULTI-POST-TYPE)
             ================================================================ */}
          {activeSection === 'composer' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {editingPostId ? 'Edit Platform Post' : 'Multi-Platform Post Composer'}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Configure platform-specific captions, hashtags, distinct metadata tags, media assets, and schedule.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resetComposer(compPlatform)}
                    className="px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Reset Form
                  </button>
                </div>
              </div>

              {/* Prominent Platform & Post Type Banner */}
              <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-300">Active Target Configuration</div>
                  <div className="text-lg font-bold mt-0.5">
                    {currentPlatformSpec.name} <span className="text-slate-400">·</span>{' '}
                    <span className="text-blue-300">{currentPostTypeSpec.name}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {currentPlatformSpec.publishingDescription}
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums text-xs">
                  <div>
                    Caption Limit: {compCaption.length.toLocaleString()} /{' '}
                    {currentPlatformSpec.maxCaptionLength.toLocaleString()} chars
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    Recommended Hashtags: {currentPlatformSpec.recommendedHashtagCount.min}–
                    {currentPlatformSpec.recommendedHashtagCount.max}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Main Composer Form (2 columns) */}
                <form
                  onSubmit={handleSavePost}
                  className="lg:col-span-2 bg-white border border-slate-200 p-6 space-y-5"
                >
                  {/* Platform, Post Type & Campaign Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        1. Target Platform *
                      </label>
                      <select
                        value={compPlatform}
                        onChange={e => setCompPlatform(e.target.value as PlatformId)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 bg-white font-medium"
                      >
                        {PLATFORM_LIST.map(plat => (
                          <option key={plat.id} value={plat.id}>
                            {plat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        2. Supported Post Format *
                      </label>
                      <select
                        value={compPostType}
                        onChange={e => setCompPostType(e.target.value as PostTypeId)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 bg-white font-medium"
                      >
                        {currentPlatformSpec.supportedPostTypes.map(typeId => (
                          <option key={typeId} value={typeId}>
                            {POST_TYPES[typeId].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        3. Campaign Assignment
                      </label>
                      <select
                        value={compCampaignId}
                        onChange={e => setCompCampaignId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 bg-white"
                      >
                        <option value="">Standalone Post (No Campaign)</option>
                        {campaigns.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Format specification note */}
                  <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong>Format Rules ({currentPostTypeSpec.name}):</strong>{' '}
                    {currentPostTypeSpec.description} {currentPlatformSpec.mediaRequirementsNote}
                  </div>

                  {/* Title, Topic, Series */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>
                          Post / Video Title {currentPostTypeSpec.requiresTitle ? '*' : '(Optional)'}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {compTitle.length}/{currentPlatformSpec.maxTitleLength}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={compTitle}
                        onChange={e => setCompTitle(e.target.value)}
                        placeholder={
                          compPlatform === 'youtube'
                            ? 'Required YouTube Video Title (max 100 chars)'
                            : 'Internal reference or headline'
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                        required={currentPostTypeSpec.requiresTitle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Topic / Category
                      </label>
                      <input
                        type="text"
                        value={compTopic}
                        onChange={e => setCompTopic(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Caption / Post Text */}
                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                      <span>
                        {compPlatform === 'youtube'
                          ? 'YouTube Video Description *'
                          : `${currentPlatformSpec.name} Caption / Post Text *`}
                      </span>
                      <span
                        className={`font-mono tabular-nums ${
                          compCaption.length > currentPlatformSpec.maxCaptionLength
                            ? 'text-red-600 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {compCaption.length.toLocaleString()} /{' '}
                        {currentPlatformSpec.maxCaptionLength.toLocaleString()} chars
                      </span>
                    </label>
                    <textarea
                      rows={6}
                      value={compCaption}
                      onChange={e => setCompCaption(e.target.value)}
                      placeholder={`Write your ${currentPlatformSpec.name} caption here...`}
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600 leading-relaxed"
                      required
                    />
                  </div>

                  {/* Distinct Hashtags vs Platform Metadata Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Hashtags (Recommended: {currentPlatformSpec.recommendedHashtagCount.min}–
                        {currentPlatformSpec.recommendedHashtagCount.max})
                      </label>
                      <input
                        type="text"
                        value={compHashtags}
                        onChange={e => setCompHashtags(e.target.value)}
                        placeholder="#TopTechSolutions #Automation #Tech"
                        className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Space-separated hashtags appended or included in post copy.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        {currentPlatformSpec.platformTagsLabel}
                      </label>
                      <input
                        type="text"
                        value={compPlatformTags}
                        onChange={e => setCompPlatformTags(e.target.value)}
                        placeholder={currentPlatformSpec.platformTagsPlaceholder}
                        className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Stored separately from hashtags (e.g., YouTube video tags, collaborator handles, or alt metadata).
                      </p>
                    </div>
                  </div>

                  {/* Call to Action & Destination Link */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Call to Action (CTA)
                      </label>
                      <input
                        type="text"
                        value={compCallToAction}
                        onChange={e => setCompCallToAction(e.target.value)}
                        placeholder="e.g., Book a Free Consultation / Watch Full Video"
                        className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Destination URL {currentPostTypeSpec.requiresDestinationUrl ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="url"
                        value={compDestinationUrl}
                        onChange={e => setCompDestinationUrl(e.target.value)}
                        placeholder="https://toptechsolutions.example.com/guide"
                        className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                        required={currentPostTypeSpec.requiresDestinationUrl}
                      />
                    </div>
                  </div>

                  {/* Long-form Article / Video Script (Preserved & Upgraded from v1.2) */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <label className="text-xs font-semibold text-slate-800">
                        Extended Long-Form Article / Video Script (Up to 100,000 chars)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-2 py-1 text-[11px] border border-slate-300 hover:bg-slate-50 cursor-pointer"
                        >
                          Print / Save PDF
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextFile(
                              `${(compTitle || compTopic || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`,
                              `${compTitle}\n\n${compCaption}\n\n${compArticleText}\n\n${compHashtags}`
                            )
                          }
                          className="px-2 py-1 text-[11px] border border-slate-300 hover:bg-slate-50 cursor-pointer"
                        >
                          Download .TXT
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={compArticleText}
                      onChange={e => setCompArticleText(e.target.value)}
                      placeholder="Optional full blog article, newsletter text, or timestamped video script..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Media Upload, Preview, Replacement & Removal */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-800">
                          Media Assets ({compMediaUrls.length} / {currentPostTypeSpec.maxMediaFiles} max)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Allowed for {currentPostTypeSpec.name}:{' '}
                          {currentPostTypeSpec.allowedMediaCategories.join(', ') || 'None required'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 cursor-pointer">
                          <span>{uploadingMedia ? 'Uploading...' : 'Upload Image / Video'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                            multiple={currentPostTypeSpec.maxMediaFiles > 1}
                            onChange={e => handleMediaUpload(e.target.files, true)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowMediaPicker(prev => !prev)}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                        >
                          {showMediaPicker ? 'Hide Media Library' : `Choose from Library (${mediaList.length})`}
                        </button>
                      </div>
                    </div>

                    {/* Media Picker Drawer */}
                    {showMediaPicker && (
                      <div className="p-3 bg-slate-50 border border-slate-200 max-h-56 overflow-y-auto">
                        {mediaList.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No files uploaded in Media Library yet.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {mediaList.map(asset => (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  if (currentPostTypeSpec.maxMediaFiles > 1) {
                                    setCompMediaUrls(prev =>
                                      prev.includes(asset.url)
                                        ? prev
                                        : [...prev, asset.url].slice(0, currentPostTypeSpec.maxMediaFiles)
                                    );
                                  } else {
                                    setCompMediaUrls([asset.url]);
                                  }
                                  setCompMediaFilename(asset.originalName);
                                }}
                                className="p-2 bg-white border border-slate-200 hover:border-blue-600 text-left text-xs cursor-pointer"
                              >
                                <div className="font-medium text-slate-900 truncate">
                                  {asset.originalName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {asset.category} · {formatBytes(asset.sizeBytes)}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attached Media Previews */}
                    {compMediaUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {compMediaUrls.map((url, idx) => {
                          const isVid = /\.(mp4|webm|mov)$/i.test(url);
                          return (
                            <div
                              key={idx}
                              className="border border-slate-200 bg-slate-50 p-2 space-y-2"
                            >
                              {isVid ? (
                                <video
                                  src={url}
                                  controls
                                  className="w-full h-32 object-cover bg-black"
                                />
                              ) : (
                                <img
                                  src={url}
                                  alt={`Attached media ${idx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-32 object-cover bg-slate-100"
                                />
                              )}
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="truncate text-slate-600 font-mono">
                                  {url.split('/').pop()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCompMediaUrls(prev => prev.filter((_, i) => i !== idx))
                                  }
                                  className="text-red-600 hover:underline font-medium cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Schedule & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Scheduled Publication Date & Time ({tz})
                      </label>
                      <input
                        type="datetime-local"
                        value={compScheduledAt}
                        onChange={e => setCompScheduledAt(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Workflow Status
                      </label>
                      <select
                        value={compStatus}
                        onChange={e => setCompStatus(e.target.value as PostStatus)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 bg-white font-medium"
                      >
                        <option value="draft">Draft (In Review)</option>
                        <option value="approved">Approved (Ready to Schedule)</option>
                        <option value="scheduled">Scheduled (Queued for Publication)</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Validation Feedback */}
                  {(composerValidation.errors.length > 0 || composerValidation.warnings.length > 0) && (
                    <div className="space-y-2">
                      {composerValidation.errors.map((err, i) => (
                        <div
                          key={i}
                          className="p-3 bg-red-50 border border-red-200 text-xs text-red-800"
                        >
                          <strong>Validation Error:</strong> {err}
                        </div>
                      ))}
                      {composerValidation.warnings.map((warn, i) => (
                        <div
                          key={i}
                          className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900"
                        >
                          <strong>Note:</strong> {warn}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      {editingPostId ? 'Save Changes to Post' : 'Save Post to Studio'}
                    </button>
                  </div>
                </form>

                {/* Right Column: Free AI Copy Assistant & Live Preview */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 p-5 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Free AI Content Assistant
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Provider: <strong>{status?.aiProvider}</strong>. Generates tailored copy, hashtags, and platform metadata tags.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Target Audience
                        </label>
                        <input
                          type="text"
                          value={aiAudience}
                          onChange={e => setAiAudience(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Tone
                        </label>
                        <input
                          type="text"
                          value={aiTone}
                          onChange={e => setAiTone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Length
                          </label>
                          <select
                            value={aiLength}
                            onChange={e => setAiLength(e.target.value as any)}
                            className="w-full px-2 py-1.5 border border-slate-300 bg-white"
                          >
                            <option value="short">Short / Punchy</option>
                            <option value="medium">Medium</option>
                            <option value="long">Long + Article</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Language
                          </label>
                          <input
                            type="text"
                            value={aiLanguage}
                            onChange={e => setAiLanguage(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiIncludeHashtags}
                          onChange={e => setAiIncludeHashtags(e.target.checked)}
                        />
                        <span>Include platform hashtags (#TopTechSolutions)</span>
                      </label>

                      <button
                        type="button"
                        disabled={aiGenerating}
                        onClick={handleGenerateAiInComposer}
                        className="w-full py-2 px-4 bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {aiGenerating
                          ? 'Generating with Free AI...'
                          : `Generate ${currentPlatformSpec.name} Copy`}
                      </button>
                    </div>
                  </div>

                  {/* Platform Preview Card */}
                  <div className="bg-white border border-slate-200 p-5 space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Live {currentPlatformSpec.name} Preview
                    </div>
                    <div className="border border-slate-200 p-4 bg-slate-50 space-y-2.5 text-xs">
                      <div className="font-bold text-slate-900">
                        TopTech Solutions · {currentPlatformSpec.name}
                      </div>
                      {compTitle && (
                        <div className="font-semibold text-slate-900 text-sm">
                          {compTitle}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                        {compCaption || 'Your platform-specific caption will preview here...'}
                      </div>
                      {compCallToAction && (
                        <div className="font-semibold text-blue-700">
                          {compCallToAction}
                        </div>
                      )}
                      {compDestinationUrl && (
                        <div className="text-blue-600 underline truncate">
                          {compDestinationUrl}
                        </div>
                      )}
                      {compHashtags && (
                        <div className="text-slate-600 font-medium">{compHashtags}</div>
                      )}
                      {compPlatformTags && (
                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                          <strong>Metadata Tags:</strong> {compPlatformTags}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              5. MEDIA LIBRARY
             ================================================================ */}
          {activeSection === 'media' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Media Library
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Upload and manage local images (JPG, PNG, WEBP, GIF up to 12 MB) and videos (MP4, WEBM, MOV up to 50 MB). Files are stored in <code className="font-mono">uploads/</code>.
                  </p>
                </div>
                <label className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer">
                  <span>{uploadingMedia ? 'Uploading...' : 'Upload Media Files'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={e => handleMediaUpload(e.target.files, false)}
                    className="hidden"
                  />
                </label>
              </div>

              {mediaList.length === 0 ? (
                <div className="bg-white border border-slate-200 p-12 text-center space-y-3">
                  <div className="text-sm font-semibold text-slate-900">
                    No Media Files Uploaded Yet
                  </div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Upload images or videos here to attach them in the Post Composer or automatically match <code className="font-mono">media_filename</code> references during Bulk CSV Imports.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mediaList.map(asset => (
                    <div
                      key={asset.id}
                      className="bg-white border border-slate-200 flex flex-col justify-between"
                    >
                      <div>
                        {asset.category === 'video' ? (
                          <video
                            src={asset.url}
                            controls
                            className="w-full h-44 object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={asset.url}
                            alt={asset.originalName}
                            referrerPolicy="no-referrer"
                            className="w-full h-44 object-cover bg-slate-100"
                          />
                        )}
                        <div className="p-3.5">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {asset.originalName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-1">
                            {asset.mimeType} · {formatBytes(asset.sizeBytes)}
                          </div>
                        </div>
                      </div>
                      <div className="px-3.5 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            resetComposer('facebook');
                            setCompMediaUrls([asset.url]);
                            setCompMediaFilename(asset.originalName);
                            setCompPostType(asset.category === 'video' ? 'video' : 'image');
                            setActiveSection('composer');
                          }}
                          className="font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Use in Composer
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const r = await fetch(`/api/media/${asset.id}`, {
                              method: 'DELETE',
                            });
                            if (r.status === 409) {
                              const d = await r.json();
                              if (
                                window.confirm(
                                  `${d.error}\n\nClick OK to force delete and unlink from those posts.`
                                )
                              ) {
                                await fetch(`/api/media/${asset.id}?force=true`, {
                                  method: 'DELETE',
                                });
                                await loadAllStudioData();
                              }
                            } else if (r.ok) {
                              await loadAllStudioData();
                              showNotification('info', `Deleted ${asset.originalName}.`);
                            }
                          }}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              6. BULK CSV IMPORT & EXPORT
             ================================================================ */}
          {activeSection === 'csv' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Bulk CSV Import & Export
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    One row per platform-specific post. Supports validation preview, duplicate detection, and automatic media library filename matching.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sample = generateSampleMultiPlatformCsv(
                        campaigns[0]?.id || 'camp-toptech-q4-ai'
                      );
                      setCsvRawText(sample);
                      showNotification('info', 'Loaded sample multi-platform CSV into editor. Click "1. Validate & Preview CSV".');
                    }}
                    className="px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Load Sample Multi-Platform CSV
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        'toptech-multiplatform-template.csv',
                        generateSampleMultiPlatformCsv(''),
                        'text/csv;charset=utf-8'
                      )
                    }
                    className="px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Download CSV Template
                  </button>
                  <a
                    href="/api/export/csv"
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export All Posts to CSV</span>
                  </a>
                </div>
              </div>

              {/* Important Media & ZIP Honesty Notice */}
              <div className="bg-white border border-slate-200 p-4 text-xs text-slate-700 leading-relaxed">
                <strong>Media Reference & ZIP Policy:</strong> Supported CSV columns include{' '}
                <code className="font-mono">
                  campaign_id, post_title, topic, series_name, episode_number, platform, post_type, caption, article_text, hashtags, platform_tags, call_to_action, destination_url, media_filename, media_url, scheduled_at, status
                </code>
                . When <code className="font-mono">media_filename</code> is provided, the importer checks if a file with that name has already been uploaded in the <strong>Media Library</strong> (<code className="font-mono">/uploads/</code>). If not yet uploaded, the post is still imported safely as a draft and flagged so you can upload the image/video separately. Automatic ZIP media archive extraction is not enabled in this build.
              </div>

              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Upload UTF-8 .CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        setCsvRawText(text);
                        setCsvPreviewReport(null);
                      }}
                      className="w-full text-xs border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Default Campaign Assignment (if <code className="font-mono">campaign_id</code> column is blank)
                    </label>
                    <select
                      value={csvTargetCampaignId}
                      onChange={e => setCsvTargetCampaignId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 bg-white"
                    >
                      <option value="">None (Standalone Posts)</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={csvSkipDuplicates}
                        onChange={e => setCsvSkipDuplicates(e.target.checked)}
                      />
                      <span>Idempotent Import: Skip duplicate rows automatically</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    CSV Content (Edit or Paste UTF-8 CSV Rows)
                  </label>
                  <textarea
                    rows={7}
                    value={csvRawText}
                    onChange={e => {
                      setCsvRawText(e.target.value);
                      setCsvPreviewReport(null);
                    }}
                    placeholder="campaign_id,post_title,platform,post_type,caption,hashtags,platform_tags,media_filename,media_url,scheduled_at,status..."
                    className="w-full p-3 text-xs font-mono border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={csvValidating}
                    onClick={handleValidateCsv}
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    {csvValidating ? 'Validating...' : '1. Validate & Preview CSV'}
                  </button>
                  <button
                    type="button"
                    disabled={csvImporting || !csvRawText.trim()}
                    onClick={handleCommitCsvImport}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {csvImporting ? 'Importing...' : '2. Import Valid Rows as Drafts'}
                  </button>
                  {lastImportedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPostIds(lastImportedIds);
                        setActiveSection('queue');
                      }}
                      className="px-4 py-2 text-xs font-semibold border border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                    >
                      3. Schedule Newly Imported Batch ({lastImportedIds.length} Posts)
                    </button>
                  )}
                </div>
              </div>

              {/* Dry-Run Validation Preview Table */}
              {csvPreviewReport && (
                <div className="bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      CSV Validation & Dry-Run Preview
                    </h2>
                    <div className="text-xs font-mono tabular-nums text-slate-600">
                      Total: {csvPreviewReport.totalRows} · Valid: {csvPreviewReport.validRows} · Invalid:{' '}
                      <span className="text-red-600 font-semibold">{csvPreviewReport.invalidRows}</span> · Duplicates:{' '}
                      {csvPreviewReport.duplicateRows} · Needs Separate Media Upload:{' '}
                      {csvPreviewReport.missingMediaRows}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-3 font-medium">Row</th>
                          <th className="py-2 px-3 font-medium">Platform & Format</th>
                          <th className="py-2 px-3 font-medium">Title & Caption Preview</th>
                          <th className="py-2 px-3 font-medium">Media File Status</th>
                          <th className="py-2 pl-3 font-medium">Validation Diagnostics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {csvPreviewReport.rows.map((r: any) => (
                          <tr key={r.rowNumber} className="align-top">
                            <td className="py-2.5 pr-3 font-mono tabular-nums font-semibold">
                              #{r.rowNumber}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">
                                {getPlatformLabel(r.platform)}
                              </div>
                              <div className="text-slate-500">{getPostTypeLabel(r.postType)}</div>
                            </td>
                            <td className="py-2.5 px-3 max-w-md">
                              <div className="font-medium text-slate-900">{r.title}</div>
                              <div className="text-slate-600 truncate">{r.captionPreview}</div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {r.mediaStatus === 'matched_in_library' && (
                                <span className="text-emerald-700 font-medium">
                                  Matched in /uploads/ ({r.mediaFilename || 'URL'})
                                </span>
                              )}
                              {r.mediaStatus === 'external_url' && (
                                <span className="text-blue-700">External HTTPS URL</span>
                              )}
                              {r.mediaStatus === 'missing_upload_separately' && (
                                <span className="text-amber-700 font-medium">
                                  Upload "{r.mediaFilename}" separately in Media Library
                                </span>
                              )}
                              {r.mediaStatus === 'none' && (
                                <span className="text-slate-400">None referenced</span>
                              )}
                            </td>
                            <td className="py-2.5 pl-3">
                              {r.valid ? (
                                <span className="text-emerald-700 font-semibold">Ready to Import</span>
                              ) : (
                                <div className="text-red-600 font-medium">
                                  {r.errors.join(' · ')}
                                </div>
                              )}
                              {r.warnings?.length > 0 && (
                                <div className="text-amber-700 mt-0.5">
                                  {r.warnings.join(' · ')}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              7. PUBLISHING QUEUE & BULK SCHEDULER
             ================================================================ */}
          {activeSection === 'queue' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Publishing Queue & Bulk Scheduler
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Filter, approve, bulk-schedule selected posts in {tz}, or manually publish verified Facebook Page posts.
                  </p>
                </div>
              </div>

              {/* Bulk Scheduling Bar */}
              <div className="bg-white border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    Batch Scheduling Controls ({selectedPostIds.length} post(s) selected)
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPostIds(
                          filteredPosts.filter(p => p.status !== 'published').map(p => p.id)
                        )
                      }
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Select All Visible Un-published ({filteredPosts.filter(p => p.status !== 'published').length})
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPostIds([])}
                      className="text-slate-600 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      First Post Date & Time ({tz})
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleStartAt}
                      onChange={e => setScheduleStartAt(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Scheduling Cadence
                    </label>
                    <select
                      value={scheduleCadence}
                      onChange={e => setScheduleCadence(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 bg-white"
                    >
                      <option value="daily">Daily (Every 24 Hours)</option>
                      <option value="three-weekly">Every 8 Hours (3x Daily)</option>
                      <option value="weekly">Weekly (Every 7 Days)</option>
                      <option value="custom-hours">Custom Hour Interval</option>
                      <option value="platform-staggered">Platform-Staggered (Minutes Apart)</option>
                    </select>
                  </div>
                  {scheduleCadence === 'custom-hours' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Custom Interval (Hours)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={scheduleGapHours}
                        onChange={e => setScheduleGapHours(Number(e.target.value) || 24)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 font-mono"
                      />
                    </div>
                  ) : scheduleCadence === 'platform-staggered' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Platform Offset (Minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={1440}
                        value={scheduleStaggerMinutes}
                        onChange={e => setScheduleStaggerMinutes(Number(e.target.value) || 30)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 font-mono"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 pb-2">
                      Validates platform media & length rules before queuing.
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      disabled={schedulingBusy || selectedPostIds.length === 0}
                      onClick={() => handleBulkSchedule(selectedPostIds)}
                      className="w-full py-2 px-4 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      {schedulingBusy
                        ? 'Scheduling...'
                        : `Schedule ${selectedPostIds.length} Selected Post(s)`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 p-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search title, caption, hashtags, or tags..."
                  className="px-3 py-1.5 text-xs border border-slate-300 flex-1 min-w-[200px]"
                />
                <select
                  value={platformFilter}
                  onChange={e => setPlatformFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs border border-slate-300 bg-white"
                >
                  <option value="all">All Platforms (7)</option>
                  {PLATFORM_LIST.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs border border-slate-300 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  value={campaignFilter}
                  onChange={e => setCampaignFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 bg-white"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Posts Data Table */}
              <div className="bg-white border border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-3 pl-4 pr-2 w-8">Select</th>
                      <th className="py-3 px-3 font-medium">Platform & Type</th>
                      <th className="py-3 px-3 font-medium">Post Content</th>
                      <th className="py-3 px-3 font-medium">Media</th>
                      <th className="py-3 px-3 font-medium">Scheduled ({tz})</th>
                      <th className="py-3 px-3 font-medium">Status</th>
                      <th className="py-3 pl-3 pr-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPosts.map(post => {
                      const isChecked = selectedPostIds.includes(post.id);
                      return (
                        <tr key={post.id} className="hover:bg-slate-50 align-top">
                          <td className="py-3 pl-4 pr-2">
                            {post.status !== 'published' && (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedPostIds(prev => [...prev, post.id]);
                                  } else {
                                    setSelectedPostIds(prev => prev.filter(id => id !== post.id));
                                  }
                                }}
                              />
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">
                              {getPlatformLabel(post.platform)}
                            </div>
                            <div className="text-slate-500">{getPostTypeLabel(post.postType)}</div>
                          </td>
                          <td className="py-3 px-3 max-w-md">
                            <div className="font-semibold text-slate-900">
                              {post.title || post.topic}
                            </div>
                            <p className="text-slate-600 line-clamp-2 mt-0.5">{post.caption}</p>
                            {post.lastError && (
                              <div className="text-red-600 mt-1 font-medium">
                                Error: {post.lastError}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {post.imageUrl || post.mediaUrls.length > 0 ? (
                              <span className="text-emerald-700 font-medium">Attached</span>
                            ) : POST_TYPES[post.postType].requiresMedia ? (
                              <span className="text-amber-700">Required before schedule</span>
                            ) : (
                              <span className="text-slate-400">Text/Link</span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums text-slate-700">
                            {formatDateTimeKarachi(post.scheduledAt, tz)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono uppercase font-semibold">
                            <span
                              className={
                                post.status === 'published'
                                  ? 'text-emerald-700'
                                  : post.status === 'scheduled'
                                    ? 'text-blue-700'
                                    : post.status === 'failed'
                                      ? 'text-red-600'
                                      : 'text-slate-700'
                              }
                            >
                              {post.status}
                            </span>
                          </td>
                          <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap space-x-1.5">
                            {post.status === 'draft' && (
                              <button
                                type="button"
                                onClick={() => handleApprovePost(post.id)}
                                className="px-2 py-1 border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {post.status !== 'published' && (
                              <button
                                type="button"
                                onClick={() => openPostInComposer(post)}
                                className="px-2 py-1 border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
                              >
                                Edit
                              </button>
                            )}
                            {post.platform === 'facebook' && post.status !== 'published' && (
                              <button
                                type="button"
                                onClick={() => handlePublishNow(post)}
                                className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                              >
                                Publish FB
                              </button>
                            )}
                            {post.status !== 'published' && (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post)}
                                className="px-2 py-1 text-red-600 hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================
              8. POST HISTORY & AUDIT LOGS
             ================================================================ */}
          {activeSection === 'history' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Post History & Audit Trail
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Published posts are locked from deletion for audit integrity. Failed publication attempts display diagnostic details.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Published & Failed Publication Records
                </h2>
                {posts.filter(p => p.status === 'published' || p.status === 'failed').length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No published or failed posts recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {posts
                      .filter(p => p.status === 'published' || p.status === 'failed')
                      .map(p => (
                        <div key={p.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {getPlatformLabel(p.platform)} · {p.title || p.topic}
                            </div>
                            <div className="text-slate-600 mt-0.5">{p.caption}</div>
                            {p.facebookPostId && (
                              <div className="font-mono text-emerald-700 mt-1">
                                Published at {formatDateTimeKarachi(p.publishedAt, tz)} · Meta Post ID: {p.facebookPostId}
                              </div>
                            )}
                            {p.lastError && (
                              <div className="font-mono text-red-600 mt-1">
                                Failure Reason: {p.lastError}
                              </div>
                            )}
                          </div>
                          {p.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => openPostInComposer(p)}
                              className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                            >
                              Fix in Composer
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">
                  System Activity Log ({logs.length})
                </h2>
                <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto text-xs">
                  {logs.map(l => (
                    <div key={l.id} className="py-2.5 flex items-center justify-between gap-4">
                      <span className="text-slate-800">{l.message}</span>
                      <span className="font-mono tabular-nums text-slate-500 shrink-0">
                        {formatDateTimeKarachi(l.at, tz)} · {l.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              9. AI PROVIDER SETTINGS (FREE AI ONLY + MASTER PROMPT BUILDER)
             ================================================================ */}
          {activeSection === 'ai-settings' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Free AI Provider Settings & Master Prompt Builder
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Strictly Free-AI-Only architecture: Local Ollama integration, eligible Google Gemini Flash free-tier support, and manual fallback. No paid OpenAI API keys are used or required.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Provider Status & Selector */}
                <form
                  onSubmit={handleSaveStudioSettings}
                  className="bg-white border border-slate-200 p-6 space-y-5"
                >
                  <h2 className="text-base font-semibold text-slate-900">
                    Configure Free AI Engine
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Preferred Content Generation Mode
                    </label>
                    <select
                      value={prefAiProvider}
                      onChange={e => setPrefAiProvider(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 bg-white font-medium"
                    >
                      <option value="auto">
                        Auto (Prefer Local Ollama first, then Google Gemini Free-Tier)
                      </option>
                      <option value="ollama">Ollama Local AI Only (100% Local & Free)</option>
                      <option value="gemini">Google Gemini Free-Tier Eligible Only</option>
                      <option value="manual">Manual Content Creation Only (Disable AI)</option>
                    </select>
                  </div>

                  {/* Ollama Configuration */}
                  <div className="p-4 bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Option A: Local Ollama Integration
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          status?.ollama.reachable ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {status?.ollama.reachable ? 'REACHABLE' : 'NOT DETECTED'}
                      </span>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Ollama Base URL
                      </label>
                      <input
                        type="url"
                        value={ollamaUrlInput}
                        onChange={e => setOllamaUrlInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Ollama Model Name
                      </label>
                      <input
                        type="text"
                        value={ollamaModelInput}
                        onChange={e => setOllamaModelInput(e.target.value)}
                        placeholder="llama3.2"
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    {status?.ollama.installedModels && status.ollama.installedModels.length > 0 && (
                      <div className="text-slate-600">
                        Detected local models: {status.ollama.installedModels.join(', ')}
                      </div>
                    )}
                    {status?.ollama.error && (
                      <div className="text-amber-800 leading-relaxed">{status.ollama.error}</div>
                    )}
                    <div className="text-slate-500 leading-relaxed">
                      <strong>Hosting Note:</strong> Ollama must be installed and running on a machine reachable by this Node.js process. A <code className="font-mono">localhost:11434</code> URL on your personal computer is not reachable from a remote Hostinger server unless hosted on the same VPS or connected via a secure tunnel.
                    </div>
                  </div>

                  {/* Gemini Free-Tier Status */}
                  <div className="p-4 bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Option B: Google Gemini (Free-Tier Eligible Flash Models)
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          status?.gemini.keyConfigured ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {status?.gemini.keyConfigured ? 'SERVER KEY CONFIGURED' : 'KEY NOT SET'}
                      </span>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Allowed Free-Tier Eligible Model
                      </label>
                      <select
                        value={geminiModelInput}
                        onChange={e => setGeminiModelInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono"
                      >
                        {(status?.gemini.allowedFreeModels || [
                          'gemini-2.5-flash',
                          'gemini-3.8-flash',
                          'gemini-flash-latest',
                          'gemini-3.1-flash-lite',
                        ]).map(m => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{status?.gemini.notice}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={loadAllStudioData}
                      className="px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      Re-test Provider Availability
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                    >
                      Save AI Provider Settings
                    </button>
                  </div>
                </form>

                {/* Master Prompt Builder (Preserved & Upgraded from v1.2) */}
                <div className="bg-white border border-slate-200 p-6 space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Master Prompt Builder (Prompt → PDF / External Free AI)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Generate a structured multi-platform prompt that you can print/save as PDF or paste into any external tool to produce bulk CSV rows.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={masterPromptBrand}
                        onChange={e => setMasterPromptBrand(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Topic / Series</label>
                      <input
                        type="text"
                        value={masterPromptTopic}
                        onChange={e => setMasterPromptTopic(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Row Count</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={masterPromptCount}
                        onChange={e => setMasterPromptCount(Number(e.target.value) || 10)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  {(() => {
                    const builtPrompt = `TOPTECH SOCIAL STUDIO v2.0 — MULTI-PLATFORM CAMPAIGN & CSV MASTER PROMPT

Act as a senior social media strategist and copywriter for ${masterPromptBrand}.
Series / Topic: ${masterPromptTopic}
Target Audience: ${aiAudience}
Tone: ${aiTone}
Number of platform-specific posts: ${masterPromptCount}
Platforms: facebook, instagram, linkedin, x, tiktok, youtube, threads
Supported post_type values: image, video, text, carousel, reel, story, link, youtube_video

Output a strict UTF-8 CSV table with these exact headers:
campaign_id,post_title,topic,series_name,episode_number,platform,post_type,caption,article_text,hashtags,platform_tags,call_to_action,destination_url,media_filename,media_url,scheduled_at,status

Rules:
1. One row per platform-specific post.
2. Respect platform character limits (X <= 280, Threads <= 500, Instagram <= 2200, LinkedIn <= 3000, TikTok <= 4000, YouTube <= 5000).
3. Keep hashtags separate from platform_tags (e.g. YouTube comma-separated search tags).
4. Set status to "draft" for human review. Never fabricate statistics, testimonials, or guarantees.`;

                    return (
                      <>
                        <textarea
                          rows={10}
                          readOnly
                          value={builtPrompt}
                          className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(builtPrompt);
                              showNotification('success', 'Master Prompt copied to clipboard.');
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                          >
                            Copy Prompt
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadTextFile('toptech-master-prompt.txt', builtPrompt)
                            }
                            className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                          >
                            Download .TXT
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                          >
                            Print / Save as PDF
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              10. CONNECTED PLATFORMS (FACEBOOK GRAPH API + 6 PLANNING PLATFORMS)
             ================================================================ */}
          {activeSection === 'platforms' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Connected Platforms & Publishing Configuration
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Server-side credentials only. Access tokens are never exposed to browser code or logs.
                </p>
              </div>

              {/* Facebook Page Integration Card */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Facebook Page Publishing (Meta Graph API {status?.graphVersion})
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Supports text posts, link shares, image uploads, and video uploads to your authorized Facebook Page.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={fbTesting}
                    onClick={handleTestFacebook}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    {fbTesting ? 'Testing Meta Graph API...' : 'Test Facebook Page Connection'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">META_PAGE_ID & TOKEN</div>
                    <div className="font-semibold text-slate-900 mt-1">
                      {status?.metaConfigured
                        ? `Configured (Page ID: ${status.metaPageIdPreview})`
                        : 'Not Set in Server .env'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">ENABLE_FACEBOOK_PUBLISHING</div>
                    <div className="font-semibold text-slate-900 mt-1 font-mono">
                      {status?.publishingEnabled ? 'true (Manual Publish Ready)' : 'false (Disabled by Default)'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">ENABLE_AUTO_PUBLISH</div>
                    <div className="font-semibold text-slate-900 mt-1 font-mono">
                      {status?.autoPublishEnabled ? 'true (30s Scheduler Active)' : 'false (Manual Approval Only)'}
                    </div>
                  </div>
                </div>

                {fbTestResult && (
                  <div
                    className={`p-3.5 border text-xs ${
                      fbTestResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {fbTestResult.message}
                  </div>
                )}
              </div>

              {/* Other 6 Platforms Architectural Honesty Matrix */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Independent Platform Adapter Status (Content Design vs Direct Publishing)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {PLATFORM_LIST.filter(p => p.id !== 'facebook').map(plat => (
                    <div key={plat.id} className="p-4 border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-900 text-sm">{plat.name}</div>
                      <div className="text-emerald-700 font-medium">
                        Active: Content Design, Character/Media Validation, Campaign Planning & CSV Export
                      </div>
                      <div className="text-slate-500">
                        Direct API Publishing: Not connected in this single-admin build. Requires separate developer app approval and OAuth workflow.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              10B. LOGIN INFO, AUTO-PICKED FACEBOOK PAGE & VARIABLE LINKS
             ================================================================ */}
          {activeSection === 'login-info' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Login Info, Auto-Picked Facebook Page & Variable Source Links
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Automatically picks <code className="font-mono">META_PAGE_ID</code>, Page Name, and Graph settings upon login from your connected Facebook Page, lets you configure variable values, and provides direct links to every portal where values can be obtained.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBrowserFacebookSessionPick}
                    disabled={liAutoDiscoverBusy}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${liAutoDiscoverBusy ? 'animate-spin' : ''}`} />
                    <span>
                      {liAutoDiscoverBusy
                        ? 'Checking Logged-In Facebook Page...'
                        : 'Auto-Pick from Logged-In Facebook Page'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const envText = [
                        '# TopTech Social Studio — Free AI Edition',
                        `PORT=${status?.port || 3000}`,
                        `NODE_ENV=${status?.nodeEnv || 'production'}`,
                        `TIMEZONE=${timezoneInput || 'Asia/Karachi'}`,
                        '',
                        `ADMIN_USERNAME=${liAdminUsername || 'admin'}`,
                        'ADMIN_PASSWORD=replace_with_a_strong_admin_password',
                        'SESSION_SECRET=replace_with_a_long_random_secret_at_least_32_characters',
                        '',
                        `PREFERRED_AI_PROVIDER=${prefAiProvider || 'auto'}`,
                        'GEMINI_API_KEY=',
                        `GEMINI_MODEL=${geminiModelInput || 'gemini-2.5-flash'}`,
                        `OLLAMA_BASE_URL=${ollamaUrlInput || 'http://127.0.0.1:11434'}`,
                        `OLLAMA_MODEL=${ollamaModelInput || 'llama3.1:8b'}`,
                        '',
                        `ENABLE_FACEBOOK_PUBLISHING=${liEnableFbPublishing ? 'true' : 'false'}`,
                        `ENABLE_AUTO_PUBLISH=${liEnableAutoPublish ? 'true' : 'false'}`,
                        `META_PAGE_ID=${liMetaPageId || ''}`,
                        'META_PAGE_ACCESS_TOKEN=',
                        `META_GRAPH_VERSION=${liMetaGraphVersion || 'v23.0'}`,
                      ].join('\n');
                      downloadTextFile('toptech_social_studio_free_ai.env', envText);
                    }}
                    className="px-3.5 py-2 border border-slate-300 bg-white text-slate-800 text-xs font-medium hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Configured .env Template</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Automatic Facebook Page Session Detection & Discovered Pages */}
              <div className="bg-white border border-slate-200 p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      1. Automatic Facebook Page Picker (Triggered on Login & On-Demand)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Whenever you sign in to TopTech Social Studio, the server inspects your active Facebook Graph token (<code className="font-mono">/me/accounts</code> and <code className="font-mono">/me</code>) or browser Facebook session and automatically populates <code className="font-mono">META_PAGE_ID</code>, Page Name, Category, and <code className="font-mono">META_GRAPH_VERSION</code>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAutoDiscoverFacebook()}
                      disabled={liAutoDiscoverBusy}
                      className="px-3 py-1.5 border border-slate-300 bg-white text-xs font-medium hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Sync Server Graph Token
                    </button>
                    <button
                      type="button"
                      onClick={handleTestFacebook}
                      disabled={fbTesting}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                      {fbTesting ? 'Verifying...' : 'Verify Active Page'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Auto-Picked Page Name</div>
                    <div className="font-semibold text-slate-900 mt-1 text-sm">
                      {status?.metaPageName || liMetaPageName || 'Not detected yet'}
                    </div>
                    {status?.metaPageCategory && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Category: {status.metaPageCategory}
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Active META_PAGE_ID</div>
                    <div className="font-mono font-semibold text-slate-900 mt-1 text-sm tabular-nums">
                      {status?.metaPageId || liMetaPageId || 'Not set'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">META_PAGE_ACCESS_TOKEN</div>
                    <div
                      className={`font-semibold mt-1 text-sm ${
                        status?.metaTokenConfigured ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {status?.metaTokenConfigured
                        ? 'Configured & Ready'
                        : 'Missing (See link below)'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">Active META_GRAPH_VERSION</div>
                    <div className="font-mono font-semibold text-slate-900 mt-1 text-sm">
                      {status?.graphVersion || liMetaGraphVersion || 'v23.0'}
                    </div>
                  </div>
                </div>

                {fbTestResult && (
                  <div
                    className={`p-3.5 border text-xs ${
                      fbTestResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {fbTestResult.message}
                  </div>
                )}

                {/* Discovered Pages Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Discovered Facebook Pages from Logged-In Account ({status?.discoveredPages?.length || 0})
                    </h3>
                  </div>
                  {status?.discoveredPages && status.discoveredPages.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                            <th className="py-2.5 px-3 font-semibold">Page Name</th>
                            <th className="py-2.5 px-3 font-semibold">META_PAGE_ID</th>
                            <th className="py-2.5 px-3 font-semibold">Category</th>
                            <th className="py-2.5 px-3 font-semibold">Page Token</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {status.discoveredPages.map(page => {
                            const isCurrent = (status?.metaPageId || liMetaPageId) === page.id;
                            return (
                              <tr key={page.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  {page.name}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">
                                  {page.id}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {page.category || 'Facebook Page'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={
                                      page.hasAccessToken
                                        ? 'text-emerald-700 font-medium'
                                        : 'text-slate-500'
                                    }
                                  >
                                    {page.hasAccessToken ? 'Page Token Synced' : 'Standard'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {isCurrent ? (
                                    <span className="text-emerald-700 font-semibold">
                                      Active Page
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectDiscoveredPage(page)}
                                      className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                                    >
                                      Pick This Page
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      No Facebook Pages have been auto-discovered yet. If you are already logged into Facebook in your browser, either enter your optional <strong>Facebook App ID</strong> below and click <strong>Auto-Pick from Logged-In Facebook Page</strong>, or open the{' '}
                      <a
                        href="https://developers.facebook.com/tools/explorer/?method=GET&path=me%2Faccounts%3Ffields%3Did%2Cname%2Ccategory%2Caccess_token"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline font-medium inline-flex items-center gap-1"
                      >
                        <span>Meta Graph API Explorer (GET /me/accounts)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      to copy your Page ID Directly.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Interactive Variable Values Form (in addition to existing tables) */}
              <form onSubmit={handleSaveLoginInfo} className="bg-white border border-slate-200 p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      2. Configure Studio Variable Values (<code className="font-mono">toptech_social_studio_free_ai.env</code>)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Edit and persist runtime variables directly in the studio database. Values updated here apply immediately without restarting the server.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={liSaving}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    {liSaving ? 'Saving Variable Values...' : 'Save Variable Values'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* ADMIN_USERNAME */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        ADMIN_USERNAME
                      </label>
                      <span className="text-[11px] text-slate-500">Single-admin login</span>
                    </div>
                    <input
                      type="text"
                      value={liAdminUsername}
                      onChange={e => setLiAdminUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* TIMEZONE */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        TIMEZONE
                      </label>
                      <a
                        href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>IANA TZ List</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      value={timezoneInput}
                      onChange={e => setTimezoneInput(e.target.value)}
                      placeholder="Asia/Karachi"
                      className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  {/* PREFERRED_AI_PROVIDER */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        PREFERRED_AI_PROVIDER
                      </label>
                      <span className="text-[11px] text-emerald-700 font-medium">Free AI Only</span>
                    </div>
                    <select
                      value={prefAiProvider}
                      onChange={e => setPrefAiProvider(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="auto">auto (Ollama Local -&gt; Gemini Free Tier -&gt; Manual)</option>
                      <option value="ollama">ollama (Local Free Ollama Only)</option>
                      <option value="gemini">gemini (Google Gemini Free Tier Only)</option>
                      <option value="manual">manual (Manual Studio Only — Zero AI Calls)</option>
                    </select>
                  </div>

                  {/* GEMINI_MODEL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        GEMINI_MODEL
                      </label>
                      <a
                        href="https://ai.google.dev/gemini-api/docs/models/gemini"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Eligible Models</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <select
                      value={geminiModelInput}
                      onChange={e => setGeminiModelInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 bg-white font-mono focus:outline-none focus:border-blue-600"
                    >
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                      <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    </select>
                  </div>

                  {/* OLLAMA_BASE_URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        OLLAMA_BASE_URL
                      </label>
                      <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Get Ollama</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      value={ollamaUrlInput}
                      onChange={e => setOllamaUrlInput(e.target.value)}
                      placeholder="http://127.0.0.1:11434"
                      className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* OLLAMA_MODEL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        OLLAMA_MODEL
                      </label>
                      <a
                        href="https://ollama.com/library/llama3.1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Model Library</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      value={ollamaModelInput}
                      onChange={e => setOllamaModelInput(e.target.value)}
                      placeholder="llama3.1:8b"
                      className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* META_PAGE_ID */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        META_PAGE_ID
                      </label>
                      <a
                        href="https://www.facebook.com/pages/?category=your_pages"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Find Page ID</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      value={liMetaPageId}
                      onChange={e => setLiMetaPageId(e.target.value)}
                      placeholder="Auto-picked on Facebook login or enter Page ID"
                      className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* META_GRAPH_VERSION */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        META_GRAPH_VERSION
                      </label>
                      <a
                        href="https://developers.facebook.com/docs/graph-api/changelog/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Graph Versions</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      value={liMetaGraphVersion}
                      onChange={e => setLiMetaGraphVersion(e.target.value)}
                      placeholder="v23.0"
                      className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Optional Facebook App ID for Browser Session Auto-Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold font-mono text-slate-800">
                        FACEBOOK_APP_ID <span className="font-sans font-normal text-slate-500">(Optional)</span>
                      </label>
                      <a
                        href="https://developers.facebook.com/apps/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Meta Apps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      value={liFacebookAppId}
                      onChange={e => setLiFacebookAppId(e.target.value)}
                      placeholder="Optional App ID for browser FB.getLoginStatus"
                      className="w-full px-3 py-2 text-sm border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* ENABLE_FACEBOOK_PUBLISHING */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold font-mono text-slate-800">
                        ENABLE_FACEBOOK_PUBLISHING
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Allow live Graph API publishing to your Facebook Page
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={liEnableFbPublishing}
                      onChange={e => setLiEnableFbPublishing(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* ENABLE_AUTO_PUBLISH */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold font-mono text-slate-800">
                        ENABLE_AUTO_PUBLISH
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        30-second background scheduler for due Facebook posts
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={liEnableAutoPublish}
                      onChange={e => setLiEnableAutoPublish(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Server-Side Secret Status Summary */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 flex flex-col justify-center">
                    <div className="text-xs font-semibold text-slate-800">
                      Server-Only Secret Variables (.env / Hostinger)
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                      <div>
                        <code className="font-mono">GEMINI_API_KEY</code>:{' '}
                        <strong className={status?.gemini.keyConfigured ? 'text-emerald-700' : 'text-slate-600'}>
                          {status?.gemini.keyConfigured ? 'Configured on Server' : 'Not Set'}
                        </strong>
                      </div>
                      <div>
                        <code className="font-mono">META_PAGE_ACCESS_TOKEN</code>:{' '}
                        <strong className={status?.metaTokenConfigured ? 'text-emerald-700' : 'text-slate-600'}>
                          {status?.metaTokenConfigured ? 'Configured on Server' : 'Not Set'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {/* Section 3: Complete Reference Table with Direct Links to Obtain Each Variable Value */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    3. Official Source Links — Where to Obtain Every Variable Value
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Use the direct links below to open the exact Facebook, Meta Developer, Google AI Studio, Ollama, or Hostinger page from where each variable value can be copied.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold">Variable Name</th>
                        <th className="py-2.5 px-3 font-semibold">Current Value / Status</th>
                        <th className="py-2.5 px-3 font-semibold">How to Obtain or Auto-Pick Value</th>
                        <th className="py-2.5 px-3 font-semibold">Relevant Links to Get Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* META_PAGE_ID */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          META_PAGE_ID
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800 tabular-nums">
                          {status?.metaPageId || liMetaPageId || 'Not set'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          Automatically picked when you sign in or click <strong>Auto-Pick from Logged-In Facebook Page</strong> above. Can also be copied from your Facebook Page &rarr; About &rarr; Page Transparency, or via <code className="font-mono">GET /me/accounts</code> in Graph API Explorer.
                        </td>
                        <td className="py-3 px-3 space-y-1">
                          <div>
                            <a
                              href="https://www.facebook.com/pages/?category=your_pages"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Facebook — Your Managed Pages</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://developers.facebook.com/tools/explorer/?method=GET&path=me%2Faccounts%3Ffields%3Did%2Cname%2Ccategory"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Graph API Explorer (/me/accounts)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://business.facebook.com/latest/settings/pages"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Meta Business Suite — Pages</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* META_PAGE_ACCESS_TOKEN */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          META_PAGE_ACCESS_TOKEN
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={
                              status?.metaTokenConfigured
                                ? 'text-emerald-700 font-semibold'
                                : 'text-amber-700 font-semibold'
                            }
                          >
                            {status?.metaTokenConfigured ? 'Configured on Server' : 'Not Configured'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          Open Meta Graph API Explorer, select your Meta App, choose your Facebook Page under <strong>User or Page</strong>, grant <code className="font-mono">pages_show_list</code>, <code className="font-mono">pages_read_engagement</code>, and <code className="font-mono">pages_manage_posts</code>, then generate a Page Access Token.
                        </td>
                        <td className="py-3 px-3 space-y-1">
                          <div>
                            <a
                              href="https://developers.facebook.com/tools/explorer/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Meta Graph API Explorer</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://developers.facebook.com/tools/debug/accesstoken/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Meta Access Token Debugger</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://developers.facebook.com/apps/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Meta for Developers — My Apps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* META_GRAPH_VERSION */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          META_GRAPH_VERSION
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800">
                          {status?.graphVersion || liMetaGraphVersion || 'v23.0'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          Automatically defaults to <code className="font-mono">v23.0</code>. Check the official Meta Graph API Changelog for the latest active API version string.
                        </td>
                        <td className="py-3 px-3">
                          <a
                            href="https://developers.facebook.com/docs/graph-api/changelog/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <span>Meta Graph API Changelog</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>

                      {/* ENABLE_FACEBOOK_PUBLISHING & ENABLE_AUTO_PUBLISH */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          ENABLE_FACEBOOK_PUBLISHING<br />
                          ENABLE_AUTO_PUBLISH
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800">
                          Publishing: {liEnableFbPublishing ? 'true' : 'false'}
                          <br />
                          Auto-Publish: {liEnableAutoPublish ? 'true' : 'false'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          Set to <code className="font-mono">true</code> once your Facebook Page ID and Page Access Token are verified.
                        </td>
                        <td className="py-3 px-3">
                          <a
                            href="https://developers.facebook.com/docs/pages-api/posts/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <span>Meta Pages Publishing Guide</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>

                      {/* GEMINI_API_KEY */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          GEMINI_API_KEY
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={
                              status?.gemini.keyConfigured
                                ? 'text-emerald-700 font-semibold'
                                : 'text-slate-600'
                            }
                          >
                            {status?.gemini.keyConfigured
                              ? 'Configured on Server'
                              : 'Optional (Free Tier)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          Generate a free-tier Gemini API key in Google AI Studio and set it in your server <code className="font-mono">.env</code> or AI Studio Secrets panel. Never requires a paid OpenAI key.
                        </td>
                        <td className="py-3 px-3 space-y-1">
                          <div>
                            <a
                              href="https://aistudio.google.com/app/apikey"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Google AI Studio — Get API Key</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://ai.google.dev/pricing"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Gemini API Free Tier Quotas</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* GEMINI_MODEL */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          GEMINI_MODEL
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800">
                          {geminiModelInput || 'gemini-2.5-flash'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          Recommended free-tier eligible model is <code className="font-mono">gemini-2.5-flash</code> or <code className="font-mono">gemini-2.5-flash-lite</code>.
                        </td>
                        <td className="py-3 px-3">
                          <a
                            href="https://ai.google.dev/gemini-api/docs/models/gemini"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <span>Google Gemini Model Reference</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>

                      {/* OLLAMA_BASE_URL & OLLAMA_MODEL */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          OLLAMA_BASE_URL<br />
                          OLLAMA_MODEL
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800">
                          {ollamaUrlInput || 'http://127.0.0.1:11434'}
                          <br />
                          {ollamaModelInput || 'llama3.1:8b'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          100% free local AI engine with zero external API keys or rate limits. Install Ollama locally and run <code className="font-mono">ollama pull llama3.1:8b</code>.
                        </td>
                        <td className="py-3 px-3 space-y-1">
                          <div>
                            <a
                              href="https://ollama.com/download"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Download Ollama (Free Local AI)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://ollama.com/library/llama3.1"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Ollama Model Library (llama3.1:8b)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* PORT, NODE_ENV, TIMEZONE, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET */}
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          PORT / NODE_ENV / TIMEZONE<br />
                          ADMIN_USERNAME / ADMIN_PASSWORD / SESSION_SECRET
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800">
                          PORT={status?.port || 3000} | {status?.nodeEnv || 'development'}
                          <br />
                          TZ={timezoneInput || 'Asia/Karachi'} | User={liAdminUsername}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          Configure in Hostinger hPanel &rarr; Websites &rarr; Manage &rarr; Node.js &rarr; Environment Variables, or in your server <code className="font-mono">.env</code> file.
                        </td>
                        <td className="py-3 px-3 space-y-1">
                          <div>
                            <a
                              href="https://hpanel.hostinger.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Hostinger hPanel Dashboard</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://support.hostinger.com/en/articles/1583255-how-to-host-a-node-js-application"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Hostinger Node.js Deployment Guide</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div>
                            <a
                              href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>IANA Timezones (Asia/Karachi)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              11. APPLICATION SETTINGS & DATA SAFETY (BACKUPS & HOSTINGER)
             ================================================================ */}
          {activeSection === 'settings' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Application Settings, Data Protection & Hostinger Readiness
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Manage display timezone, create/restore non-destructive JSON backups, and verify production security settings.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Data Safety & Backups */}
                <div className="bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Data Safety & Timestamped Backups
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Primary storage: <code className="font-mono">data/posts.json</code>. Automatic snapshots are saved in <code className="font-mono">data/backups/</code> before bulk CSV imports or campaign deletions.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href="/api/export"
                      className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Full JSON Backup</span>
                    </a>
                    <a
                      href="/api/export/csv"
                      className="px-3.5 py-2 border border-slate-300 bg-white text-xs font-medium hover:bg-slate-50 inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export All Posts (CSV)</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCreateBackup}
                      className="px-3.5 py-2 border border-blue-600 text-blue-700 bg-blue-50 text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                    >
                      Create Server Snapshot Now
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-800 mb-2">
                      Available Server Snapshots ({backups.length})
                    </div>
                    {backups.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No snapshots created yet. Click "Create Server Snapshot Now" to save a recovery point.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto text-xs">
                        {backups.map(b => (
                          <div
                            key={b.filename}
                            className="py-2 flex items-center justify-between gap-2"
                          >
                            <div className="truncate font-mono text-slate-700">
                              {b.filename}{' '}
                              <span className="text-slate-400">({formatBytes(b.sizeBytes)})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(b.filename)}
                              className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 font-medium shrink-0 cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security, Timezone & Hostinger Deployment Checklist */}
                <div className="bg-white border border-slate-200 p-6 space-y-5">
                  <h2 className="text-base font-semibold text-slate-900">
                    Timezone & Hostinger Node.js Deployment Audit
                  </h2>

                  <form onSubmit={handleSaveStudioSettings} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Default Display Timezone
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={timezoneInput}
                          onChange={e => setTimezoneInput(e.target.value)}
                          className="px-3 py-2 border border-slate-300 font-mono flex-1"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer"
                        >
                          Save Timezone
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                    <div className="font-semibold text-slate-900">
                      Production & Single-Admin MVP Security Status
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Environment Mode (NODE_ENV)</span>
                      <span className="font-mono font-semibold">{status?.nodeEnv}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">ADMIN_PASSWORD Configured</span>
                      <span
                        className={`font-mono font-semibold ${
                          status?.adminPasswordConfigured ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {status?.adminPasswordConfigured ? 'Yes (Protected)' : 'Using Default / Preview'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">SESSION_SECRET Configured</span>
                      <span
                        className={`font-mono font-semibold ${
                          status?.sessionSecretConfigured ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {status?.sessionSecretConfigured ? 'Yes' : 'Set in .env for Production'}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed pt-2">
                      <strong>Single-Admin MVP Scope Notice:</strong> This application is a single-admin studio storing records in <code className="font-mono">data/posts.json</code> and <code className="font-mono">uploads/</code>. When deploying updates on Hostinger, do not overwrite <code className="font-mono">data/</code> or <code className="font-mono">uploads/</code>, and download a JSON backup before redeploying.
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete 14-Variable Free-AI Environment Configuration Audit */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Environment Variables Reference & Runtime Status (.env.example)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Matches <code className="font-mono">toptech_social_studio_free_ai.env</code> exactly. Secrets are never exposed to the browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        '.env.example',
                        `# TopTech Social Studio — FREE-AI configuration
# This file does not require an OpenAI paid API key.
# Keep real credentials private; never commit .env to GitHub.

NODE_ENV=development
PORT=3000

# Admin / session security
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_THIS_TO_A_STRONG_PASSWORD
SESSION_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET

# Google Gemini API — use only if your account/model is eligible for Google's free tier.
# Free quotas and availability can change. Leave blank to disable Gemini API.
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Optional local AI via Ollama (no AI API fee; requires Ollama installed and running locally).
# Example model: llama3.2
# This works only if your application code supports the Ollama endpoint/settings.
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Facebook Page publishing (optional; independent of AI provider).
# Keep disabled until you have configured and tested valid Meta credentials.
ENABLE_FACEBOOK_PUBLISHING=false
ENABLE_AUTO_PUBLISH=false
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
META_GRAPH_VERSION=

# Do not add OPENAI_API_KEY, OPENAI_MODEL, or OPENAI_BASE_URL unless you
# intentionally choose to add a paid or separately configured compatible API.
`
                      )
                    }
                    className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .env.example</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-4 font-medium">Variable</th>
                        <th className="py-2 px-4 font-medium">Default / Template Value</th>
                        <th className="py-2 px-4 font-medium">Runtime Status</th>
                        <th className="py-2 pl-4 font-medium">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">NODE_ENV</td>
                        <td className="py-2 px-4 text-slate-600">development</td>
                        <td className="py-2 px-4 text-slate-800">{status?.nodeEnv || 'development'}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Enforces strict auth & secure cookies when set to production</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">PORT</td>
                        <td className="py-2 px-4 text-slate-600">3000</td>
                        <td className="py-2 px-4 text-slate-800">3000</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">HTTP server port for local and Hostinger Node.js runtime</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">ADMIN_USERNAME</td>
                        <td className="py-2 px-4 text-slate-600">admin</td>
                        <td className="py-2 px-4 text-slate-800">{status?.adminUsername || 'admin'}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Single-admin login username</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">ADMIN_PASSWORD</td>
                        <td className="py-2 px-4 text-slate-600">CHANGE_THIS_TO_A_STRONG_PASSWORD</td>
                        <td className="py-2 px-4 text-slate-800">
                          {status?.adminPasswordConfigured ? 'Configured (Hidden)' : 'Placeholder / Unset'}
                        </td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Verified via scrypt + timingSafeEqual</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">SESSION_SECRET</td>
                        <td className="py-2 px-4 text-slate-600">CHANGE_THIS_TO_A_LONG_RANDOM_SECRET</td>
                        <td className="py-2 px-4 text-slate-800">
                          {status?.sessionSecretConfigured ? 'Configured (Hidden)' : 'Placeholder / Unset'}
                        </td>
                        <td className="py-2 pl-4 font-sans text-slate-600">32+ random characters for session derivation</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">GEMINI_API_KEY</td>
                        <td className="py-2 px-4 text-slate-600">(blank)</td>
                        <td className="py-2 px-4 text-slate-800">
                          {status?.gemini.keyConfigured ? 'Configured on Server (Hidden)' : 'Not Set'}
                        </td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Optional server-side key for Google Gemini free-tier Flash models</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">GEMINI_MODEL</td>
                        <td className="py-2 px-4 text-slate-600">gemini-2.5-flash</td>
                        <td className="py-2 px-4 text-slate-800">{status?.gemini.configuredModel || 'gemini-2.5-flash'}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Restricted to Free-Tier eligible Flash models only</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">OLLAMA_BASE_URL</td>
                        <td className="py-2 px-4 text-slate-600">http://localhost:11434</td>
                        <td className="py-2 px-4 text-slate-800">{status?.ollama.baseUrl || 'http://localhost:11434'}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Local Ollama endpoint (must be reachable by Node server)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">OLLAMA_MODEL</td>
                        <td className="py-2 px-4 text-slate-600">llama3.2</td>
                        <td className="py-2 px-4 text-slate-800">{status?.ollama.configuredModel || 'llama3.2'}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Local open-weights model name in Ollama</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">ENABLE_FACEBOOK_PUBLISHING</td>
                        <td className="py-2 px-4 text-slate-600">false</td>
                        <td className="py-2 px-4 text-slate-800">{String(Boolean(status?.publishingEnabled))}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Safety gate for manual Facebook Page publishing</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">ENABLE_AUTO_PUBLISH</td>
                        <td className="py-2 px-4 text-slate-600">false</td>
                        <td className="py-2 px-4 text-slate-800">{String(Boolean(status?.autoPublishEnabled))}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Safety gate for 30s background scheduler auto-publishing</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">META_PAGE_ID</td>
                        <td className="py-2 px-4 text-slate-600">(blank)</td>
                        <td className="py-2 px-4 text-slate-800">{status?.metaPageIdPreview || 'Not Set'}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Target Facebook Page ID for Graph API</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">META_PAGE_ACCESS_TOKEN</td>
                        <td className="py-2 px-4 text-slate-600">(blank)</td>
                        <td className="py-2 px-4 text-slate-800">
                          {status?.metaConfigured ? 'Configured (Hidden)' : 'Not Set'}
                        </td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Server-side Page Access Token (never sent to client)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-slate-900">META_GRAPH_VERSION</td>
                        <td className="py-2 px-4 text-slate-600">(blank / v23.0)</td>
                        <td className="py-2 px-4 text-slate-800">{status?.graphVersion || 'v23.0'}</td>
                        <td className="py-2 pl-4 font-sans text-slate-600">Meta Graph API version</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
