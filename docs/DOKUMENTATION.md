# CtxPost Dokumentation

> **Version 2.0** | Selbstgehosteter, DSGVO-konformer Social-Media-Scheduler mit lokaler KI

---

## Inhaltsverzeichnis

1. [Ueberblick](#ueberblick)
2. [Architektur](#architektur)
3. [Installation](#installation)
4. [Konfiguration](#konfiguration)
5. [Features](#features)
6. [Social-Media-Plattformen](#social-media-plattformen)
7. [KI-Features](#ki-features)
8. [Post-Verwaltung](#post-verwaltung)
9. [Planung & Automatisierung](#planung--automatisierung)
10. [Analytics](#analytics)
11. [Team-Zusammenarbeit](#team-zusammenarbeit)
12. [Medienverwaltung](#medienverwaltung)
13. [Short Links & UTM-Tracking](#short-links--utm-tracking)
14. [DSGVO & Datenschutz](#dsgvo--datenschutz)
15. [Sicherheit](#sicherheit)
16. [API-Referenz](#api-referenz)
17. [Deployment](#deployment)
18. [Datenbank-Schema](#datenbank-schema)
19. [Mehrsprachigkeit](#mehrsprachigkeit)
20. [Fehlerbehebung](#fehlerbehebung)

---

## Ueberblick

CtxPost ist eine vollstaendig selbstgehostete Social-Media-Management-Plattform. Erstelle, plane und veroeffentliche Beitraege auf fuenf grossen Plattformen - alles aus einem einzigen Dashboard. Das Besondere an CtxPost: die **lokale KI-Integration** mit Ollama. Alle KI-Funktionen laufen auf deiner eigenen Hardware - das bedeutet keine API-Kosten und vollstaendiger Datenschutz.

### Highlights

- **5 Plattformen**: Facebook, Instagram, LinkedIn, Twitter/X, Threads
- **15+ KI-Modelle**: Lokale Inferenz ueber Ollama (Mistral, Llama 3, Gemma, Qwen, Phi-3, etc.)
- **0 EUR KI-Kosten**: Lokale Verarbeitung ohne Abrechnung pro Anfrage
- **100% Open Source**: MIT-Lizenz
- **DSGVO-konform**: Einwilligungsverfolgung, Datenexport, Kontoloeschung, Audit-Logging
- **5 Sprachen**: Deutsch, Englisch, Franzoesisch, Spanisch, Portugiesisch

---

## Architektur

### Tech-Stack

| Schicht | Technologie |
|---------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | Next.js API-Routes, Server Actions |
| **Datenbank** | PostgreSQL 14+ mit Prisma ORM |
| **Authentifizierung** | NextAuth.js v5 (OAuth 2.0 + Credentials) |
| **KI** | Ollama (lokal) / Anthropic Claude (optionaler Cloud-Fallback) |
| **Verschluesselung** | AES-256-GCM (Tokens), bcrypt (Passwoerter), TLS 1.3 |
| **Prozessmanager** | PM2 / Docker |
| **Reverse Proxy** | nginx / Cloudflare Tunnel |

### Projektstruktur

```
ctxpost/
├── prisma/
│   └── schema.prisma          # Datenbankschema (23+ Modelle)
├── messages/                   # i18n-Uebersetzungen
│   ├── de.json                # Deutsch
│   ├── en.json                # Englisch
│   ├── fr.json                # Franzoesisch
│   ├── es.json                # Spanisch
│   └── pt.json                # Portugiesisch
├── src/
│   ├── actions/               # Server Actions (Geschaeftslogik)
│   ├── app/
│   │   ├── (auth)/            # Login & Registrierung
│   │   ├── (dashboard)/       # Hauptanwendung
│   │   │   ├── dashboard/     # Uebersicht
│   │   │   ├── posts/         # Beitragsliste, Erstellen, Bearbeiten
│   │   │   ├── calendar/      # Kalenderansicht
│   │   │   ├── analytics/     # Metriken-Dashboard
│   │   │   ├── accounts/      # Soziale Konten
│   │   │   ├── library/       # Medienbibliothek
│   │   │   ├── links/         # Kurzlinks
│   │   │   ├── team/          # Teammitglieder
│   │   │   ├── settings/      # Einstellungen
│   │   │   ├── ai-models/     # Ollama-Modellverwaltung
│   │   │   ├── ai-insights/   # KI-Analysen
│   │   │   ├── ideas/         # Content-Ideenfindung
│   │   │   ├── queue/         # Veroeffentlichungswarteschlange
│   │   │   ├── inbox/         # Benachrichtigungen
│   │   │   └── llm-learning/  # KI-Feedback
│   │   ├── api/               # API-Endpunkte
│   │   ├── privacy/           # Datenschutzerklaerung
│   │   └── terms/             # AGB
│   ├── components/            # React-Komponenten
│   └── lib/                   # Hilfsbibliotheken
│       ├── ai/                # KI-Abstraktionsschicht
│       ├── social/            # Plattform-API-Clients
│       ├── crypto.ts          # AES-256-GCM-Verschluesselung
│       ├── audit.ts           # Audit-Logging
│       ├── rate-limit.ts      # Ratenbegrenzung
│       └── permissions.ts     # Rollenbasierte Zugriffskontrolle
├── docker-compose.yml         # Multi-Container-Setup
├── deploy.sh                  # PM2-Deployment
└── .env.example               # Umgebungsvariablen-Vorlage
```

---

## Installation

### Voraussetzungen

| Anforderung | Version | Zweck |
|------------|---------|-------|
| Node.js | 18.x+ | Laufzeitumgebung |
| PostgreSQL | 14+ | Datenbank |
| Ollama | Aktuell | Lokale KI (optional) |
| npm/pnpm | Aktuell | Paketmanager |

### Schnellstart (Entwicklung)

```bash
# 1. Repository klonen
git clone https://github.com/yourusername/ctxpost.git
cd ctxpost

# 2. Abhaengigkeiten installieren
npm install

# 3. Umgebung konfigurieren
cp .env.example .env

# 4. Erforderliche Secrets generieren
openssl rand -base64 32  # Fuer AUTH_SECRET
openssl rand -hex 32     # Fuer ENCRYPTION_KEY
openssl rand -hex 32     # Fuer CRON_SECRET

# 5. Datenbank einrichten
createdb social_scheduler
npx prisma db push
npx prisma generate

# 6. Entwicklungsserver starten
npm run dev
```

Oeffne [http://localhost:3000](http://localhost:3000) und erstelle dein erstes Konto.

### Docker-Installation

```bash
# 1. Klonen und konfigurieren
git clone https://github.com/yourusername/ctxpost.git
cd ctxpost
cp .env.example .env
# .env mit Produktionswerten bearbeiten

# 2. Alle Dienste starten
docker compose up -d

# Gestartete Dienste:
# - PostgreSQL (Port 5432)
# - CtxPost App (Port 3000)
# - nginx Reverse Proxy (Port 80)
# - Cron Scheduler (Hintergrund)
```

### Ollama einrichten (Lokale KI)

```bash
# Ollama installieren (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Empfohlene Modelle herunterladen
ollama pull llama3.2          # Allgemeiner Text (4,7 GB)
ollama pull mistral           # Schnelles kreatives Schreiben (4,1 GB)
ollama pull gemma2            # Googles Modell (5,4 GB)

# Pruefen ob Ollama laeuft
curl http://localhost:11434/api/tags
```

---

## Konfiguration

### Umgebungsvariablen

#### Erforderlich

| Variable | Beschreibung | Generierung |
|----------|-------------|-------------|
| `DATABASE_URL` | PostgreSQL-Verbindungsstring | `postgresql://user:pass@host:5432/dbname` |
| `AUTH_SECRET` | NextAuth-Verschluesselungsschluessel | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | AES-256-Schluessel fuer Token-Verschluesselung | `openssl rand -hex 32` |
| `CRON_SECRET` | Secret fuer Cron-Job-Endpunkte | `openssl rand -hex 32` |
| `AUTH_URL` | Deine Anwendungs-URL | `http://localhost:3000` |

#### Optional - KI

| Variable | Beschreibung | Standard |
|----------|-------------|---------|
| `OLLAMA_URL` | Ollama-API-Endpunkt | `http://localhost:11434` |
| `ANTHROPIC_API_KEY` | Claude-API-Schluessel (Cloud-Fallback) | Leer |

#### Optional - Soziale Plattformen

| Plattform | Benoetigte Variablen |
|-----------|---------------------|
| Facebook | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |
| Instagram | Nutzt Facebook-Credentials + `INSTAGRAM_REDIRECT_URI` |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Twitter/X | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` |
| Threads | `THREADS_APP_ID`, `THREADS_APP_SECRET` |

Alle Redirect-URIs folgen dem Muster: `{DEINE_URL}/api/social/{plattform}/callback`

---

## Features

### Dashboard

Das Haupt-Dashboard bietet einen Ueberblick auf einen Blick:

- **Bevorstehende Beitraege**: Naechste geplante Posts mit Countdown
- **Letzte Aktivitaet**: Zuletzt veroeffentlichte Beitraege mit Status
- **Schnellstatistiken**: Gesamte Posts, verbundene Konten, Engagement
- **KI-Einblicke**: Content-Vorschlaege und Trendthemen

### Post-Editor

Effizientes Erstellen von Beitraegen:

- **Rich-Text-Editor**: Einmal schreiben, pro Plattform anpassen
- **Plattform-Vorschau**: Sieh wie dein Post auf jeder Plattform aussieht
- **KI-Toolbar**: Ein-Klick-Zugriff auf Textgenerierung, Hashtags, Bildererstellung
- **Medien-Upload**: Drag-and-Drop fuer Bilder, Videos und Dokumente
- **Kategorie-Tags**: Beitraege nach Thema/Kampagne organisieren
- **A/B-Varianten**: Content-Variationen zum Testen erstellen

### Kalenderansicht

Visuelle Planung mit Drag-and-Drop:

- **Monats-/Wochen-/Tagesansicht**
- **Drag zum Umplanen**: Posts zwischen Zeitfenstern verschieben
- **Farbcodiert** nach Plattform und Status
- **Zeitzonenbewusst**: Zeigt Zeiten in deiner lokalen Zeitzone

---

## Social-Media-Plattformen

### Unterstuetzte Plattformen

| Plattform | Text | Bilder | Video | Planung | Analytics |
|-----------|------|--------|-------|---------|-----------|
| Facebook | Ja | Ja | Ja | Ja | Ja |
| Instagram | Ja | Ja | Ja | Ja | Ja |
| LinkedIn | Ja | Ja | - | Ja | Ja |
| Twitter/X | Ja | Ja | - | Ja | Ja |
| Threads | Ja | Ja | - | Ja | Ja |

### Plattformen verbinden

1. Navigiere zu **Einstellungen > API-Zugangsdaten**
2. Gib deine Developer-App-Zugangsdaten fuer jede Plattform ein
3. Gehe zu **Konten** und klicke **Verbinden** fuer jede Plattform
4. Schliesse den OAuth-Autorisierungsfluss ab

---

## KI-Features

### KI-Anbieter

CtxPost unterstuetzt zwei KI-Backends:

#### Ollama (Empfohlen - Lokal)
- **Kosten**: 0 EUR (laeuft auf deiner Hardware)
- **Datenschutz**: Alle Daten bleiben auf deinem Rechner
- **Modelle**: 15+ Open-Source-Modelle
- **Setup**: Ollama installieren + Modelle herunterladen

#### Anthropic Claude (Optional - Cloud)
- **Kosten**: Pay-per-Token-Preismodell
- **Qualitaet**: Modernste Sprachmodellqualitaet
- **Setup**: `ANTHROPIC_API_KEY` in `.env` hinzufuegen

### KI-Funktionen

| Feature | Beschreibung | Bestes Modell |
|---------|-------------|---------------|
| **Textgenerierung** | Post-Texte aus Prompts generieren | Mistral / Llama 3 |
| **Hashtag-Vorschlaege** | Plattformoptimierte Hashtag-Sets | Gemma 2 |
| **Beste Posting-Zeiten** | Engagement analysieren fuer optimale Planung | Llama 3 |
| **Content-Ideen** | Inhaltsideen basierend auf Trends generieren | Mistral |
| **Bildgenerierung** | Bilder ueber ComfyUI/Stable Diffusion erstellen | SDXL |
| **Sentiment-Analyse** | Tonalitaet vor Veroeffentlichung pruefen | Gemma 2 |
| **Content-Varianten** | A/B-Test verschiedener Textversionen | Mistral |

### Marken-Styleguide

Definiere deine Markenstimme fuer konsistenten KI-generierten Content:

- **Tonalitaet**: Professionell, locker, humorvoll, inspirierend
- **Stimme**: Erste Person, dritte Person, Markenname
- **Schluesselwoerter**: Pflicht-Begriffe und Vermeidungsliste
- **Emoji-Stil**: Viel, moderat, keine
- **Hashtag-Regeln**: Maximale Anzahl, bevorzugte Tags

Konfiguriere unter **Einstellungen > Marken-Stil**.

### Modell-Verwaltung

Ollama-Modelle direkt aus dem Dashboard verwalten:

- **Durchsuchen**: Alle verfuegbaren Ollama-Modelle anzeigen
- **Herunterladen**: Neue Modelle mit Fortschrittsanzeige laden
- **Loeschen**: Ungenutzte Modelle entfernen
- **Wechseln**: Standardmodell pro KI-Feature aendern

---

## Post-Verwaltung

### Post-Lebenszyklus

```
ENTWURF --> PRUEFUNG --> GEPLANT --> VEROEFFENTLICHUNG --> VEROEFFENTLICHT
                                                      \--> FEHLGESCHLAGEN
```

1. **Entwurf**: Beitrag erstellen und bearbeiten
2. **Pruefung**: Zur Team-Genehmigung einreichen
3. **Geplant**: Genehmigt und wartet auf geplante Zeit
4. **Veroeffentlichung**: Wird an Plattformen gesendet
5. **Veroeffentlicht**: Erfolgreich gepostet
6. **Fehlgeschlagen**: Fehler beim Veroeffentlichen (kann wiederholt werden)

---

## Planung & Automatisierung

### Cron-Jobs

CtxPost fuehrt vier automatisierte Hintergrundjobs aus:

| Job | Intervall | Zweck |
|-----|-----------|-------|
| **Posts veroeffentlichen** | Jede Minute | Geplante Posts veroeffentlichen |
| **Analytics abrufen** | Alle 6 Stunden | Engagement-Metriken aktualisieren |
| **Evergreen recyceln** | Taeglich | Evergreen-Content wiederverwenden |
| **RSS Auto-Post** | Stuendlich | Posts aus RSS-Feeds erstellen |

---

## DSGVO & Datenschutz

CtxPost ist fuer vollstaendige EU-DSGVO-Konformitaet konzipiert.

### Implementierte Artikel

| Artikel | Anforderung | Umsetzung |
|---------|-------------|-----------|
| Art. 5 | Datenminimierung | Nur notwendige Daten erhoben |
| Art. 6 | Rechtmaessigkeit | Einwilligung + berechtigtes Interesse |
| Art. 7 | Einwilligung | Checkbox bei Registrierung mit Versionierung |
| Art. 12 | Transparenz | Vollstaendige Datenschutzerklaerung in 5 Sprachen |
| Art. 13/14 | Informationspflicht | Alle Pflichtangaben vorhanden |
| Art. 15 | Auskunftsrecht | `/api/user/export` - vollstaendiger JSON-Datenexport |
| Art. 17 | Recht auf Loeschung | `/api/user/delete` - kaskadierte Loeschung |
| Art. 20 | Datenportabilitaet | Maschinenlesbarer JSON-Export |
| Art. 25 | Privacy by Design | Lokale KI, verschluesselte Tokens |
| Art. 30 | Verarbeitungsverzeichnis | Audit-Logging fuer alle Aktionen |
| Art. 32 | Sicherheit | AES-256-GCM, bcrypt, HTTPS, CSP, HSTS |
| Art. 77 | Beschwerderecht | Aufsichtsbehoerde dokumentiert |

### Einwilligungsverwaltung

- Nutzer muessen Datenschutzerklaerung + AGB bei der Registrierung akzeptieren
- Einwilligung wird mit Zeitstempel, IP, User-Agent und Policy-Version gespeichert
- Nutzer koennen Einwilligung unter **Einstellungen > Datenschutz** einsehen und widerrufen

### Datenexport

Nutzer koennen alle ihre Daten als JSON exportieren:

1. Gehe zu **Einstellungen > Datenschutz**
2. Klicke **Meine Daten exportieren**
3. Download enthaelt: Profil, Posts, Analytics, Konten, Medien, Einwilligungs-Logs, Audit-Logs

### Kontoloeschung

Vollstaendige Kontoloeschung mit Kaskade:

1. Gehe zu **Einstellungen > Datenschutz**
2. Klicke **Mein Konto loeschen**
3. Tippe "DELETE" zur Bestaetigung
4. Alle Daten werden dauerhaft entfernt

---

## Sicherheit

### Verschluesselung

| Daten | Methode | Details |
|-------|---------|---------|
| OAuth-Tokens | AES-256-GCM | Zufaelliger IV, authentifizierte Verschluesselung |
| Passwoerter | bcrypt | 12 Salt-Runden |
| Transport | TLS 1.3 | Ende-zu-Ende HTTPS |

### Sicherheits-Header

| Header | Wert |
|--------|------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| X-XSS-Protection | `1; mode=block` |
| Content-Security-Policy | Striktes CSP mit `frame-ancestors 'none'` |

### Ratenbegrenzung

| Endpunkt | Limit |
|----------|-------|
| Auth (Login/Registrierung) | 10 Anfragen/Minute |
| KI-Generierung | 20 Anfragen/Minute |
| Datei-Upload | 10 Anfragen/Minute |
| Allgemeine API | 60 Anfragen/Minute |

---

## Deployment

### Option A: PM2 (Empfohlen fuer VPS)

```bash
npm run build
pm2 start ecosystem.config.js
```

### Option B: Docker Compose

```bash
cp .env.example .env
docker compose up -d
```

### Option C: Cloudflare Tunnel (Heimserver)

```bash
# Siehe setup-tunnel.sh fuer Konfiguration
# Erstellt HTTPS-Tunnel ohne Ports zu oeffnen
cloudflared tunnel run ctxpost
```

### Produktions-Checkliste

- [ ] Einzigartige Secrets generieren (`AUTH_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`)
- [ ] `AUTH_URL` und `NEXTAUTH_URL` auf Produktionsdomain setzen
- [ ] HTTPS aktivieren (Cloudflare Tunnel, certbot oder nginx)
- [ ] CSP-Domains in `next.config.ts` aktualisieren
- [ ] Redirect-URIs in allen Developer-Konsolen konfigurieren
- [ ] Cron-Jobs fuer automatisches Veroeffentlichen einrichten
- [ ] Datenbank-Backups aktivieren

---

## Fehlerbehebung

### Haeufige Probleme

#### "Database connection refused"
```bash
# PostgreSQL pruefen
sudo systemctl start postgresql
```

#### "Ollama not responding"
```bash
# Pruefen ob Ollama laeuft
curl http://localhost:11434/api/tags
ollama serve
```

#### "OAuth callback error"
- Redirect-URIs muessen exakt uebereinstimmen (inkl. Protokoll)
- `AUTH_URL` muss mit deiner tatsaechlichen Domain uebereinstimmen

#### "Build schlaegt fehl"
```bash
rm -rf .next
npx prisma generate
npm run build
```

---

## Beitragen

Beitraege sind willkommen!

1. Repository forken
2. Feature-Branch erstellen: `git checkout -b feature/mein-feature`
3. Aenderungen committen: `git commit -m "Add mein feature"`
4. Pushen: `git push origin feature/mein-feature`
5. Pull Request oeffnen

---

## Lizenz

MIT-Lizenz - Siehe [LICENSE](LICENSE) fuer Details.
