# CtxPost — Operator Setup Guide

So konfigurierst du CtxPost als Server-Betreiber. Danach können Nutzer ihre sozialen Profile mit **einem Klick** verbinden — ganz wie bei Hootsuite, ohne API-Keys einzugeben.

---

## Konzept

CtxPost läuft wie Hootsuite: Du registrierst **einmalig eine App** bei jeder Plattform (Meta, Twitter/X, LinkedIn) und trägst die Credentials in die `.env`-Datei ein. Danach erscheint auf der Accounts-Seite nur noch der **Verbinden**-Button — kein API-Key-Dialog für die Nutzer.

---

## Schritt 1: Umgebungsvariablen vorbereiten

Kopiere `.env.example` zu `.env` und befülle die folgenden Variablen:

```bash
cp .env.example .env
```

---

## Schritt 2: Facebook, Instagram & Threads

> Instagram und Threads nutzen **dieselbe Meta-App** wie Facebook.

1. Gehe zu [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. **App erstellen** → Typ: **Business** → Anwendungsfall: _Verbinde deine Business-Applikation_
3. **Settings → Basic**: App ID und App Secret kopieren
4. **Produkte aktivieren**:
   - Facebook Login
   - Facebook Pages API
   - Instagram Basic Display (für Instagram-Verbindung)
   - Threads API (für Threads-Verbindung)
5. **Gültige OAuth-Redirect-URIs** setzen:
   - `https://DEINE-DOMAIN/api/social/facebook/callback`
   - `https://DEINE-DOMAIN/api/social/instagram/callback`
   - `https://DEINE-DOMAIN/api/social/threads/callback`

**In `.env` eintragen:**

```env
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_REDIRECT_URI=https://DEINE-DOMAIN/api/social/facebook/callback

# Instagram nutzt Facebook App Credentials:
INSTAGRAM_REDIRECT_URI=https://DEINE-DOMAIN/api/social/instagram/callback

# Threads nutzt Facebook App Credentials:
THREADS_APP_ID=123456789012345
THREADS_APP_SECRET=abcdef1234567890abcdef1234567890
THREADS_REDIRECT_URI=https://DEINE-DOMAIN/api/social/threads/callback
```

---

## Schritt 3: X / Twitter

1. Gehe zu [developer.x.com/en/portal/dashboard](https://developer.x.com/en/portal/dashboard)
2. **Developer-Account** erstellen (kostenpflichtiges Basic-Abo erforderlich)
3. **App erstellen** → App Settings → **OAuth 2.0** aktivieren
4. **App permissions**: Read + Write
5. **Type of App**: Web App, Automated App or Bot
6. **Callback URI / Redirect URL**:
   - `https://DEINE-DOMAIN/api/social/twitter/callback`
7. **Keys and Tokens** → OAuth 2.0 Client ID und Client Secret kopieren

**In `.env` eintragen:**

```env
TWITTER_CLIENT_ID=xyz123abc456
TWITTER_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12
TWITTER_REDIRECT_URI=https://DEINE-DOMAIN/api/social/twitter/callback
```

---

## Schritt 4: LinkedIn

1. Gehe zu [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps)
2. **App erstellen** → LinkedIn-Unternehmensseite als Eigentümer angeben
3. **Auth Tab**: Client ID und Client Secret kopieren
4. **Authorized Redirect URLs**:
   - `https://DEINE-DOMAIN/api/social/linkedin/callback`
5. **Products Tab**: Folgende Produkte anfordern (teils sofortige Freigabe):
   - Share on LinkedIn
   - Sign In with LinkedIn using OpenID Connect

**In `.env` eintragen:**

```env
LINKEDIN_CLIENT_ID=abcdef123456
LINKEDIN_CLIENT_SECRET=abcdefGHIJKL1234
LINKEDIN_REDIRECT_URI=https://DEINE-DOMAIN/api/social/linkedin/callback
```

---

## Schritt 5: KI-Modell (optional)

### Option A: Anthropic Claude (Cloud)

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

API-Key erstellen unter [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

### Option B: Ollama (lokal, kostenlos)

Kein API-Key nötig. Einfach die Ollama-URL in den KI-Einstellungen konfigurieren:

```env
# Optional: Standardmäßig http://localhost:11434
OLLAMA_BASE_URL=http://192.168.178.169:11434
```

---

## Schritt 6: Auth & Datenbank

```env
# Basis-URL (NEXTAUTH_URL)
AUTH_URL=https://DEINE-DOMAIN
NEXTAUTH_URL=https://DEINE-DOMAIN

# Secret (zufälliger langer String)
AUTH_SECRET=ZUFAELLIGERSTRING_openssl_rand_hex_32

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/ctxpost

# Verschlüsselung für OAuth-Tokens in der DB
ENCRYPTION_KEY=ZUFAELLIGERSTRING_openssl_rand_hex_32
```

Secret und Encryption Key generieren:

```bash
openssl rand -hex 32  # für AUTH_SECRET
openssl rand -hex 32  # für ENCRYPTION_KEY
```

---

## Vollständige `.env.example`

```env
# ─── Auth ───────────────────────────────────────
AUTH_URL=https://DEINE-DOMAIN
NEXTAUTH_URL=https://DEINE-DOMAIN
AUTH_SECRET=

# ─── Datenbank ──────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/ctxpost
ENCRYPTION_KEY=

# ─── Facebook / Instagram / Threads ─────────────
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=https://DEINE-DOMAIN/api/social/facebook/callback
INSTAGRAM_REDIRECT_URI=https://DEINE-DOMAIN/api/social/instagram/callback
THREADS_APP_ID=
THREADS_APP_SECRET=
THREADS_REDIRECT_URI=https://DEINE-DOMAIN/api/social/threads/callback

# ─── Twitter / X ────────────────────────────────
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=https://DEINE-DOMAIN/api/social/twitter/callback

# ─── LinkedIn ───────────────────────────────────
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://DEINE-DOMAIN/api/social/linkedin/callback

# ─── KI (optional) ──────────────────────────────
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Verifikation

Sobald alle Credentials gesetzt sind, zeigt die **Settings-Seite** unter "Platform Credentials" für jede Plattform ein grünes `✓ .env`-Badge.

Auf der **Accounts-Seite** erscheint dann für jede Plattform ein einfacher **Verbinden**-Button — genau wie bei Hootsuite:

1. Klick auf "Facebook verbinden"
2. → Weiterleitung zu Facebook Login
3. → Account autorisieren
4. → Zurück zu CtxPost, Account erscheint als verbunden ✓

---

## Deployment (PM2)

```bash
# Build
npm run build

# Start
pm2 start npm --name ctxpost -- start -- -p 3002

# Neustart nach .env-Änderung
pm2 restart ctxpost

# Logs
pm2 logs ctxpost --lines 50
```

---

*CtxPost v2 — Powered by Context-X*
