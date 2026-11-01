# TopTech Social Studio v2.0 — Free-AI Multi-Platform Content, Campaign & Scheduling Studio

**TopTech Social Studio** is a full-stack Node.js + React/TypeScript application developed by **TopTech Solutions** for multi-platform social media content creation, campaign planning, bulk UTF-8 CSV import/export, media validation, and Facebook Page scheduling.

---

## 1. Free-AI-Only Architecture (Zero Paid OpenAI Dependencies)

This application strictly enforces a **Free AI Only** policy:
- **No Paid OpenAI Keys:** All `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_BASE_URL` dependencies and fallbacks have been removed.
- **Local Ollama Integration (Preferred 100% Free Local AI):** Connects to a local or self-hosted Ollama instance (`OLLAMA_BASE_URL=http://localhost:11434`, `OLLAMA_MODEL=llama3.2`).
  - *Important Hosting Note:* Ollama must be installed and running (`ollama serve`) on a machine reachable by the Node.js backend. A `localhost` address on your personal laptop is not automatically reachable from a remote Hostinger server unless Ollama runs on the same VPS or is connected via a secure tunnel.
- **Google Gemini Free-Tier Eligible Flash Models:** Supports `gemini-2.5-flash`, `gemini-3.8-flash`, `gemini-flash-latest`, and `gemini-3.1-flash-lite` when `GEMINI_API_KEY` is configured on the server. Paid-only models are blocked by an explicit allowlist. Free-tier availability and rate limits depend on Google's regional and account terms.
- **Full Manual Mode & Master Prompt Builder:** If no Free AI provider is reachable or free-tier quota is exhausted (`HTTP 429 RESOURCE_EXHAUSTED`), all campaign creation, post editing, media management, CSV importing, and scheduling features work 100% manually without forcing any paid API purchase.

---

## 2. Multi-Platform & Post-Type Support

### Supported Platforms (7)
1. **Facebook Page** — Supports content design, scheduling, CSV import/export, **and** direct server-side publishing via the Meta Graph API (`META_PAGE_ID` + `META_PAGE_ACCESS_TOKEN`).
2. **Instagram** — Content design, media staging, character/format validation (2,200 chars), scheduling & CSV export *(Direct API publishing not connected in this single-admin build)*.
3. **LinkedIn** — Content design, character validation (3,000 chars), scheduling & CSV export *(Direct API publishing not connected)*.
4. **X (Twitter)** — Content design, strict 280-character validation, scheduling & CSV export *(Direct API publishing not connected)*.
5. **TikTok** — Video/reel script & caption design (4,000 chars), media staging, scheduling & CSV export *(Direct API publishing not connected)*.
6. **YouTube** — Video title (100 chars), description (5,000 chars), comma-separated search tags, video staging & CSV export *(Direct API publishing not connected)*.
7. **Threads** — 500-character validation, single topic tag configuration, scheduling & CSV export *(Direct API publishing not connected)*.

### Supported Post Formats (8)
- `image` — Image post with caption
- `video` — Video post with caption
- `text` — Text-only post (or long-form article up to 100,000 chars)
- `carousel` — Multi-image carousel (2–10 images)
- `reel` — Reel / short-form vertical video
- `story` — 24-hour story asset
- `link` — External link preview post (requires destination URL)
- `youtube_video` — YouTube video with mandatory Title, Description, and Search Metadata Tags

---

## 3. Data Safety, Backups & Migration Protection

- **Storage Format:** All posts, campaigns, media metadata, and audit logs are stored in `data/posts.json` (backward-compatible with v1.2 `posts.json` records). Uploaded images and videos are stored in `uploads/`.
- **Automatic Timestamped Snapshots:** Before any bulk CSV import, campaign deletion, or database restore, the server automatically saves a timestamped JSON snapshot in `data/backups/`.
- **Manual Edit Protection:** Posts edited manually (`isManuallyEdited: true`) are protected against accidental overwrite during Free AI campaign generation unless explicitly overridden by the user.
- **Duplicate Publish Prevention:** In-flight locks (`inFlightPublishIds`) and `facebookPostId` checks prevent duplicate Facebook Page posts across retries or scheduler ticks.

---

## 4. Bulk CSV Import & Export Specification

One row represents one platform-specific post. Both legacy v1.2 headers and v2.0 multi-platform headers are supported:

```csv
campaign_id,post_title,topic,series_name,episode_number,platform,post_type,caption,article_text,hashtags,platform_tags,call_to_action,destination_url,media_filename,media_url,scheduled_at,status
```

- **Dry-Run Preview & Validation:** Inspects every row for platform character limits, post-type compatibility, duplicate detection against existing database records, and media availability before importing.
- **Media Filenames:** If `media_filename` matches a file already uploaded to the **Media Library** (`uploads/`), it is linked automatically. Otherwise, the post is imported as a draft and flagged so the file can be uploaded separately. Automatic ZIP archive extraction is not enabled.

---

## 5. Local Installation & Development

1. Ensure **Node.js 20+** is installed.
2. Copy `.env.example` to `.env` and configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
3. Optional Free AI:
   - Install and start [Ollama](https://ollama.com/) locally (`ollama run llama3.2`), **or**
   - Set a free-tier eligible `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash` in `.env`.
4. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```
5. Build for production / Hostinger deployment (`dist/` + bundled `server.js`):
   ```bash
   npm run build
   node server.js
   ```

---

## 6. Honest Scope & Limitations

This application is an upgraded **single-admin MVP studio**. It does not include public multi-tenant SaaS sign-up, tenant-isolated PostgreSQL databases, subscription billing, or automated OAuth publishing for Instagram, LinkedIn, X, TikTok, YouTube, or Threads. Only Facebook Page publishing via server-side Meta Graph API credentials is wired for live publication.
