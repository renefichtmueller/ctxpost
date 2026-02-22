# CtxPost Documentation

> **Version 2.0** | Self-hosted, GDPR-compliant Social Media Scheduler with Local AI

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Features](#features)
6. [Social Media Platforms](#social-media-platforms)
7. [AI Features](#ai-features)
8. [Post Management](#post-management)
9. [Scheduling & Automation](#scheduling--automation)
10. [Analytics](#analytics)
11. [Team Collaboration](#team-collaboration)
12. [Media Management](#media-management)
13. [Short Links & UTM Tracking](#short-links--utm-tracking)
14. [GDPR & Privacy](#gdpr--privacy)
15. [Security](#security)
16. [API Reference](#api-reference)
17. [Deployment](#deployment)
18. [Database Schema](#database-schema)
19. [Internationalization](#internationalization)
20. [Troubleshooting](#troubleshooting)

---

## Overview

CtxPost is a fully self-hosted social media management platform that lets you create, schedule, and publish posts across five major platforms - all from a single dashboard. What makes CtxPost unique is its **local AI integration**: using Ollama, all AI features run on your own hardware, meaning zero API costs and complete data privacy.

### Key Highlights

- **5 Platforms**: Facebook, Instagram, LinkedIn, Twitter/X, Threads
- **15+ AI Models**: Ollama-powered local inference (Mistral, Llama 3, Gemma, Qwen, Phi-3, etc.)
- **$0 AI Costs**: Local processing means no per-request billing
- **100% Open Source**: MIT License
- **GDPR Compliant**: Consent tracking, data export, account deletion, audit logging
- **5 Languages**: English, German, French, Spanish, Portuguese

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | PostgreSQL 14+ with Prisma ORM |
| **Authentication** | NextAuth.js v5 (OAuth 2.0 + Credentials) |
| **AI** | Ollama (local) / Anthropic Claude (optional cloud fallback) |
| **Encryption** | AES-256-GCM (tokens), bcrypt (passwords), TLS 1.3 |
| **Process Manager** | PM2 / Docker |
| **Reverse Proxy** | nginx / Cloudflare Tunnel |

### Project Structure

```
ctxpost/
├── prisma/
│   └── schema.prisma          # Database schema (23+ models)
├── messages/                   # i18n translations
│   ├── de.json                # German
│   ├── en.json                # English
│   ├── fr.json                # French
│   ├── es.json                # Spanish
│   └── pt.json                # Portuguese
├── src/
│   ├── actions/               # Server Actions
│   │   ├── auth.ts            # Registration, login, logout
│   │   ├── posts.ts           # CRUD, scheduling, publishing
│   │   ├── social-accounts.ts # Platform connections
│   │   ├── ai-settings.ts     # AI model configuration
│   │   ├── teams.ts           # Team management
│   │   ├── approvals.ts       # Post review workflow
│   │   ├── brand-style.ts     # Brand voice settings
│   │   ├── categories.ts      # Content categories
│   │   ├── media-library.ts   # Asset management
│   │   ├── short-links.ts     # URL shortener
│   │   └── api-credentials.ts # API key management
│   ├── app/
│   │   ├── (auth)/            # Login & register pages
│   │   ├── (dashboard)/       # Main application
│   │   │   ├── dashboard/     # Overview
│   │   │   ├── posts/         # Post list, create, edit
│   │   │   ├── calendar/      # Calendar view
│   │   │   ├── analytics/     # Metrics dashboard
│   │   │   ├── accounts/      # Social accounts
│   │   │   ├── library/       # Media library
│   │   │   ├── links/         # Short links
│   │   │   ├── team/          # Team members
│   │   │   ├── settings/      # User settings
│   │   │   ├── ai-models/     # Ollama model manager
│   │   │   ├── ai-insights/   # AI analysis
│   │   │   ├── ideas/         # Content ideation
│   │   │   ├── queue/         # Publishing queue
│   │   │   ├── inbox/         # Notifications
│   │   │   └── llm-learning/  # AI feedback
│   │   ├── api/               # API Routes
│   │   │   ├── ai/            # AI endpoints
│   │   │   ├── social/        # OAuth callbacks
│   │   │   ├── cron/          # Scheduled jobs
│   │   │   ├── user/          # GDPR endpoints
│   │   │   └── uploads/       # File serving
│   │   ├── privacy/           # Privacy policy
│   │   └── terms/             # Terms of service
│   ├── components/            # React components
│   │   ├── posts/             # Post editor, preview, AI tools
│   │   ├── settings/          # Settings forms
│   │   ├── analytics/         # Charts, metrics
│   │   └── ui/                # shadcn/ui base components
│   └── lib/                   # Utilities
│       ├── ai/                # AI abstraction layer
│       │   ├── ai-provider.ts # Ollama/Claude switcher
│       │   ├── ollama-client.ts
│       │   ├── claude-client.ts
│       │   ├── prompts.ts     # System prompts
│       │   └── image-generation/
│       ├── social/            # Platform API clients
│       │   ├── publisher.ts   # Publishing orchestrator
│       │   ├── facebook.ts
│       │   ├── instagram.ts
│       │   ├── linkedin.ts
│       │   ├── twitter.ts
│       │   └── threads.ts
│       ├── crypto.ts          # AES-256-GCM encryption
│       ├── audit.ts           # Audit logging
│       ├── rate-limit.ts      # Rate limiting
│       ├── permissions.ts     # RBAC
│       └── validators.ts      # Zod schemas
├── docker-compose.yml         # Multi-container setup
├── deploy.sh                  # PM2 deployment
├── setup-tunnel.sh            # Cloudflare Tunnel
└── .env.example               # Environment template
```

---

## Installation

### Prerequisites

| Requirement | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x+ | Runtime |
| PostgreSQL | 14+ | Database |
| Ollama | Latest | Local AI (optional) |
| npm/pnpm | Latest | Package manager |

### Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ctxpost.git
cd ctxpost

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Generate required secrets
openssl rand -base64 32  # AUTH_SECRET
openssl rand -hex 32     # ENCRYPTION_KEY
openssl rand -hex 32     # CRON_SECRET

# 5. Set up database
createdb social_scheduler
npx prisma db push
npx prisma generate

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create your first account.

### Docker Installation

```bash
# 1. Clone and configure
git clone https://github.com/yourusername/ctxpost.git
cd ctxpost
cp .env.example .env
# Edit .env with your production values

# 2. Start all services
docker compose up -d

# Services started:
# - PostgreSQL (port 5432)
# - CtxPost App (port 3000)
# - nginx reverse proxy (port 80)
# - Cron scheduler (background)
```

### Ollama Setup (Local AI)

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull recommended models
ollama pull llama3.2          # General text (4.7GB)
ollama pull mistral           # Fast creative writing (4.1GB)
ollama pull gemma2            # Google's model (5.4GB)
ollama pull llava             # Image understanding (4.7GB)

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

---

## Configuration

### Environment Variables

#### Required

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `AUTH_SECRET` | NextAuth encryption key | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | AES-256 key for token encryption | `openssl rand -hex 32` |
| `CRON_SECRET` | Secret for cron job endpoints | `openssl rand -hex 32` |
| `AUTH_URL` | Your application URL | `http://localhost:3000` |

#### Optional - AI

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_URL` | Ollama API endpoint | `http://localhost:11434` |
| `ANTHROPIC_API_KEY` | Claude API key (cloud fallback) | Empty |

#### Optional - Social Platforms

| Platform | Variables Needed |
|----------|-----------------|
| Facebook | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |
| Instagram | Uses Facebook credentials + `INSTAGRAM_REDIRECT_URI` |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Twitter/X | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` |
| Threads | `THREADS_APP_ID`, `THREADS_APP_SECRET` |

All redirect URIs follow the pattern: `{YOUR_URL}/api/social/{platform}/callback`

---

## Features

### Dashboard

The main dashboard provides an at-a-glance overview:

- **Upcoming Posts**: Next scheduled posts with countdown timers
- **Recent Activity**: Latest published posts with status
- **Quick Stats**: Total posts, connected accounts, engagement metrics
- **AI Insights**: Content suggestions and trending topics

### Post Editor

The post creation experience is designed for efficiency:

- **Rich Text Editor**: Write once, customize per platform
- **Platform Preview**: See how your post looks on each platform before publishing
- **AI Toolbar**: One-click access to text generation, hashtags, image creation
- **Media Upload**: Drag-and-drop images, videos, and documents
- **Category Tags**: Organize posts by topic/campaign
- **A/B Variants**: Create content variations for testing

### Calendar View

Visual scheduling with drag-and-drop:

- **Monthly/Weekly/Daily** views
- **Drag to reschedule**: Move posts between time slots
- **Color-coded** by platform and status
- **Timezone-aware**: Shows times in your local timezone

---

## Social Media Platforms

### Supported Platforms

| Platform | Text | Images | Video | Scheduling | Analytics |
|----------|------|--------|-------|-----------|-----------|
| Facebook | Yes | Yes | Yes | Yes | Yes |
| Instagram | Yes | Yes | Yes | Yes | Yes |
| LinkedIn | Yes | Yes | - | Yes | Yes |
| Twitter/X | Yes | Yes | - | Yes | Yes |
| Threads | Yes | Yes | - | Yes | Yes |

### Connecting Platforms

1. Navigate to **Settings > API Credentials**
2. Enter your developer app credentials for each platform
3. Go to **Accounts** and click **Connect** for each platform
4. Complete the OAuth authorization flow

### Getting API Credentials

| Platform | Developer Portal | Key Requirements |
|----------|-----------------|-----------------|
| Facebook | [developers.facebook.com](https://developers.facebook.com/apps) | App ID + Secret, `pages_manage_posts` permission |
| Instagram | Same as Facebook | Business account required |
| LinkedIn | [linkedin.com/developers](https://linkedin.com/developers/apps) | Client ID + Secret, `w_member_social` scope |
| Twitter/X | [developer.twitter.com](https://developer.twitter.com/en/portal) | OAuth 2.0 Client ID + Secret |
| Threads | [developers.facebook.com](https://developers.facebook.com/apps) | Threads API access required |

---

## AI Features

### AI Providers

CtxPost supports two AI backends:

#### Ollama (Recommended - Local)
- **Cost**: $0 (runs on your hardware)
- **Privacy**: All data stays on your machine
- **Models**: 15+ open-source models
- **Setup**: Install Ollama + pull models

#### Anthropic Claude (Optional - Cloud)
- **Cost**: Pay-per-token pricing
- **Quality**: State-of-the-art language model
- **Setup**: Add `ANTHROPIC_API_KEY` to `.env`

### AI Capabilities

| Feature | Description | Best Model |
|---------|-------------|------------|
| **Text Generation** | Generate post copy from prompts | Mistral / Llama 3 |
| **Hashtag Suggestions** | Platform-optimized hashtag sets | Gemma 2 |
| **Best Posting Times** | Analyze engagement for optimal scheduling | Llama 3 |
| **Content Ideas** | Generate content ideas based on trends | Mistral |
| **Image Generation** | Create images via ComfyUI/Stable Diffusion | SDXL |
| **Sentiment Analysis** | Analyze tone before publishing | Gemma 2 |
| **Content Variations** | A/B test different copy versions | Mistral |
| **Language Detection** | Auto-detect post language | Any model |

### Brand Style Guide

Define your brand voice to get consistent AI-generated content:

- **Tone**: Professional, casual, humorous, inspirational
- **Voice**: First person, third person, brand name
- **Keywords**: Must-use and avoid-words
- **Emoji Style**: Heavy, moderate, none
- **Hashtag Rules**: Max count, preferred tags

Configure in **Settings > Brand Style**.

### Model Management

Manage Ollama models directly from the dashboard:

- **Browse**: See all available Ollama models
- **Pull**: Download new models with progress tracking
- **Delete**: Remove unused models to free disk space
- **Switch**: Change default model per AI feature

Navigate to **AI Models** in the sidebar.

---

## Post Management

### Post Lifecycle

```
DRAFT --> PENDING_REVIEW --> SCHEDULED --> PUBLISHING --> PUBLISHED
                                                    \--> FAILED
```

1. **Draft**: Create and edit your post
2. **Pending Review**: Submit for team approval (if team workflow is enabled)
3. **Scheduled**: Approved and waiting for the scheduled time
4. **Publishing**: Being sent to social platforms
5. **Published**: Successfully posted
6. **Failed**: Error during publishing (can be retried)

### Creating a Post

1. Click **New Post** or navigate to `/posts/new`
2. Write your content in the editor
3. Select target platforms (Facebook, LinkedIn, etc.)
4. Optionally customize content per platform
5. Add media (images, videos)
6. Set schedule date/time or publish immediately
7. Click **Schedule** or **Publish Now**

### Bulk Import

Import multiple posts at once:

- **CSV Upload**: Upload a CSV file with columns for content, platform, schedule time
- **Format**: `content, platform, scheduled_at, media_url`

---

## Scheduling & Automation

### Cron Jobs

CtxPost runs four automated background jobs:

| Job | Interval | Endpoint | Purpose |
|-----|----------|----------|---------|
| **Publish Posts** | Every minute | `/api/cron/publish-posts` | Publish scheduled posts |
| **Fetch Analytics** | Every 6 hours | `/api/cron/fetch-analytics` | Update engagement metrics |
| **Recycle Evergreen** | Daily | `/api/cron/recycle-evergreen` | Republish evergreen content |
| **RSS Auto-Post** | Hourly | `/api/cron/rss-auto-post` | Create posts from RSS feeds |

All cron endpoints are protected with `CRON_SECRET`.

### AI-Powered Scheduling

Let AI suggest the best posting times:

1. Go to post editor
2. Click **Suggest Best Time**
3. AI analyzes your past engagement data
4. Recommends optimal times per platform

### Evergreen Content

Mark posts as "evergreen" to automatically recycle them:

- Set recycle interval (weekly, monthly, quarterly)
- AI refreshes the copy to avoid repetition
- Engagement metrics are tracked per recycle

---

## Analytics

### Dashboard Metrics

- **Engagement Rate**: Likes + comments + shares / impressions
- **Reach**: Total unique viewers
- **Clicks**: Link clicks from posts
- **Best Performing**: Top posts by engagement
- **Platform Comparison**: Side-by-side platform performance
- **Posting Heatmap**: Best days/times visualization

### Per-Post Analytics

Each published post tracks:

- Likes, comments, shares, saves
- Impressions and reach
- Link clicks (via short links)
- Engagement rate calculation
- Platform-specific metrics

### Content Performance

AI-powered content analysis:

- **Topic Performance**: Which categories perform best
- **Optimal Length**: Best-performing post lengths
- **Media Impact**: Posts with vs. without images
- **Hashtag Effectiveness**: Which hashtags drive engagement

---

## Team Collaboration

### Roles

| Role | Permissions |
|------|------------|
| **Owner** | Full access, manage team, delete account |
| **Admin** | All features, manage team members |
| **Editor** | Create, edit, schedule posts |
| **Reviewer** | Approve/reject pending posts |
| **Viewer** | Read-only access to dashboard and analytics |

### Approval Workflow

1. Editor creates a post and submits for review
2. Reviewer receives notification in **Inbox**
3. Reviewer can **Approve** or **Request Changes**
4. Approved posts move to **Scheduled** status
5. Full audit trail of all approvals

### Setting Up Teams

1. Go to **Team** in the sidebar
2. Click **Invite Member**
3. Enter email and select role
4. Member receives invitation

---

## Media Management

### Media Library

Central hub for all your visual assets:

- **Upload**: Drag-and-drop images (JPG, PNG, GIF, WebP)
- **Organize**: Tag and categorize assets
- **Search**: Find images by filename, tag, or date
- **Preview**: Quick preview before attaching to posts
- **AI Images**: Generated images are automatically saved

### Supported Formats

| Type | Formats | Max Size |
|------|---------|----------|
| Images | JPG, PNG, GIF, WebP, SVG | 10 MB |
| Video | MP4, MOV | 50 MB |

---

## Short Links & UTM Tracking

### Built-in URL Shortener

Create trackable short links for your posts:

1. Go to **Links** in the sidebar
2. Enter the destination URL
3. Optionally add UTM parameters
4. Get a short link: `yourdomain.com/s/abc123`

### UTM Parameters

Auto-generate UTM tags for each platform:

- `utm_source`: facebook, linkedin, twitter, etc.
- `utm_medium`: social
- `utm_campaign`: Your campaign name
- `utm_content`: Post identifier

### Click Analytics

Track per-link:

- Total clicks
- Clicks per day/week/month
- Referrer breakdown
- Geographic data (if available)

---

## GDPR & Privacy

CtxPost is designed for full EU GDPR compliance.

### Implemented Articles

| Article | Requirement | Implementation |
|---------|-------------|----------------|
| Art. 5 | Data Minimization | Only necessary data collected |
| Art. 6 | Lawfulness | Consent + legitimate interest documented |
| Art. 7 | Consent | Checkbox at registration with version tracking |
| Art. 12 | Transparency | Complete privacy policy in 5 languages |
| Art. 13/14 | Information | All mandatory disclosures present |
| Art. 15 | Right of Access | `/api/user/export` - full JSON data export |
| Art. 17 | Right to Erasure | `/api/user/delete` - cascading deletion |
| Art. 20 | Data Portability | Machine-readable JSON export |
| Art. 25 | Privacy by Design | Local AI, encrypted tokens |
| Art. 30 | Records of Processing | Audit logging for all actions |
| Art. 32 | Security | AES-256-GCM, bcrypt, HTTPS, CSP, HSTS |
| Art. 77 | Right to Complain | Supervisory authority referenced |

### Consent Management

- Users must accept privacy policy + terms at registration
- Consent is logged with timestamp, IP, user agent, and policy version
- Users can view and withdraw consent in **Settings > Privacy**

### Data Export

Users can export all their data as JSON:

1. Go to **Settings > Privacy**
2. Click **Export My Data**
3. Download includes: profile, posts, analytics, accounts, media, consent logs, audit logs

### Account Deletion

Complete account deletion with cascade:

1. Go to **Settings > Privacy**
2. Click **Delete My Account**
3. Type "DELETE" to confirm
4. All data is permanently removed including:
   - User profile
   - All posts and analytics
   - Social account connections
   - Uploaded media files
   - Consent and audit logs

### Audit Logging

All security-relevant actions are logged:

- Login / Logout
- Registration
- Data Export
- Account Deletion
- Password Change
- Social Account Connect/Disconnect
- Settings Changes
- Consent Changes

---

## Security

### Encryption

| Data | Method | Details |
|------|--------|---------|
| OAuth Tokens | AES-256-GCM | Random IV, authenticated encryption |
| Passwords | bcrypt | 12 salt rounds |
| Transport | TLS 1.3 | End-to-end HTTPS |

### Security Headers

| Header | Value |
|--------|-------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| X-XSS-Protection | `1; mode=block` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| Content-Security-Policy | Strict CSP with `frame-ancestors 'none'` |

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Auth (login/register) | 10 requests/minute |
| AI Generation | 20 requests/minute |
| File Upload | 10 requests/minute |
| General API | 60 requests/minute |

### Session Security

- JWT strategy with 24-hour expiry
- `HttpOnly`, `Secure`, `SameSite=Lax` cookie flags
- `__Host-` and `__Secure-` cookie prefixes
- CSRF protection via state parameter on OAuth flows

---

## API Reference

### AI Endpoints

```
POST /api/ai/generate-text    # Generate post copy
POST /api/ai/generate-image   # Generate images
POST /api/ai/hashtags          # Suggest hashtags
POST /api/ai/ideas             # Content ideas
POST /api/ai/best-times        # Optimal posting times
POST /api/ai/sentiment         # Sentiment analysis
POST /api/ai/content-suggestions  # Trend-based ideas
GET  /api/ai/models            # List Ollama models
POST /api/ai/models/pull       # Download new model
DELETE /api/ai/models/delete   # Remove model
```

### Social Media Endpoints

```
GET  /api/social/{platform}/authorize  # Start OAuth flow
GET  /api/social/{platform}/callback   # OAuth callback
POST /api/social/test-publish          # Test post
```

Platforms: `facebook`, `instagram`, `linkedin`, `twitter`, `threads`

### Post & Scheduling Endpoints

```
GET  /api/posts/upcoming              # Get scheduled posts
POST /api/scheduling/suggest-time     # AI timing suggestion
```

### Cron Endpoints (Protected)

```
POST /api/cron/publish-posts     # Publish due posts
POST /api/cron/fetch-analytics   # Update metrics
POST /api/cron/recycle-evergreen # Recycle content
POST /api/cron/rss-auto-post     # RSS auto-posting
```

All cron endpoints require `Authorization: Bearer {CRON_SECRET}`.

### GDPR Endpoints

```
GET    /api/user/export   # Download all user data (JSON)
DELETE /api/user/delete    # Delete account (requires confirmation)
```

### File Endpoints

```
POST /api/upload                    # Upload media
GET  /api/uploads/{filename}        # Serve uploaded file
GET  /api/generated-images/{filename}  # Serve AI image
```

### Short Links

```
GET /api/s/{code}   # Redirect + track click
```

---

## Deployment

### Option A: PM2 (Recommended for VPS)

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Set up nginx reverse proxy
# See deploy.sh for full configuration
```

### Option B: Docker Compose

```bash
cp .env.example .env
# Edit .env with production values

docker compose up -d
```

### Option C: Cloudflare Tunnel (Home Server)

```bash
# Install cloudflared
# See setup-tunnel.sh for configuration

# Creates HTTPS tunnel without opening ports
cloudflared tunnel run ctxpost
```

### Production Checklist

- [ ] Generate unique secrets (`AUTH_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`)
- [ ] Set `AUTH_URL` and `NEXTAUTH_URL` to production domain
- [ ] Enable HTTPS (Cloudflare Tunnel, certbot, or nginx)
- [ ] Update CSP domains in `next.config.ts`
- [ ] Configure social platform redirect URIs
- [ ] Set up cron jobs for automated publishing
- [ ] Enable database backups
- [ ] Review rate limiting settings

---

## Database Schema

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | name, email, password, timezone, AI prefs |
| `Account` | OAuth accounts | provider, access/refresh tokens |
| `Session` | Active sessions | sessionToken, expires |
| `SocialAccount` | Connected platforms | platform, tokens (encrypted), profile |
| `Post` | Social media posts | content, status, scheduledAt, platforms |
| `PostTarget` | Per-platform status | platform, publishedId, error |
| `PostAnalytics` | Engagement metrics | likes, shares, comments, impressions |
| `ContentCategory` | Post organization | name, color, description |
| `ContentVariation` | A/B test variants | content, platform, performance |
| `MediaAsset` | Uploaded files | url, type, size, tags |
| `AIInsight` | AI analysis results | type, data, model used |
| `AIFeedback` | Model training data | rating, feedback text |
| `BrandStyleGuide` | Brand voice config | tone, voice, keywords, emoji rules |
| `ShortLink` | URL shortener | code, url, clicks, UTM params |
| `Team` | Team workspace | name, owner |
| `TeamMember` | Team membership | role (Owner/Admin/Editor/Reviewer/Viewer) |
| `AppConfig` | API credentials | encrypted platform keys |
| `ConsentLog` | GDPR consent | type, action, version, IP, timestamp |
| `AuditLog` | Security log | action, details, IP, timestamp |

### Relationships

```
User
├── SocialAccount[] (1:N - connected platforms)
├── Post[] (1:N - created posts)
│   ├── PostTarget[] (1:N - per-platform targets)
│   ├── PostAnalytics[] (1:N - engagement data)
│   └── ContentVariation[] (1:N - A/B variants)
├── ContentCategory[] (1:N - post categories)
├── MediaAsset[] (1:N - uploaded media)
├── AIInsight[] (1:N - AI results)
├── AIFeedback[] (1:N - training data)
├── BrandStyleGuide (1:1 - brand config)
├── ShortLink[] (1:N - short URLs)
├── AppConfig (1:1 - API credentials)
├── ConsentLog[] (1:N - GDPR consent)
├── AuditLog[] (1:N - security log)
└── TeamMember[] (1:N - team memberships)
```

---

## Internationalization

### Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `en` | English | Complete |
| `de` | German | Complete |
| `fr` | French | Complete |
| `es` | Spanish | Complete |
| `pt` | Portuguese | Complete |

### Adding a New Language

1. Create `messages/{code}.json` (copy from `en.json`)
2. Translate all strings
3. Add locale to `src/i18n/routing.ts`
4. Add locale to `next.config.ts`

---

## Troubleshooting

### Common Issues

#### "Database connection refused"
```bash
# Ensure PostgreSQL is running
sudo systemctl start postgresql
# Or with Docker
docker compose up -d db
```

#### "Ollama not responding"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

#### "OAuth callback error"
- Verify redirect URIs match exactly (including protocol and trailing slash)
- Ensure `AUTH_URL` matches your actual domain
- Check that API credentials are correct

#### "Encryption key error"
```bash
# Regenerate encryption key (WARNING: existing tokens become unreadable)
openssl rand -hex 32
```

#### "Build fails with TypeScript errors"
```bash
# Clean and rebuild
rm -rf .next
npx prisma generate
npm run build
```

### Logs

```bash
# PM2 logs
pm2 logs ctxpost

# Docker logs
docker compose logs -f app

# nginx logs
tail -f /var/log/nginx/error.log
```

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

### Development Setup

```bash
npm run dev         # Start dev server (hot reload)
npx prisma studio   # Open database GUI
npm run lint        # Run ESLint
npm run build       # Production build
```

---

## License

MIT License - See [LICENSE](LICENSE) for details.
