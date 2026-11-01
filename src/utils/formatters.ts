import { PLATFORMS, POST_TYPES, PlatformId, PostTypeId } from '../shared/platforms';

export function formatDateTimeKarachi(isoString?: string | null, timeZone = 'Asia/Karachi'): string {
  if (!isoString) return 'Unscheduled';
  const time = Date.parse(isoString);
  if (Number.isNaN(time)) return 'Invalid date';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(time));
  } catch {
    return new Date(time).toLocaleString();
  }
}

export function toLocalInputDateTime(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getPlatformLabel(id: PlatformId): string {
  return PLATFORMS[id]?.name || id;
}

export function getPostTypeLabel(id: PostTypeId): string {
  return POST_TYPES[id]?.name || id;
}

export function generateSampleMultiPlatformCsv(campaignId = 'camp-toptech-q4-ai'): string {
  const tomorrow = new Date(Date.now() + 24 * 3600_000).toISOString();
  const twoDays = new Date(Date.now() + 48 * 3600_000).toISOString();
  const threeDays = new Date(Date.now() + 72 * 3600_000).toISOString();

  return [
    'campaign_id,post_title,topic,series_name,episode_number,platform,post_type,caption,article_text,hashtags,platform_tags,call_to_action,destination_url,media_filename,media_url,scheduled_at,status',
    `${campaignId},"Automating Client Onboarding for SMEs","Workflow Automation","Operations Mastery","2","facebook","link","Client onboarding shouldn't require 14 manual emails. Here is how TopTech Solutions structures automated intake forms and status checklists for service teams.","# Client Onboarding Guide\n\nStep 1: Standardize intake fields.\nStep 2: Validate documents automatically.","#TopTechSolutions #SMEAutomation #BusinessOps","@TopTechSolutions, Operations, Software","Read the Full Walkthrough","https://toptechsolutions.example.com/onboarding","","",${tomorrow},draft`,
    `${campaignId},"Why Structured Data Beats Unchecked AI Prompts","Workflow Automation","Operations Mastery","2","linkedin","text","Before deploying AI across your operations team, audit how your records are stored. Clean schemas and human approval stages prevent costly errors.","","","#TopTechSolutions #EnterpriseArchitecture #B2BSaaS","@TopTech Solutions, Software Engineering, Operations","Discuss with our engineering team","https://toptechsolutions.example.com/onboarding","","",${twoDays},draft`,
    `${campaignId},"3 Rules for Reliable Business Automation","Workflow Automation","Operations Mastery","2","x","text","3 rules we follow at TopTech Solutions:\n1. Clean CSV/JSON schemas first\n2. Free/local AI inference where possible\n3. Mandatory human review before publishing","","","#TopTechSolutions #SoftwareEngineering","@TopTechPK","Follow for weekly engineering checklists","","","","",draft`,
    `${campaignId},"Behind the Scenes: Multi-Platform Content Workflow","Workflow Automation","Operations Mastery","2","instagram","carousel","Swipe through our 4-step workflow for planning, validating, and scheduling multi-channel campaigns without paying per-token AI bills.","","","#TopTechSolutions #TechStudio #Productivity #KarachiTech","@toptech.pk, Alt: 4-step workflow diagram","Save this post for your next campaign","","onboarding-carousel-1.png","",${threeDays},draft`,
    `${campaignId},"Full Tutorial: Bulk CSV Content Planning & Scheduling","Workflow Automation","Operations Mastery","2","youtube","youtube_video","Learn how to structure multi-platform social media campaigns in UTF-8 CSV, validate character limits per network, and schedule batches safely.","00:00 Introduction\n01:30 Structuring CSV Columns\n04:15 Validating Platform Limits","#TopTechSolutions #ContentOperations","toptech solutions, csv bulk import, social media scheduler, content operations","Download the CSV template in the description","https://toptechsolutions.example.com/templates","csv-workflow-tutorial.mp4","","",draft`,
  ].join('\r\n');
}
