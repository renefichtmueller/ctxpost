# CtxPost - Social Media Scheduler

A self-hosted, GDPR-compliant social media scheduling platform with local AI features. Manage and schedule posts across multiple social networks from a single dashboard.

## Features

- **Multi-Platform Publishing** - Facebook, Instagram, LinkedIn, Twitter/X, Threads
- **AI-Powered Content** - Generate captions, hashtags, images, and get posting-time suggestions using local AI (Ollama) or Claude
- **Post Scheduling** - Calendar-based scheduling with timezone support
- **Analytics Dashboard** - Track engagement metrics across all platforms
- **Media Management** - Upload, manage, and attach images to posts
- **Short Links** - Built-in link shortener with click tracking
- **Brand Style Guide** - Define your brand voice for consistent AI-generated content
- **Team Collaboration** - Multi-user support with role-based access
- **GDPR Compliant** - Consent tracking, data export, account deletion, audit logging
- **Privacy-First** - Local AI processing, no external data sharing for AI features
- **Multi-Language** - Full i18n support (English, German, French, Spanish, Portuguese)

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (OAuth 2.0 + Credentials)
- **AI:** Ollama (local) / Anthropic Claude (optional)
- **Styling:** Tailwind CSS + shadcn/ui
- **Encryption:** AES-256-GCM (tokens) + bcrypt (passwords)

## Prerequisites

- **Node.js** 18.x or later
- **PostgreSQL** 14 or later
- **Ollama** (optional, for local AI features) - [Install Ollama](https://ollama.ai)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ctxpost.git
cd ctxpost
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set the required values:

```bash
# Required - Generate these secrets:
openssl rand -base64 32  # For AUTH_SECRET
openssl rand -hex 32     # For ENCRYPTION_KEY
openssl rand -hex 32     # For CRON_SECRET

# Required - Your PostgreSQL connection:
DATABASE_URL="postgresql://user:password@localhost:5432/social_scheduler"
```

### 4. Set up the database

```bash
# Create the database
createdb social_scheduler

# Push the schema
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create your first account.

### 6. (Optional) Set up Ollama for AI features

```bash
# Install a model (recommended: llama3.2 or mistral)
ollama pull llama3.2

# Ollama runs on http://localhost:11434 by default
```

## Social Media Platform Setup

To connect social platforms, you need API credentials from each provider:

| Platform | Developer Portal | Callback URL |
|----------|-----------------|--------------|
| Facebook | [developers.facebook.com](https://developers.facebook.com/apps) | `{YOUR_URL}/api/social/facebook/callback` |
| Instagram | Uses Facebook App credentials | `{YOUR_URL}/api/social/instagram/callback` |
| LinkedIn | [linkedin.com/developers](https://www.linkedin.com/developers/apps) | `{YOUR_URL}/api/social/linkedin/callback` |
| Twitter/X | [developer.twitter.com](https://developer.twitter.com/en/portal) | `{YOUR_URL}/api/social/twitter/callback` |
| Threads | Uses Meta developer credentials | `{YOUR_URL}/api/social/threads/callback` |

You can configure these either in `.env` or through the in-app Settings > API Credentials page.

## Production Deployment

### Option A: Self-hosted with PM2

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Set up nginx reverse proxy (see deploy.sh for reference)
```

### Option B: Docker

```bash
# Copy and configure the environment
cp .env.example .env
# Edit .env with production values

# Start with Docker Compose
docker compose up -d
```

### Option C: Cloudflare Tunnel (recommended for home servers)

```bash
# See setup-tunnel.sh for Cloudflare Tunnel configuration
# This provides HTTPS without opening ports
```

### Important for Production

1. Generate strong, unique secrets for `AUTH_SECRET`, `ENCRYPTION_KEY`, and `CRON_SECRET`
2. Set `AUTH_URL` and `NEXTAUTH_URL` to your production domain
3. Update redirect URIs in all social platform developer consoles
4. Update the domain in `next.config.ts` CSP headers
5. Enable HTTPS (via Cloudflare Tunnel, nginx + certbot, or similar)

## Security Features

- **AES-256-GCM** encryption for all stored OAuth tokens
- **bcrypt** password hashing (12 rounds)
- **CSRF protection** with state parameter validation on OAuth flows
- **Rate limiting** on auth, AI, and upload endpoints
- **Security headers** (HSTS, CSP, X-Frame-Options, etc.)
- **No tracking cookies** - only essential session cookies

## GDPR / Privacy

This application is designed for GDPR compliance:

- **Art. 7** - Provable consent with version tracking at registration
- **Art. 15/20** - Full data export via `/api/user/export`
- **Art. 17** - Complete account deletion via `/api/user/delete`
- **Art. 25** - Privacy by Design (local AI, encrypted tokens)
- **Art. 30** - Audit logging for all security-relevant actions
- **Cookie Consent** - ePrivacy-compliant information banner
- **Privacy Policy** - Complete GDPR-compliant policy in 5 languages

## Project Structure

```
src/
  actions/        # Server actions (auth, posts, AI, etc.)
  app/
    (auth)/       # Login, register pages
    (dashboard)/  # Main app pages
    api/          # API routes (AI, social, uploads, GDPR)
  components/     # React components (UI, forms, settings)
  lib/            # Utilities (crypto, audit, rate-limit, prisma)
prisma/
  schema.prisma   # Database schema
messages/         # i18n translations (de, en, fr, es, pt)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth encryption key |
| `ENCRYPTION_KEY` | Yes | AES-256 key for token encryption |
| `CRON_SECRET` | Yes | Secret for cron job endpoints |
| `AUTH_URL` | Yes | Your app URL |
| `OLLAMA_URL` | No | Ollama API URL (default: http://localhost:11434) |
| `ANTHROPIC_API_KEY` | No | Claude API key (alternative to Ollama) |
| `FACEBOOK_APP_ID` | No | Facebook developer app ID |
| `LINKEDIN_CLIENT_ID` | No | LinkedIn developer client ID |
| `TWITTER_CLIENT_ID` | No | Twitter developer client ID |
| `THREADS_APP_ID` | No | Threads/Meta developer app ID |

See `.env.example` for the complete list with all social platform credentials.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
