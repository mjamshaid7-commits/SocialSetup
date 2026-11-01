# TopTech Social Studio — AI + Facebook Publishing Starter

A Node.js dashboard for managing TopTech Solutions Facebook Page content: password-protected admin session, post library, image uploads, AI content generation (Gemini API with OpenAI-compatible fallback), long-form articles, master prompt builder, bulk CSV import, approval workflow, scheduling queue, manual publishing, automatic publishing, activity log, and JSON export.

## Important reality check
This is a deployable integration starter, not a pre-connected Facebook account. No external account can be connected until you configure your own Meta app/Page credentials and AI API key. Meta may require app review, permissions, Page task access, and token renewal depending on your account/app. The app intentionally ships with publishing disabled.

## Requirements
- Node.js 20+
- Persistent writable disk for `data/posts.json` and `uploads/`
- HTTPS in production

## Run locally
1. Extract this ZIP.
2. Copy `.env.example` to `.env`.
3. Set `ADMIN_PASSWORD` to a strong unique password and `SESSION_SECRET` to a random 32+ character value.
4. Optional: set `GEMINI_API_KEY` (preferred) and `GEMINI_MODEL=gemini-2.5-flash` for AI content generation, or use `OPENAI_API_KEY` / `OPENAI_MODEL` as a fallback. Gemini free-tier availability and limits depend on model, region and Google terms; do not assume unlimited free usage.
5. Install and start:
   ```bash
   npm install
   npm start
   ```
6. Open `http://localhost:3000` and log in with your `ADMIN_PASSWORD`.

## Updated features
- Gemini-powered content generation (with OpenAI-compatible fallback), including longer articles.
- Master Prompt Builder with configurable brand, topic, audience, language, content type, platform list and cadence.
- Print / Save as PDF from the browser, plus TXT download and copy.
- UTF-8 CSV bulk import for short captions and long-form article text (up to 100,000 characters per imported item); imports are drafts for review.
- CSV template download and JSON backup.
- Facebook publishing remains opt-in and disabled by default.

CSV headers supported: `title`, `topic`, `series_name`, `episode_number`, `article_text`, `caption`, `content`, `hashtags`, `image_filename`, `image_url`, `scheduled_at`, `scheduled_date`, `publish_at`. The importer creates draft records; it does not silently attach local image files just because a filename appears in CSV. Image ZIP extraction and automatic filename matching are not included yet.

## SaaS scope and important limitations
This ZIP is an upgraded single-admin MVP/starter, not a production-ready multi-tenant SaaS yet. It does not currently include public user registration, tenant-isolated PostgreSQL storage, subscription billing, OAuth connection flows for all platforms, role-based teams, or multi-platform publishing. These require a separate production implementation and provider app approvals. Facebook passwords are never imported or detected; use official Meta OAuth/permissions and server-side tokens. Instagram, Threads, TikTok and YouTube are not yet connected in this build.

## Configure Meta publishing
1. Create/configure an app in Meta for Developers and follow current official Meta documentation for Page content publishing.
2. Ensure the Facebook user has suitable Page access/task permissions and your app has the relevant publishing permissions.
3. Obtain a Page Access Token for the intended Page and store it only in server environment variables.
4. Set `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, and `META_GRAPH_VERSION` in `.env`.
5. Restart the app and use **Integrations & Setup → Test Facebook Page connection**.
6. Keep publishing disabled until tested. Then set `ENABLE_FACEBOOK_PUBLISHING=true` for manual publishing. Set `ENABLE_AUTO_PUBLISH=true` only when you are comfortable allowing due scheduled posts to publish without another confirmation.

Official docs:
- https://developers.facebook.com/docs/pages-api/posts/
- https://developers.facebook.com/docs/graph-api/
- https://ai.google.dev/gemini-api/docs · https://platform.openai.com/docs/

## Scheduling
The server checks for due posts every 30 seconds. Posts with status `scheduled` and a future ISO date are queued. When their scheduled time arrives, automatic publishing runs only if both `ENABLE_FACEBOOK_PUBLISHING=true` and `ENABLE_AUTO_PUBLISH=true`. Failed posts are moved back to `approved` and the error is logged.

## Security and production notes
- Never commit `.env`, tokens, or secrets to GitHub.
- Use HTTPS. Secure cookies are enabled when `NODE_ENV=production`.
- Use a long random `SESSION_SECRET`; this starter uses in-memory sessions and clears sessions on restart.
- JSON storage is intended for a single-instance starter. For production/multiple instances, migrate to PostgreSQL/MySQL and add migrations, robust job locking, audit retention, backups, and monitoring.
- Keep Node process alive on your host. If the host sleeps or restarts, scheduled jobs run only while the app is running; overdue posts are processed after restart.
- Uploaded local images are sent to Meta from the server. If you instead use remote image URLs, the URL must be reachable by Meta and use HTTPS.
- AI output should be reviewed for accuracy, copyright, brand fit, and platform policies before enabling unattended publishing.
- The starter intentionally does not collect or store Facebook user passwords.


## Update 1.2.0 — latest requested workflow

- **Prompt → PDF workflow:** build a reusable master prompt and use the browser print dialog to save it as PDF. The app generates the prompt; the actual long-form content/CSV is produced by the AI tool where you run that prompt.
- **Bulk CSV import:** imports supported rows as drafts and returns IDs for the newly imported batch. It supports long `article_text`/`caption` fields, series metadata, hashtags, image references and schedule metadata. CSV import does not silently publish content.
- **Batch scheduling:** after import, choose a first date/time and cadence (daily, every 8 hours, weekly, or custom interval). The app schedules only the most recently imported batch in the current browser session. Review content before scheduling.
- **Edit existing posts:** the Edit action now loads the saved post into the composer and updates it through the existing PATCH API instead of displaying a misleading not-implemented message.
- **Safety:** batch scheduling queues posts; it does not make a social network connection by itself. Actual automatic publication still depends on valid Meta Page credentials and the server flags `ENABLE_FACEBOOK_PUBLISHING=true` and `ENABLE_AUTO_PUBLISH=true`.

## Important scope limits

This remains a **single-admin MVP**, not a complete multi-tenant SaaS product. It does not yet include customer sign-up, tenant isolation, billing/subscriptions, a managed SQL database, official OAuth onboarding for multiple social networks, Instagram/Threads/TikTok/YouTube publishing, image-ZIP extraction, or production-grade audit/monitoring. Only Facebook Page publishing is implemented in this starter, using a server-configured Meta Page ID and access token. Do not advertise other platform connections as working until those integrations are implemented and tested.
