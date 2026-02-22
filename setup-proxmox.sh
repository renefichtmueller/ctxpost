#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Social Scheduler - Proxmox Setup-Skript
# ═══════════════════════════════════════════════════════════
#
# Dieses Skript richtet die Social Scheduler App auf einem
# Proxmox Server in einem Docker-Container ein.
#
# Voraussetzungen:
#   - Proxmox VE mit einer Debian/Ubuntu VM oder LXC
#   - Root-Zugang auf der VM/LXC
#   - Internetzugang
#
# Nutzung:
#   1. Erstelle eine neue VM oder LXC in Proxmox (Debian 12 empfohlen)
#   2. SSH in die VM/LXC
#   3. Kopiere den gesamten Projektordner auf den Server
#   4. Führe dieses Skript aus: bash setup-proxmox.sh
# ═══════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════"
echo "  Social Scheduler - Proxmox Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# ─── Schritt 1: System aktualisieren ─────────────────────
echo "[1/6] System wird aktualisiert..."
apt-get update -qq
apt-get upgrade -y -qq

# ─── Schritt 2: Docker installieren ──────────────────────
echo "[2/6] Docker wird installiert..."
if ! command -v docker &> /dev/null; then
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    echo "  ✓ Docker installiert"
else
    echo "  ✓ Docker bereits vorhanden"
fi

# Docker Compose prüfen
if ! docker compose version &> /dev/null; then
    echo "  Docker Compose Plugin wird installiert..."
    apt-get install -y -qq docker-compose-plugin
fi
echo "  ✓ Docker Compose verfügbar"

# ─── Schritt 3: Umgebungsvariablen einrichten ─────────────
echo "[3/6] Umgebungsvariablen werden konfiguriert..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    # Sichere Passwörter generieren
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '=/+' | head -c 32)
    AUTH_SECRET=$(openssl rand -base64 32)
    CRON_SECRET=$(openssl rand -base64 32)

    # Server-IP ermitteln
    SERVER_IP=$(hostname -I | awk '{print $1}')

    cat > "$ENV_FILE" << EOF
# ─── Automatisch generiert am $(date) ───
POSTGRES_USER=scheduler
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=social_scheduler

AUTH_SECRET=${AUTH_SECRET}
NEXTAUTH_URL=http://${SERVER_IP}

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=http://${SERVER_IP}/api/social/facebook/callback

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://${SERVER_IP}/api/social/linkedin/callback

ANTHROPIC_API_KEY=
CRON_SECRET=${CRON_SECRET}
EOF

    echo "  ✓ .env Datei erstellt mit sicheren Passwörtern"
    echo "  ℹ Server-IP erkannt: ${SERVER_IP}"
    echo ""
    echo "  WICHTIG: Bearbeite die .env Datei und trage deine API-Keys ein:"
    echo "    nano $ENV_FILE"
    echo ""
else
    echo "  ✓ .env Datei existiert bereits"
fi

# ─── Schritt 4: Docker Images bauen ──────────────────────
echo "[4/6] Docker Images werden gebaut (kann einige Minuten dauern)..."
cd "$SCRIPT_DIR"
docker compose build --no-cache

echo "  ✓ Docker Images gebaut"

# ─── Schritt 5: Container starten ────────────────────────
echo "[5/6] Container werden gestartet..."
docker compose up -d

echo "  ✓ Container gestartet"

# ─── Schritt 6: Datenbank-Migration ──────────────────────
echo "[6/6] Datenbank-Migration wird ausgeführt..."
sleep 5  # Warten bis die DB bereit ist

docker compose exec app npx prisma migrate deploy 2>/dev/null || \
docker compose exec app npx prisma db push 2>/dev/null || \
echo "  ⚠ Migration muss manuell ausgeführt werden"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Setup abgeschlossen!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  App erreichbar unter: http://${SERVER_IP:-DEINE_IP}"
echo ""
echo "  Nächste Schritte:"
echo "  1. API-Keys in .env eintragen: nano $ENV_FILE"
echo "  2. Container neu starten: docker compose restart"
echo ""
echo "  Nützliche Befehle:"
echo "    Logs anzeigen:     docker compose logs -f"
echo "    Status prüfen:     docker compose ps"
echo "    Neustart:          docker compose restart"
echo "    Stoppen:           docker compose down"
echo "    Aktualisieren:     docker compose build && docker compose up -d"
echo ""
